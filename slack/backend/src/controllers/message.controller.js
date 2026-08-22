import { Message } from "../models/message.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../socket.js";

//get messages in a channel
const getMessages=asyncHandler(async(req,res)=>{
    const{channelId}=req.params;
    const{page=1,limit=50}=req.query;

    const channel=await Channel.findById(channelId);
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }

    //verification of access can be added here if it's a private channel

    const messages=await Message.find({channel:channelId,parentMessage:null})
        .populate("sender","username displayName avatar")
        .sort({createdAt:-1})
        .skip((page-1)*limit)
        .limit(parseInt(limit));

    //Reverse to send oldest first on frontend
    return res.status(200).json(new APIResponse(200,messages.reverse(),"Messages fetched successfully"));
});

//send message
const sendMessage = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Message content is required");
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const message = await Message.create({
        channel: channelId,
        sender: req.user._id,
        content
    });

    // Populate sender info for the real-time event
    await message.populate("sender", "username displayName avatar");

    // Emit socket event to the channel room
    const io = getIO();
    io.to(channelId).emit("new_message", message);

    return res.status(201).json(
        new APIResponse(201, message, "Message sent successfully")
    );
});

// Delete message (soft delete)
const deleteMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own messages");
    }

    message.isDeleted = true;
    message.content = "This message was deleted";
    await message.save();

    // Emit real-time event for deletion
    const io = getIO();
    io.to(message.channel.toString()).emit("message_deleted", { id: message._id });

    return res.status(200).json(
        new APIResponse(200, message, "Message deleted successfully")
    );
});

// Toggle Reaction
const toggleReaction = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
        throw new ApiError(400, "Emoji is required");
    }

    const message = await Message.findById(messageId);
    if (!message) {
        throw new ApiError(404, "Message not found");
    }

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);

    if (reactionIndex > -1) {
        // Emoji exists, check if user has reacted
        const userIndex = message.reactions[reactionIndex].users.indexOf(req.user._id);
        if (userIndex > -1) {
            // Remove user from reaction
            message.reactions[reactionIndex].users.splice(userIndex, 1);
            // If no users left for this emoji, remove the emoji object
            if (message.reactions[reactionIndex].users.length === 0) {
                message.reactions.splice(reactionIndex, 1);
            }
        } else {
            // Add user to existing reaction
            message.reactions[reactionIndex].users.push(req.user._id);
        }
    } else {
        // Add new emoji reaction
        message.reactions.push({
            emoji,
            users: [req.user._id]
        });
    }

    await message.save();

    // Populate sender info so frontend doesn't lose it on reaction update
    await message.populate("sender", "username displayName avatar");

    // Emit real-time event for reaction
    const io = getIO();
    io.to(message.channel.toString()).emit("reaction_updated", message);

    return res.status(200).json(
        new APIResponse(200, message, "Reaction toggled successfully")
    );
});

// Reply to message
const replyMessage = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Reply content is required");
    }

    const parentMessage = await Message.findById(messageId);
    if (!parentMessage) {
        throw new ApiError(404, "Parent message not found");
    }

    const reply = await Message.create({
        channel: parentMessage.channel,
        sender: req.user._id,
        content,
        parentMessage: messageId
    });

    await reply.populate("sender", "username displayName avatar");

    // Emit socket event for real-time thread updates
    const io = getIO();
    io.to(parentMessage.channel.toString()).emit("new_reply", reply);

    return res.status(201).json(
        new APIResponse(201, reply, "Reply sent successfully")
    );
});

// Search messages
const searchMessages = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        throw new ApiError(400, "Search query is required");
    }

    // Perform case-insensitive regex search
    const messages = await Message.find({
        content: { $regex: q, $options: "i" },
        isDeleted: false
    })
        .populate("sender", "username displayName avatar")
        .populate("channel", "name")
        .limit(20);

    return res.status(200).json(
        new APIResponse(200, messages, "Search results fetched successfully")
    );
});

// Mark channel as read
const markAsRead = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // Update all messages in the channel to add user to readBy array if not already present
    await Message.updateMany(
        { channel: channelId, readBy: { $ne: req.user._id } },
        { $push: { readBy: req.user._id } }
    );

    return res.status(200).json(
        new APIResponse(200, {}, "Messages marked as read")
    );
});

// Get replies for a message
const getReplies = asyncHandler(async (req, res) => {
    const { messageId } = req.params;

    const replies = await Message.find({ parentMessage: messageId, isDeleted: false })
        .populate("sender", "username displayName avatar")
        .sort({ createdAt: 1 }); // oldest first for threads

    return res.status(200).json(
        new APIResponse(200, replies, "Replies fetched successfully")
    );
});

export {
    getMessages,
    sendMessage,
    deleteMessage,
    toggleReaction,
    replyMessage,
    searchMessages,
    markAsRead,
    getReplies
};
