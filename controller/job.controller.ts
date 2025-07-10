import { HTTPException } from "hono/http-exception";
import { processQueue } from "../config/redis.queue";
import { Context } from "hono";

export const handleAddJob = async (c: Context) => {
  try {
    const { portfolioId, key } = await c.req.json();

    console.log(portfolioId, key);

    const job = await processQueue.getJob(key);
    if (!job) {
      await processQueue.add(
        "processResumeJob",
        { portfolioId, key },
        {
          jobId: key,
          removeOnComplete: true,
          removeOnFail: true,
          attempts: 3,
          backoff: 5000,
        }
      );
      console.log("Job added successfully!");
    } else {
      console.log("Job already exists!");
    }

    return c.json({
      success: true,
      message: "Job added successfully!",
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      throw new HTTPException(500, {
        message: error.message,
      });
    } else {
      throw new HTTPException(500, {
        message: "Failed to add resume processing Job!",
      });
    }
  }
};
