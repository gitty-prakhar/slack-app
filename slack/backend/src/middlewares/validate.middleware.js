import { z } from "zod"; //use for schema validation
import { ApiError } from "../utils/apiError.js";

//validate is a higher-order function that takes a zod schema and returns a middleware
//it validates the req.body against the schema and throws an ApiError if invalid
//this ensures invalid data never reaches the controller
const validate=(schema)=>(req,res,next)=>{
    const result=schema.safeParse(req.body);
    if(!result.success){
        //extract all error messages into a flat array
        const errors=result.error.errors.map(e=>`${e.path.join(".")}: ${e.message}`);
        return next(new ApiError(400,errors[0],errors));
    }
    req.body=result.data; //replace body with parsed+validated data
    next();
};

// ---- Schemas ---- //

export const registerSchema=z.object({
    username:z.string().min(3,"Username must be at least 3 characters").max(30),
    email:z.string().email("Invalid email address"),
    password:z.string().min(8,"Password must be at least 8 characters"),
});

export const loginSchema=z.object({
    email:z.string().email("Invalid email address").optional(),
    username:z.string().min(1).optional(),
    password:z.string().min(1,"Password is required"),
}).refine(data=>data.email||data.username,{
    message:"Email or username is required",
});

export const sendMessageSchema=z.object({
    content:z.string().min(1,"Message cannot be empty").max(4000,"Message too long"),
});

export const createWorkspaceSchema=z.object({
    name:z.string().min(2,"Workspace name must be at least 2 characters").max(80),
    description:z.string().max(300).optional(),
});

export const createChannelSchema=z.object({
    name:z.string().min(2,"Channel name must be at least 2 characters").max(80),
    description:z.string().max(300).optional(),
    isPrivate:z.boolean().optional(),
    members:z.array(z.string()).optional(),
});

export { validate };
