import { Channel } from "../models/channel.model.js";
import { Member } from "../models/member.model.js";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//create channel
const createChannel=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;
    const{name,description,isPrivate,members}=req.body;

    if(!name){
        throw new ApiError(400,"Channel name is required");
    }

    //verify user is member of workspace
    const isWorkspaceMember=await Member.findOne({workspace:workspaceId,user:req.user._id});
    if(!isWorkspaceMember){
        throw new ApiError(403,"You must be a member of the workspace to create a channel");
    }

    //prepare channel data
    const channelData={
        workspace:workspaceId,
        name:name.toLowerCase(),
        description,
        isPrivate:isPrivate||false,
        createdBy:req.user._id,
        members:isPrivate?[req.user._id,...(members||[])]:[]
    };

    const channel=await Channel.create(channelData);

    return res.status(201).json(new APIResponse(201,channel,"Channel created successfully"));
});

//list workspace channels
const getWorkspaceChannels=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    //verify user is member
    const isWorkspaceMember=await Member.findOne({workspace:workspaceId,user:req.user._id});
    if(!isWorkspaceMember){
        throw new ApiError(403,"Access denied");
    }

    //get public channels OR private channels where user is a member
    const channels=await Channel.find({
        workspace:workspaceId,
        $or:[{isPrivate:false},{members:req.user._id}]
    });

    return res.status(200).json(new APIResponse(200,channels,"Channels fetched successfully"));
});

//get channel details
const getChannel=asyncHandler(async(req,res)=>{
    const{channelId}=req.params;

    const channel=await Channel.findById(channelId).populate("members","username displayName avatar");
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }

    //verify access
    if(channel.isPrivate && !channel.members.some(id=>id.equals(req.user._id))){
        throw new ApiError(403,"You do not have access to this private channel");
    }

    return res.status(200).json(new APIResponse(200,channel,"Channel details fetched successfully"));
});

//delete channel
const deleteChannel=asyncHandler(async(req,res)=>{
    const{channelId}=req.params;

    const channel=await Channel.findById(channelId);
    if(!channel){
        throw new ApiError(404,"Channel not found");
    }

    // Verify admin rights
    const member=await Member.findOne({workspace:channel.workspace,user:req.user._id});
    if(!member||member.role!=="admin"){
        throw new ApiError(403,"Only workspace admins can delete channels");
    }

    // Cannot delete 'general' or 'random' default channels
    if(["general","random"].includes(channel.name)){
        throw new ApiError(400,"Cannot delete default channels");
    }

    await Channel.findByIdAndDelete(channelId);

    return res.status(200).json(new APIResponse(200,{},"Channel deleted successfully"));
});

export{createChannel,getWorkspaceChannels,getChannel,deleteChannel};
