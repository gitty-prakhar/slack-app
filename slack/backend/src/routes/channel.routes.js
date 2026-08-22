import { Router } from "express";
import { 
    createChannel, 
    getWorkspaceChannels, 
    getChannel, 
    deleteChannel 
} from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All channel routes require authentication
router.use(verifyJWT);

router.route("/:workspaceId")
    .post(createChannel)
    .get(getWorkspaceChannels);

router.route("/:channelId")
    .get(getChannel)
    .delete(deleteChannel);

export default router;
