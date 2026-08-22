import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        logger.info(`MongoDB connected successfully and host is ${connectionInstance.connection.host}`);
    }
    catch(err){
        logger.error(`MongoDB connection failed: ${err.message}`);
        process.exit(1);
    }
}

//exports the connectDB function to be used in other files
export default connectDB;
