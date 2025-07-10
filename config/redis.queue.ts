import { Queue } from "bullmq";
import { config } from "dotenv";

config();

// console.log(process.env.REDIS_INSTANCE_URL);

export const processQueue = new Queue("processQueue", {
  connection: {
    url: process.env.REDIS_INSTANCE_URL,
  },
});
