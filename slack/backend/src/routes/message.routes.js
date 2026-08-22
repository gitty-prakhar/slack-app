import { Router } from "express";
import { getMessages, sendMessage, deleteMessage, toggleReaction, replyMessage, searchMessages, markAsRead,getReplies } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, sendMessageSchema } from "../middlewares/validate.middleware.js";

const router=Router();

router.route("/search").get(verifyJWT,searchMessages);
router.route("/:channelId").get(verifyJWT,getMessages).post(verifyJWT,validate(sendMessageSchema),sendMessage);
router.route("/:messageId").delete(verifyJWT,deleteMessage);
router.route("/:messageId/replies").get(verifyJWT,getReplies);
router.route("/:messageId/react").post(verifyJWT,toggleReaction);
router.route("/:messageId/reply").post(verifyJWT,replyMessage);
router.route("/:channelId/read").post(verifyJWT,markAsRead);

export default router;
