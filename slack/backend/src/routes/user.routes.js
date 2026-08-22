import { Router } from "express";
import { 
    registerUser, 
    verifyRegistration, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    getCurrentUser, 
    changeCurrentPassword, 
    forgotPassword, 
    resetPassword 
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.route("/register").post(authLimiter, registerUser);
router.route("/verify-otp").post(authLimiter, verifyRegistration);
router.route("/login").post(authLimiter, loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(authLimiter, forgotPassword);
router.route("/reset-password").post(authLimiter, resetPassword);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);

export default router;
