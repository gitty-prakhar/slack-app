import { Router } from "express";
import { createWorkspace, getUserWorkspaces, getWorkspace, joinWorkspace, getWorkspaceMembers } from "../controllers/workspace.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, createWorkspaceSchema } from "../middlewares/validate.middleware.js";

const router=Router();

router.route("/").post(verifyJWT,validate(createWorkspaceSchema),createWorkspace).get(verifyJWT,getUserWorkspaces);
router.route("/:workspaceId").get(verifyJWT,getWorkspace);
router.route("/:workspaceId/join").post(verifyJWT,joinWorkspace);
router.route("/:workspaceId/members").get(verifyJWT,getWorkspaceMembers);

export default router;
