import dotenv from "dotenv";    //dotenv helps to load environment variables from a .env file into process.env
dotenv.config({path:'./.env'}); //this loads environment variables from a .env file into process.env

import connectDB from "./db/index.js"; //imports the connectDB function
import app from "./app.js"; //imports the express app
import http from "http";
import mongoose from "mongoose";
import { initSocket } from "./socket.js";
import logger from "./utils/logger.js";

const server=http.createServer(app);
initSocket(server);

connectDB()
.then(()=>{
    let port=process.env.PORT||8000; //port is set to 8000 if process.env.PORT is not defined
    server.listen(port,()=>{
        logger.info(`Server running at port ${port}`);  //server is started on the specified port
    });
})
.catch((err)=>{
    logger.error(`MongoDB connection failed: ${err.message}`);
});

//graceful shutdown handler, closes DB and server cleanly on SIGTERM/SIGINT
//this prevents data corruption and ensures all requests finish before shutting down
const gracefulShutdown=(signal)=>{
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(async()=>{
        logger.info("HTTP server closed");
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
        process.exit(0);
    });

    //force shutdown if graceful shutdown takes too long or if shutdown get stuck
    setTimeout(()=>{
        logger.error("Forcefully shutting down");
        process.exit(1);
    },10000);
};

process.on("SIGTERM",()=>gracefulShutdown("SIGTERM"));
process.on("SIGINT",()=>gracefulShutdown("SIGINT"));