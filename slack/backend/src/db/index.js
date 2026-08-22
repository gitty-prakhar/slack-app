import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import logger from "../utils/logger.js";

//connects to mongoDB and returns a connection instance
//node.js has to communicate with the mongoDB server over the network
//that can take some time
//using async/await because this operation is time consuming
const connectDB=async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //connects to MongoDB with the specified URI and database name
        logger.info(`MongoDB connected successfully and host is ${connectionInstance.connection.host}`); //logs the connection instance to the console
        //it will display the host - that what server of mongodb is connected
    }
    catch(err){
        logger.error(`MongoDB connection failed: ${err.message}`);
        process.exit(1);    //exit from the application if connection fails
    }
}

//exports the connectDB function to be used in other files
export default connectDB;
