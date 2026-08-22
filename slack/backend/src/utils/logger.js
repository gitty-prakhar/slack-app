import winston from "winston";
import "winston-daily-rotate-file";

const{combine,timestamp,printf,colorize}=winston.format;

//lets you decide how the log format
const logFormat=printf(({level,message,timestamp})=>{
    return `[${timestamp}] ${level}: ${message}`;
});

//used to transport logs to files (daily basis)
const fileRotateTransport=new winston.transports.DailyRotateFile({
    filename:"logs/app-%DATE%.log",
    datePattern:"YYYY-MM-DD",
    maxFiles:"14d", //keeps log for 14 days
    maxSize:"20m",  //a log file can grow up to 20 MB
})

//we are basically just creating our logger instance here
const logger=winston.createLogger({
    level:process.env.NODE_ENV==="development"?"debug":"info", //if the environment is development then show debug logs otherwise show info logs
    format:combine(
        timestamp({format:"YYYY-MM-DD HH:mm:ss"}), //this will add a timestamp to the log
        logFormat
    ),
    transports:[
        fileRotateTransport, //this will log to files
        new winston.transports.Console({
            format:combine(colorize(),logFormat), //this will log to console in different colors
        }),
    ],
});

export default logger;
