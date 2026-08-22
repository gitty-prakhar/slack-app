//ye request ID middleware hai iska kaam har incoming HTTP request ko ek unique ID dena hai, taaki us request ko poore backend mein easily trace ya debug kar sako
import { v4 as uuidv4 } from "uuid"; //use for generating unique request ids

//requestId middleware attaches a unique X-Request-Id header to every request
//this makes it easy to trace logs and debug issues in production
export const requestId=(req,res,next)=>{
    const id=uuidv4();
    req.id=id; //attach to req for use in controllers/logging
    res.setHeader("X-Request-Id",id); //send back in response headers
    next();
};
