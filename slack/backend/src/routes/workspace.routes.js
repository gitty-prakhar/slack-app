import { Router } from "express";
import { 
    createWorkspace, 
    getUserWorkspaces, 
    getWorkspace, 
    joinWorkspace, 
    getWorkspaceMembers 
} from "../controllers/workspace.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, createWorkspaceSchema } from "../middlewares/validate.middleware.js";

const router = Router();

// All workspace routes require authentication
router.use(verifyJWT);

router.route("/")
    .post(validate(createWorkspaceSchema), createWorkspace)
    .get(getUserWorkspaces);

router.route("/:workspaceId")
    .get(getWorkspace);

router.route("/:workspaceId/join")
    .post(joinWorkspace);

router.route("/:workspaceId/members")
    .get(getWorkspaceMembers);

export default router;
