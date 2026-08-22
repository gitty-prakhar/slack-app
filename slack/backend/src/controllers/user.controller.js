import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { emailQueue } from "../queues/emailQueue.js";
import { ApiError } from "../utils/apiError.js";
import { APIResponse } from "../utils/apiResponse.js";


//helper function to generate tokens
const generateAccessAndRefreshTokens=async(userID)=>{
    try{
        const user=await User.findById(userID);
        const accessToken =user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();
        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return{accessToken,refreshToken};
    } 
    catch(err){
        console.error("Token Generation Error:",err);
        throw new ApiError(500,"Something went wrong while generating tokens");
    }
};

//register
const registerUser=asyncHandler(async(req,res)=>{
    const{email,username,password}=req.body;//destructuring

    if(!email||!username||!password){
        throw new ApiError(400,"All fields are required");
    }
    if(password.length<8){
        throw new ApiError(400,"Password must be at least 8 characters");
    }

    //check if a fully verified user already exists with same email/username
    const existingVerified=await User.findOne({
        $or:[{username:username.toLowerCase()},{email:email.toLowerCase()}],
        isVerified:true,
    });

    if(existingVerified){
        throw new ApiError(409,"An account with this email or username already exists");
    }

    const otp=Math.floor(100000+Math.random()*900000).toString();
    const otpExpiry=new Date(Date.now()+15*60*1000); //15 minutes

    //upsert:update unverified account or create new one
    let user=await User.findOne({
        $or:[{username:username.toLowerCase()},{email:email.toLowerCase()}],
        isVerified:false,
    });

    if(user){
        //update existing unverified user's password + new OTP
        user.password=password;
        user.verificationOtp=otp;
        user.verificationOtpExpiry=otpExpiry;
        await user.save();
    } 
    else{
        //create fresh unverified user
        user=await User.create({
            email:email.toLowerCase(),
            username:username.toLowerCase(),
            password,
            isVerified:false,
            verificationOtp:otp,
            verificationOtpExpiry:otpExpiry,
        });
    }

    //send OTP email asynchronously using BullMQ
    try{
        await emailQueue.add("sendOTP",{
            email:user.email,
            subject:"IRCTC—Verify Your Email",
            message:`Welcome to IRCTC!\n\nYour registration OTP is: ${otp}\n\nThis OTP is valid for 15 minutes. Do not share it with anyone.`,
        });
    } 
    catch(err){
        //if adding to queue fails,delete the user so they can try again
        await User.findByIdAndDelete(user._id);
        throw new ApiError(500,"Failed to queue OTP email. Please try again.");
    }

    return res.status(200).json(new APIResponse(200,{email:user.email},"OTP sent to your email. Please verify to complete registration."));
});

//verify registration
const verifyRegistration=asyncHandler(async(req,res)=>{
    const{email,otp}=req.body;

    if(!email||!otp){
        throw new ApiError(400,"Email and OTP are required");
    }

    const user=await User.findOne({
        email:email.toLowerCase(),
        verificationOtp:otp.toString(),
        isVerified:false,
    });

    if(!user){
        throw new ApiError(400,"Invalid OTP or email. Please register again.");
    }

    if(user.verificationOtpExpiry<new Date()){
        //cleanup expired user
        await User.findByIdAndDelete(user._id);
        throw new ApiError(400,"OTP has expired. Please register again.");
    }

    user.isVerified=true;
    user.verificationOtp=null;
    user.verificationOtpExpiry=null;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new APIResponse(200,{},"Email verified! Your account is now active. Please login."));
});

//login
const loginUser=asyncHandler(async(req,res)=>{
    const {username,email,password}=req.body;

    if(!email&&!username){
        throw new ApiError(400,"Username or email is required");
    }
    if(!password){
        throw new ApiError(400,"Password is required");
    }

    const identifier=email||username;   //take email if it exist otherwise take username
    const user=await User.findOne({
        $or:[
            {email:identifier.toLowerCase()},
            {username:identifier.toLowerCase()}
        ]
    }).select("+password +refreshToken");

    if(!user){
        throw new ApiError(404,"No account found with this email or username");
    }

    //block unverified users
    if(!user.isVerified){
        throw new ApiError(403,"Please verify your email before logging in. Check your inbox for the OTP.");
    }

    const isPasswordCorrect=await user.isPasswordCorrect(password);
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid password");
    }

    const{accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id);
    const loggedInUser=await User.findById(user._id).select("-password -refreshToken");

    const cookieOptions={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"?true:false,
        sameSite:process.env.NODE_ENV==="production"?"none":"lax",//protects against csrf attacks
    };

    return res
        .status(200)
        .cookie("accessToken",accessToken,cookieOptions)
        .cookie("refreshToken",refreshToken,cookieOptions)
        .json(new APIResponse(200,{user:loggedInUser,accessToken,refreshToken},"User logged in successfully"));
});

