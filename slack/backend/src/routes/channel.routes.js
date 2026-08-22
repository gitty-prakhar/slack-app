import { Router } from "express";
import { createChannel, getWorkspaceChannels, getChannel, deleteChannel } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

//workspace scoped routes
router.route("/workspace/:workspaceId").post(verifyJWT,createChannel).get(verifyJWT,getWorkspaceChannels);

//individual channel routes
router.route("/:channelId").get(verifyJWT,getChannel).delete(verifyJWT,deleteChannel);

export default router;
