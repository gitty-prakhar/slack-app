import express from "express";
import cors from "cors"; 
import cookieParser from "cookie-parser"; 
import compression from "compression";  
import helmet from "helmet";    
import morgan from "morgan";   
import { globalLimiter } from "./middlewares/rateLimiter.middleware.js";
import { requestId } from "./middlewares/requestId.middleware.js";

const app=express();

app.use(compression());

app.use(helmet({crossOriginResourcePolicy:false}));

app.use(morgan("dev"));

//Ccors read allowed origins from .env
const allowedOrigins=process.env.CORS_ORIGIN
    ?process.env.CORS_ORIGIN.split(",").map(o=>o.trim())
    :true;

app.use(
    cors({
        origin:allowedOrigins,
        credentials:true,
    })
);

// Attach a unique X-Request-Id to every request
app.use(requestId);

// Apply global rate limiter
app.use(globalLimiter);

app.use(express.json({limit:"16kb"}));  //this middleware parses incoming json helps in destructuring in req.body
app.use(express.urlencoded({extended:true,limit:"16kb"}));  //this middleware parses incoming url encoded data  extended=true allows nested objects

app.use(cookieParser()); //this middleware parses incoming cookies from the browser stores them in req.cookies

// Health Check endpoint — returns DB status, uptime, and memory
import mongoose from "mongoose";
app.get("/api/v1/health",(req,res)=>{
    const memUsage=process.memoryUsage();
    res.status(200).json({
        success:true,
        status:"OK",
        uptime:`${Math.floor(process.uptime())}s`,
        db:mongoose.connection.readyState===1?"connected":"disconnected",
        memory:{
            heapUsed:`${Math.round(memUsage.heapUsed/1024/1024)}MB`,
            heapTotal:`${Math.round(memUsage.heapTotal/1024/1024)}MB`,
        },
        timestamp:new Date().toISOString(),
    });
});

// routes import
import userRouter from "./routes/user.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import channelRouter from "./routes/channel.routes.js";
import messageRouter from "./routes/message.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/channels", channelRouter);
app.use("/api/v1/messages", messageRouter);

// Error handling middleware
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export default app;