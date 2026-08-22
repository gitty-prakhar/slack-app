//errorHandler is a middleware that handles errors
//without this the app will crash if an error occurs
//this will provide a custom error response
//the errorhandler is defined last in the code
//so it can catch errors from all the other middlewares and routes
export const errorHandler=(err,req,res,next)=>{
    const statusCode=err.statusCode||500;
    const message=err.message||"Internal Server Error";

    return res.status(statusCode).json({
        success:false,
        statusCode,
        message,
        errors:err.errors||[],
    });
};
