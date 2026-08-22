import { Workspace } from "../models/workspace.model.js";
import { Member } from "../models/member.model.js";
import { Channel } from "../models/channel.model.js";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create workspace
const createWorkspace=asyncHandler(async(req,res)=>{
    const{name,description}=req.body;

    if(!name){
        throw new ApiError(400,"Workspace name is required");
    }

    const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+Date.now();

    const workspace=await Workspace.create({
        name,
        description,
        slug,
        owner:req.user._id
    });

    // Add owner as an admin member
    await Member.create({
        workspace:workspace._id,
        user:req.user._id,
        role:"admin"
    });

    // Create default channels
    await Channel.create([
        {workspace:workspace._id,name:"general",createdBy:req.user._id},
        {workspace:workspace._id,name:"random",createdBy:req.user._id}
    ]);

    return res.status(201).json(new APIResponse(201,workspace,"Workspace created successfully"));
});

// Get user's workspaces
const getUserWorkspaces=asyncHandler(async(req,res)=>{
    const memberships=await Member.find({user:req.user._id}).populate("workspace");
    const workspaces=memberships.map(m=>m.workspace);

    return res.status(200).json(new APIResponse(200,workspaces,"User workspaces fetched successfully"));
});

// Get single workspace
const getWorkspace=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const workspace=await Workspace.findById(workspaceId).populate("owner","username email displayName avatar");

    if(!workspace){
        throw new ApiError(404,"Workspace not found");
    }

    // Check if user is a member
    const isMember=await Member.findOne({workspace:workspaceId,user:req.user._id});
    if(!isMember){
        throw new ApiError(403,"You are not a member of this workspace");
    }

    return res.status(200).json(new APIResponse(200,workspace,"Workspace fetched successfully"));
});

// Join workspace
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

// Get workspace members
const getWorkspaceMembers=asyncHandler(async(req,res)=>{
    const{workspaceId}=req.params;

    const members=await Member.find({workspace:workspaceId}).populate("user","username email displayName avatar isOnline lastSeen");

    return res.status(200).json(new APIResponse(200,members,"Workspace members fetched successfully"));
});

export{createWorkspace,getUserWorkspaces,getWorkspace,joinWorkspace,getWorkspaceMembers};