//logout
const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{$unset:{refreshToken:1}},{new:true});
    //special mongodb operator $unset removes the refreshToken field from the user's document in MongoDB
    const cookieOptions={ 
        httpOnly:true, 
        secure:process.env.NODE_ENV==="production"?true:false,
        sameSite:process.env.NODE_ENV==="production"?"none":"lax",
    };

    return res
        .status(200)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .json(new APIResponse(200,{},"Logged out successfully"));
});

//refresh access token
const refreshAccessToken=asyncHandler(async(req,res)=>{
    //req contains information about the incoming request
    const incomingToken=req.cookies.refreshToken||req.body.refreshToken;    //look for the refresh token in cookies else look for in body
    if(!incomingToken)throw new ApiError(401,"Unauthorized request");
    try{
        const decoded=jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET);
        const user=await User.findById(decoded?._id).select("+refreshToken");
        if(!user)throw new ApiError(401,"Invalid refresh token");
        if(incomingToken!==user.refreshToken)throw new ApiError(401,"Refresh token is expired or used");

        const{accessToken,refreshToken:newRefreshToken}=await generateAccessAndRefreshTokens(user._id);
        const cookieOptions={ 
            httpOnly:true, 
            secure:process.env.NODE_ENV==="production"?true:false,
            sameSite:process.env.NODE_ENV==="production"?"none":"lax",
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken,cookieOptions)
            .cookie("refreshToken",newRefreshToken,cookieOptions)
            .json(new APIResponse(200,{accessToken,refreshToken:newRefreshToken},"Access token refreshed"));
    } 
    catch(error){
        throw new ApiError(401,error.message||"Invalid refresh token");
    }
});

//current user
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200).json(new APIResponse(200,req.user,"Current user fetched successfully"));
});

//change password
const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const{oldPassword,newPassword}=req.body;

    if(!oldPassword||!newPassword)throw new ApiError(400,"Both old and new passwords are required");
    if(newPassword.length<8)throw new ApiError(400,"New password must be at least 8 characters");

    const user=await User.findById(req.user._id).select("+password");
    if(!await user.isPasswordCorrect(oldPassword))throw new ApiError(400,"Old password is incorrect");

    user.password=newPassword;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new APIResponse(200,{},"Password changed successfully"));
});

//forgot password
const forgotPassword=asyncHandler(async(req,res)=>{
    const{email}=req.body;
    if(!email)throw new ApiError(400,"Email is required");

    const user=await User.findOne({email:email.toLowerCase(),isVerified:true});
    if(!user)throw new ApiError(404,"No verified account found with this email");

    const otp=Math.floor(100000+Math.random()*900000).toString();
    user.forgotPasswordOtp=otp;
    user.forgotPasswordOtpExpiry=new Date(Date.now()+15*60*1000);
    await user.save({validateBeforeSave:false});

    try {
        await emailQueue.add("sendPasswordReset",{
            email:user.email,
            subject:"IRCTC — Password Reset OTP",
            message:`Your password reset OTP is: ${otp}\n\nThis OTP is valid for 15 minutes. Do not share it with anyone.`,
        });
        return res.status(200).json(new APIResponse(200,{},"OTP sent to your email"));
    } 
    catch(err){
        user.forgotPasswordOtp=undefined;
        user.forgotPasswordOtpExpiry=undefined;
        await user.save({validateBeforeSave:false});
        throw new ApiError(500,"Failed to queue OTP email. Please try again.");
    }
});

//reset password
const resetPassword=asyncHandler(async(req,res)=>{
    const{email,otp,newPassword}=req.body;

    if(!email||!otp||!newPassword)throw new ApiError(400,"All fields are required");
    if(newPassword.length<8)throw new ApiError(400,"New password must be at least 8 characters");

    const user=await User.findOne({email:email.toLowerCase(),forgotPasswordOtp:otp});
    if(!user)throw new ApiError(400,"Invalid OTP or email");
    if(user.forgotPasswordOtpExpiry<new Date())throw new ApiError(400,"OTP has expired");

    user.password=newPassword;
    user.forgotPasswordOtp=undefined;
    user.forgotPasswordOtpExpiry=undefined;
    await user.save({validateBeforeSave:false});

    return res.status(200).json(new APIResponse(200,{},"Password reset successfully"));
});

export{registerUser,verifyRegistration,loginUser,logoutUser,refreshAccessToken,getCurrentUser,changeCurrentPassword,forgotPassword,resetPassword};