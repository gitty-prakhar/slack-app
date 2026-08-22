import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        channel: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"Channel",
            required:true,
        },
        sender:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        content:{
            type:String,
            required:true,
        },
        isDeleted:{
            type:Boolean,
            default:false,
        },
        parentMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        reactions: [
            {
                emoji: String,
                users: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                    },
                ],
            },
        ],
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
