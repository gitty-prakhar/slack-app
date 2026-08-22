import logger from "../utils/logger.js";

//errorHandler is a middleware that handles errors
//without this the app will crash if an error occurs
export const errorHandler=(err,req,res,next)=>{
    let statusCode=err.statusCode||500;
    
    if (statusCode >= 500) {
        logger.error("ERROR CAUGHT IN errorHandler: " + err.stack);
    }
    let message=err.message||"Internal Server Error";
    let errors=err.errors||[];

    //handle mongoose duplicate key errors globally (E11000)
    if(err.code===11000&&err.keyValue){
        statusCode=409; //conflict
        const fields=Object.keys(err.keyValue);
        
        //if the duplicate index involves multiple fields (like workspace+name or workspace+user)
        if(fields.length>1){
            if(fields.includes('workspace')&&fields.includes('name')){
                message=`A channel with the name '${err.keyValue.name}' already exists in this workspace.`;
            }else if(fields.includes('workspace')&&fields.includes('user')){
                message="This user is already a member of this workspace.";
            }else{
                message="A record with these details already exists.";
            }
        }else{
            //single field duplicate (like email, username, slug)
            const field=fields[0];
            message=`${field.charAt(0).toUpperCase()+field.slice(1)} '${err.keyValue[field]}' already exists. Please use a different one.`;
        }
    }

    //handle mongoose validation errors globally
    if(err.name==="ValidationError"){
        statusCode=400; //bad request
        message=Object.values(err.errors).map(val=>val.message).join(", ");
    }

    return res.status(statusCode).json({
        success:false,
        statusCode,
        message,
        errors,
    });
};
