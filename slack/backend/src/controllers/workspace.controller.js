import { Workspace } from "../models/workspace.model.js";
import { Member } from "../models/member.model.js";
import { Channel } from "../models/channel.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//create workspace
const createWorkspace=asyncHandler(async(req,res)=>{
    const{name,description}=req.body;

    if(!name){
        throw new ApiError(400,"Workspace name is required");
    }

    const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now();
    //will use slug for creatig name in url for easy access like slack.com/workspace/prakhar-workspace-123456

    const workspace=await Workspace.create({name,description,slug,owner:req.user._id});

    //add owner as an admin member
    await Member.create({workspace:workspace._id,user:req.user._id,role:"admin"});

    //create default channels
    await Channel.create([
        {workspace:workspace._id,name:"general",createdBy:req.user._id},
        {workspace:workspace._id,name:"random",createdBy:req.user._id}
    ]);

    return res.status(201).json(new APIResponse(201,workspace,"Workspace created successfully"));
});

//get user's workspaces
const getUserWorkspaces=asyncHandler(async(req,res)=>{
    const memberships=await Member.find({user:req.user._id}).populate("workspace");
    const workspaces=memberships.map(m=>m.workspace);

    return res.status(200).json(new APIResponse(200,workspaces,"User workspaces fetched successfully"));
});

//get single workspace
const getWorkspace=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const workspace=await Workspace.findById(workspaceId).populate("owner","username email displayName avatar");

    if(!workspace){
        throw new ApiError(404,"Workspace not found");
    }

    //check if user is a member
    const isMember=await Member.findOne({workspace:workspaceId,user:req.user._id});
    if(!isMember){
        throw new ApiError(403,"You are not a member of this workspace");
    }

    return res.status(200).json(new APIResponse(200,workspace,"Workspace fetched successfully"));
});

//join workspace
const joinWorkspace=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const workspace=await Workspace.findById(workspaceId);
    if(!workspace){
        throw new ApiError(404,"Workspace not found");
    }

    const existingMember=await Member.findOne({workspace:workspaceId,user:req.user._id});
    if(existingMember){
        throw new ApiError(400,"You are already a member of this workspace");
    }

    const member=await Member.create({
        workspace:workspaceId,
        user:req.user._id,
        role:"member"
    });

    return res.status(200).json(new APIResponse(200,member,"Successfully joined workspace"));
});

//get workspace members
const getWorkspaceMembers=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const members=await Member.find({workspace:workspaceId}).populate("user","username email displayName avatar isOnline lastSeen");

    return res.status(200).json(new APIResponse(200,members,"Workspace members fetched successfully"));
});

//delete workspace
const deleteWorkspace=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const workspace=await Workspace.findById(workspaceId);
    if(!workspace){
        throw new ApiError(404,"Workspace not found");
    }

    //only owner can delete workspace
    if(workspace.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"Only the workspace owner can delete this workspace");
    }

    //get all channels in this workspace
    const channels=await Channel.find({workspace:workspaceId});

    //use .map to store only channel ids and stire in the array
    const channelIds=channels.map(c=>c._id);

    //delete all messages in those channels
    // $in = "value should be one of these given values
    if(channelIds.length>0){
        await Message.deleteMany({channel:{$in:channelIds}});
    }

    //delete all channels
    await Channel.deleteMany({workspace:workspaceId});

    //delete all members
    await Member.deleteMany({workspace:workspaceId});

    //delete workspace
    await Workspace.findByIdAndDelete(workspaceId);

    return res.status(200).json(new APIResponse(200,{},"Workspace and all associated data deleted successfully"));
});

export{createWorkspace,getUserWorkspaces,getWorkspace,joinWorkspace,getWorkspaceMembers,deleteWorkspace};
