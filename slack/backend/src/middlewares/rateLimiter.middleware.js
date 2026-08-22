import rateLimit from "express-rate-limit"; //use for rate limiting the requests
import { RedisStore } from "rate-limit-redis";  //use for storing the rate limit data in redis
import Redis from "ioredis"; //use for connecting to redis

//create a dedicated Redis connection for the rate limiter
const redisClient=process.env.REDIS_URL?new Redis(process.env.REDIS_URL):new Redis({
    host:process.env.REDIS_HOST||"127.0.0.1",
    port:process.env.REDIS_PORT||6379
});

export const globalLimiter=rateLimit({
    windowMs:15*60*1000, //15 minute window
    max:process.env.NODE_ENV==="development"?5000:500, //limit each IP (relaxed in dev)
    standardHeaders:true, //return rate limit info in the `RateLimit-*` headers
    legacyHeaders:false, //disable the `X-RateLimit-*` headers
    store:new RedisStore({
        sendCommand:(...args)=>redisClient.call(...args),
    }),
    handler:(req,res)=>{
        res.status(429).json({
            success:false,
            statusCode:429,
            message:"Too many requests from this IP. Please try again after 15 minutes.",
            errors:[],
        });
    }
});
