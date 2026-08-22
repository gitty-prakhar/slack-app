import mongoose from "mongoose";

const channelSchema=new mongoose.Schema(
    {
        workspace:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Workspace",
            required:true,
        },
        name:{
            type:String,
            required:true,
            trim:true,
            lowercase:true,
        },
        description:{
            type:String,
            trim:true,
            default:"",
        },
        isPrivate:{
            type:Boolean,
            default:false,
        },
        createdBy: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        members:[
            {
                type:mongoose.Schema.Types.ObjectId,
                ref:"User",
            },
        ],
        lastActivity:{
            type:Date,
            default:Date.now,
        },
    },
    {timestamps:true}
);

//for ensuring channel names are unique within a workspace
channelSchema.index({workspace:1,name:1},{unique:true});

export const Channel=mongoose.model("Channel",channelSchema);
