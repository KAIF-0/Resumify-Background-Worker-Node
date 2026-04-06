import amqp, { Channel, ChannelModel, ConfirmChannel } from "amqplib";
import { config } from "dotenv";

config();

class RabbitMQClient {
  private connection: ChannelModel | null = null;
  private publishChannel: ConfirmChannel | null = null;

  private getConnectionUrl() {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
      throw new Error("RabbitMQ URL missing! Set RABBITMQ_URL.");
    }
    return url;
  }

  public async connect() {
    if (this.connection) return this.connection;
    this.connection = await amqp.connect(this.getConnectionUrl());
    return this.connection;
  }

  public async getPublishChannel() {
    if (this.publishChannel) return this.publishChannel;
    const connection = await this.connect();
    this.publishChannel = await connection.createConfirmChannel();
    return this.publishChannel;
  }

  public async createConsumerChannel(prefetch = 5): Promise<Channel> {
    const connection = await this.connect();
    const channel = await connection.createChannel();
    channel.prefetch(prefetch);
    return channel;
  }
}

export const rabbitMQClient = new RabbitMQClient();
