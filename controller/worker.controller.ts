import { Job, Worker } from "bullmq";
import { config } from "dotenv";
import {
  deleteResume,
  handleProcessingFail,
  handleProcessingResume,
  insertProfileData,
  updatePortfolioStatus,
} from "../helper/worker.helper";
config();

export const worker = new Worker(
  "processQueue",
  async (job: Job) => {
    const { portfolioId, key, resumeUrl } = job.data;

    try {
      console.log("JOB DATA: ", portfolioId, resumeUrl);
      const generatedPortfolioData = await handleProcessingResume(resumeUrl);
      await insertProfileData(generatedPortfolioData, portfolioId);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing job for key ${key}: ${error.message}`);
        throw error;
      }
    }
  },
  {
    connection: {
      url: process.env.REDIS_INSTANCE_URL,
    },
    concurrency: 5,
  }
);

worker.on("completed", async (job: Job) => {
  try {
    const { portfolioId, key, resumeUrl } = job.data;
    await updatePortfolioStatus(portfolioId);

    //coolodown halt
    await new Promise((resolve) => setTimeout(resolve, 5000));
    await deleteResume(resumeUrl);
    console.log(`Job ${job?.id} completed successfully`);
  } catch (error) {
    console.log("Resume Processing Job Success handling failed!");
  }
});

worker.on("failed", async (job: Job | undefined, err: Error) => {
  if (!job) {
    console.error("Job is undefined in failed handler");
    return;
  }
  const { portfolioId, resumeUrl } = job?.data;

  //cleanup
  await Promise.all([
    deleteResume(resumeUrl),
    handleProcessingFail(portfolioId),
  ])
    .then(() => {
      console.log(`Resume Processing Job failure handling successfull!`);
    })
    .catch((error) => {
      console.log(
        `Resume Processing Job failure handling failed: `,
        error.message
      );
    });
});
