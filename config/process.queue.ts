import { rabbitMQClient } from "./rabbitmq.config";

export const PROCESS_QUEUE_NAME = "processQueue";

export interface ProcessResumeJobPayload {
  portfolioId: string;
  key: string;
  resumeUrl?: string;
  attempts?: number;
  attemptsMade?: number;
  backoff?: number;
}

class ProcessQueue {
  private readonly activeJobKeys = new Set<string>();
  private isInitialized = false;

  public async initialize() {
    if (this.isInitialized) return;

    const channel = await rabbitMQClient.getPublishChannel();
    await channel.assertQueue(PROCESS_QUEUE_NAME, { durable: true });
    this.isInitialized = true;
  }

  public async hasJob(key: string) {
    await this.initialize();
    return this.activeJobKeys.has(key);
  }

  public async add(payload: ProcessResumeJobPayload) {
    await this.initialize();

    if (this.activeJobKeys.has(payload.key)) {
      return false;
    }

    this.activeJobKeys.add(payload.key);

    const message: ProcessResumeJobPayload = {
      ...payload,
      attempts: payload.attempts ?? 3,
      attemptsMade: payload.attemptsMade ?? 0,
      backoff: payload.backoff ?? 5000,
    };

    try {
      await this.publish(message);
      return true;
    } catch (error) {
      this.activeJobKeys.delete(payload.key);
      throw error;
    }
  }

  public async publish(payload: ProcessResumeJobPayload, delay = 0) {
    const channel = await rabbitMQClient.getPublishChannel();
    const message = Buffer.from(JSON.stringify(payload));

    if (delay > 0) {
      await new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          channel.sendToQueue(PROCESS_QUEUE_NAME, message, { persistent: true }, (err) => {
            if (err) return reject(err);
            resolve();
          });
        }, delay);
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      channel.sendToQueue(PROCESS_QUEUE_NAME, message, { persistent: true }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public releaseJobKey(key?: string) {
    if (!key) return;
    this.activeJobKeys.delete(key);
  }
}

export const processQueue = new ProcessQueue();
