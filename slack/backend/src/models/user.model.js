import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema=new mongoose.Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase: true,
            trim:true,
        },
        password:{
            type:String,
            required:true,
            minlength:8,
            select: false,
        },
        displayName:{
            type:String,
            trim:true,
        },
        avatar:{
            type:String,
            default:"",
        },
        bio:{
            type:String,
            trim:true,
            default:"",
        },
        instagramId:{
            type:String,
            trim:true,
            default:"",
        },
        lastSeen:{
            type:Date,
            default:Date.now,
        },
        isOnline:{
            type:Boolean,
            default:false,
        },

        //email verification (2FA registration)
        isVerified:{
            type:Boolean,
            default:false,
        },
        verificationOtp:{
            type:String,
            default:null,
        },
        verificationOtpExpiry:{
            type:Date,
            default:null,
        },

        forgotPasswordOtp:{
            type:String,
        },
        forgotPasswordOtpExpiry:{
            type:Date,
        },
        //for reset password 

        refreshToken:{
            type:String,
            select:false,
        },
    },
    {timestamps:true}
);

userSchema.pre("save",async function(){
    if(!this.isModified("password")) return;
    this.password=await bcrypt.hash(this.password,10);
});

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
};

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
    );
};

userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {_id:this._id},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:process.env.REFRESH_TOKEN_EXPIRY}
    );
};

export const User=mongoose.model("User",userSchema);
