import winston from "winston";
import "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat=printf(({level,message,timestamp})=>{
    return `[${timestamp}] ${level}: ${message}`;
});

const fileRotateTransport=new winston.transports.DailyRotateFile({
    filename:"logs/app-%DATE%.log",
    datePattern:"YYYY-MM-DD",
    maxFiles:"14d",
    maxSize:"20m",
});

const logger=winston.createLogger({
    level:process.env.NODE_ENV==="development"?"debug":"info",
    format:combine(
        timestamp({format:"YYYY-MM-DD HH:mm:ss"}),
        logFormat
    ),
    transports:[
        fileRotateTransport,
        new winston.transports.Console({
            format:combine(colorize(),logFormat),
        }),
    ],
});

export default logger;
