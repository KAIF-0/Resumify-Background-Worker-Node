import { processQueue } from "../config/redis.queue";
import { Request, Response } from "express";

export const handleAddJob = async (req: Request, res: Response) => {
  try {
    const { portfolioId, key } = await req.body;

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

    return res.json({
      success: true,
      message: "Job added successfully!",
    });
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return res.json({
        success: false,
        message: error.message,
      });
    } else {
      return res.json({
        success: true,
        message: "Failed to add Job!",
      });
    }
  }
};
