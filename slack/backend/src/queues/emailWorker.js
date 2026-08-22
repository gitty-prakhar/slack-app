import { Worker } from "bullmq";
import { Resend } from "resend";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = { 
    host: process.env.REDIS_HOST || "localhost", 
    port: process.env.REDIS_PORT || 6379 
};

const worker = new Worker(
    "email",
    async (job) => {
        if (job.name === "sendOTP" || job.name === "sendPasswordReset") {
            const { email, subject, message } = job.data;
            
            const { data, error } = await resend.emails.send({
                from: "Slack Clone <onboarding@resend.dev>", // default test domain
                to: email,
                subject: subject,
                text: message,
            });

            if (error) {
                logger.error(`Resend failed to send email: ${error.message}`);
                throw new Error(error.message);
            }

            logger.info(`Email sent successfully via Resend to ${email}, id: ${data.id}`);
        }
    },
    { connection }
);

worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job, err) => {
    logger.error(`Job ${job.id} failed with error: ${err.message}`);
});

export default worker;
