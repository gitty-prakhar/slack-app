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
    resetPassword,
    updateProfile
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { validate, registerSchema, loginSchema } from "../middlewares/validate.middleware.js";

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 * 
 * /users/me:
 *   get:
 *     summary: Get current logged-in user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched current user
 *       401:
 *         description: Unauthorized
 */

const router = Router();

router.route("/register").post(authLimiter, validate(registerSchema), registerUser);
router.route("/verify-otp").post(authLimiter, verifyRegistration);
router.route("/login").post(authLimiter, validate(loginSchema), loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(authLimiter, forgotPassword);
router.route("/reset-password").post(authLimiter, resetPassword);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").patch(verifyJWT, changeCurrentPassword);
router.route("/profile").patch(verifyJWT, updateProfile);

export default router;
