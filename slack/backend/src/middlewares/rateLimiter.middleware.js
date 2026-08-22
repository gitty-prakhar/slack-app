import rateLimit from "express-rate-limit"; //use for rate limiting the requests

export const globalLimiter=rateLimit({
    windowMs:15*60*1000, //15 minute window
    max:process.env.NODE_ENV==="development"?5000:500, //limit each IP (relaxed in dev)
    standardHeaders:true, //return rate limit info in the `RateLimit-*` headers
    legacyHeaders:false, //disable the `X-RateLimit-*` headers
    //in express-rate-limit v7+ handler only receives (req,res,options) — no next
    handler:(req,res)=>{
        res.status(429).json({
            success:false,
            statusCode:429,
            message:"Too many requests from this IP. Please try again after 15 minutes.",
            errors:[],
        });
    }
});

export const authLimiter=rateLimit({
    windowMs:60*60*1000, //1 hour window
    max:process.env.NODE_ENV==="development"?1000:20, //limit each IP (relaxed in dev)
    standardHeaders:true, //return rate limit info in the `RateLimit-*` headers
    legacyHeaders:false, //disable the `X-RateLimit-*` headers
    //in express-rate-limit v7+ handler only receives (req,res,options) — no next
    handler:(req,res)=>{
        res.status(429).json({
            success:false,
            statusCode:429,
            message:"Too many authentication attempts. Please try again later.",
            errors:[],
        });
    }
});
