"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rabbitMQClient = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class RabbitMQClient {
    constructor() {
        this.connection = null;
        this.publishChannel = null;
    }
    getConnectionUrl() {
        const url = process.env.RABBITMQ_URL;
        if (!url) {
            throw new Error("RabbitMQ URL missing! Set RABBITMQ_URL.");
        }
        return url;
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.connection)
                return this.connection;
            this.connection = yield amqplib_1.default.connect(this.getConnectionUrl());
            return this.connection;
        });
    }
    getPublishChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.publishChannel)
                return this.publishChannel;
            const connection = yield this.connect();
            this.publishChannel = yield connection.createConfirmChannel();
            return this.publishChannel;
        });
    }
    createConsumerChannel() {
        return __awaiter(this, arguments, void 0, function* (prefetch = 5) {
            const connection = yield this.connect();
            const channel = yield connection.createChannel();
            channel.prefetch(prefetch);
            return channel;
        });
    }
}
exports.rabbitMQClient = new RabbitMQClient();
