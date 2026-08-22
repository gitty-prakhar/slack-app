import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const connection = { 
    host: process.env.REDIS_HOST || "localhost", 
    port: process.env.REDIS_PORT || 6379 
};

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, 
        pass: process.env.SMTP_PASS, 
    },
});

const worker = new Worker(
    "email",
    async (job) => {
        if (job.name === "sendOTP" || job.name === "sendPasswordReset") {
            const { email, subject, message } = job.data;
            
            await transporter.sendMail({
                from: `"Slack Clone" <${process.env.SMTP_USER}>`, 
                to: email,
                subject: subject,
                text: message,
            });
            console.log(`Email sent successfully to ${email}`);
        }
    },
    { connection }
);

worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    console.log(`Job ${job.id} failed with error: ${err.message}`);
});
