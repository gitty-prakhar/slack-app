import { Router } from "express";
import { registerUser, verifyRegistration, loginUser, logoutUser, refreshAccessToken, getCurrentUser, changeCurrentPassword, forgotPassword, resetPassword, updateProfile, updateUserAvatar } from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { validate, registerSchema, loginSchema } from "../middlewares/validate.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router=Router();

router.route("/register").post(validate(registerSchema),registerUser);
router.route("/verify-otp").post(verifyRegistration);
router.route("/login").post(validate(loginSchema),loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

//secured routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/me").get(verifyJWT,getCurrentUser);
router.route("/change-password").patch(verifyJWT,changeCurrentPassword);
router.route("/profile").patch(verifyJWT,updateProfile);
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

export default router;
