import mongoose from "mongoose";

const memberSchema=new mongoose.Schema(
    {
        workspace:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Workspace",
            required:true,
        },
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        role:{
            type:String,
            enum: ["admin", "member"],
            default: "member",
        },
        joinedAt: {
            type:Date,
            default:Date.now,
        },
    },
    {timestamps:true}
);

//ensure a user can only be in a workspace once
memberSchema.index({workspace:1,user:1},{unique:true});

export const Member=mongoose.model("Member",memberSchema);
