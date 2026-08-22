import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
//middleware to verify jwt token
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        const token=req.cookies?.accessToken||req.header("Authorization")?.replace("Bearer ","");
        
        if(!token){
            throw new ApiError(401,"Unauthorised Request\n");
        }
    
        const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401,"Invalid Access Token\n");
        }
        req.user=user;
        next(); 
    } 
    catch(error){
        throw new ApiError(401,error?.message||"Invalid Access Token\n");
    }
})

export const verifyAdmin=(req,res,next)=>{
    if(req.user&&req.user.role==="admin"){
        next();
    }
    else{
        throw new ApiError(403,"Access denied.Admins only.");
    }
}