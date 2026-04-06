import { Channel, ConsumeMessage } from "amqplib";
import {
  deleteResume,
  handleProcessingFail,
  handleProcessingResume,
  insertProfileData,
  updatePortfolioStatus,
} from "../helper/worker.helper";
import {
  processQueue,
  ProcessResumeJobPayload,
  PROCESS_QUEUE_NAME,
} from "../config/process.queue";
import { rabbitMQClient } from "../config/rabbitmq.config";

class ResumeWorker {
  public async start() {
    await processQueue.initialize();
    const consumerChannel = await rabbitMQClient.createConsumerChannel(5);

    await consumerChannel.assertQueue(PROCESS_QUEUE_NAME, { durable: true });
    await consumerChannel.consume(PROCESS_QUEUE_NAME, async (message) => {
      await this.handleMessage(message, consumerChannel);
    });
  }

  private async handleMessage(message: ConsumeMessage | null, consumerChannel: Channel) {
    if (!message) return;

    const payload = JSON.parse(
      message.content.toString()
    ) as ProcessResumeJobPayload;

    const { portfolioId, key, resumeUrl } = payload;

    try {
      console.log("JOB DATA: ", portfolioId, resumeUrl);
      const generatedPortfolioData = await handleProcessingResume(resumeUrl as string);
      await insertProfileData(generatedPortfolioData, portfolioId);

      await this.handleCompleted(payload);
      processQueue.releaseJobKey(key);
      consumerChannel.ack(message);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error processing job for key ${key}: ${error.message}`);
      }

      const totalRetries = payload.attempts ?? 3;
      const attemptsMade = (payload.attemptsMade ?? 0) + 1;
      const retriesLeft = totalRetries - attemptsMade;

      if (retriesLeft > 0) {
        console.log(
          `Job ${key} failed but will be retried. Attempts made: ${attemptsMade}`
        );
        consumerChannel.ack(message);
        await processQueue.publish(
          {
            ...payload,
            attemptsMade,
          },
          payload.backoff ?? 5000
        );
        return;
      }

      await this.handleFailed(payload);
      processQueue.releaseJobKey(key);
      consumerChannel.ack(message);
    }
  }

  private async handleCompleted(payload: ProcessResumeJobPayload) {
    try {
      const { portfolioId, resumeUrl, key } = payload;
    await updatePortfolioStatus(portfolioId);

      //coolodown halt
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await deleteResume(resumeUrl as string);
      console.log(`Job ${key} completed successfully`);
    } catch (error) {
      console.log("Resume Processing Job Success handling failed!");
    }
  }

  private async handleFailed(payload: ProcessResumeJobPayload) {
    const { portfolioId, resumeUrl } = payload;

    await Promise.all([
      deleteResume(resumeUrl as string),
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
  }
}

export const worker = new ResumeWorker();
worker.start().catch((error) => {
  console.error("Failed to start worker:", error.message);
});
