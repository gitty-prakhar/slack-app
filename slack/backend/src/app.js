import express from "express";
import cors from "cors"; 
import cookieParser from "cookie-parser"; 
import compression from "compression";  
import helmet from "helmet";    
import morgan from "morgan";   


const app=express();



app.use(compression());


app.use(helmet({crossOriginResourcePolicy:false}));

app.use(morgan("dev"));

app.use(
    cors({
        origin:true,
        credentials:true,
    })
);


app.use(express.json({limit:"16kb"}));  //this middleware parses incoming json helps in destructuring in req.body
app.use(express.urlencoded({extended:true,limit:"16kb"}));  //this middleware parses incoming url encoded data  extended=true allows nested objects

app.use(cookieParser()); //this middleware parses incoming cookies from the browser stores them in req.cookies

// routes import
import userRouter from "./routes/user.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import channelRouter from "./routes/channel.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/channels", channelRouter);

// Error handling middleware
import { errorHandler } from "./middlewares/error.middleware.js";
app.use(errorHandler);

export default app;