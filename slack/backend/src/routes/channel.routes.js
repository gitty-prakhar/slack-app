import { Router } from "express";
import { 
    createChannel, 
    getWorkspaceChannels, 
    getChannel, 
    deleteChannel 
} from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

// All channel routes require authentication
router.use(verifyJWT);

//workspace-scoped routes (create + list channels for a workspace)
router.route("/workspace/:workspaceId")
    .post(createChannel)
    .get(getWorkspaceChannels);

//individual channel routes (get details + delete)
router.route("/:channelId")
    .get(getChannel)
    .delete(deleteChannel);

export default router;
