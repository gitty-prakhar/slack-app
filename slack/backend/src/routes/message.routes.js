import { Router } from "express";
import { 
    getMessages, 
    sendMessage, 
    deleteMessage, 
    toggleReaction, 
    replyMessage, 
    searchMessages, 
    markAsRead 
} from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, sendMessageSchema } from "../middlewares/validate.middleware.js";

const router = Router();

// All message routes require authentication
router.use(verifyJWT);

// Put /search before /:channelId to avoid Express routing conflicts
router.route("/search")
    .get(searchMessages);

router.route("/:channelId")
    .get(getMessages)
    .post(validate(sendMessageSchema), sendMessage);

router.route("/:messageId")
    .delete(deleteMessage);

router.route("/:messageId/react")
    .post(toggleReaction);

router.route("/:messageId/reply")
    .post(replyMessage);

router.route("/:channelId/read")
    .post(markAsRead);

export default router;
