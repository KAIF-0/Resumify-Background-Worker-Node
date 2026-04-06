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
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = exports.PROCESS_QUEUE_NAME = void 0;
const rabbitmq_config_1 = require("./rabbitmq.config");
exports.PROCESS_QUEUE_NAME = "processQueue";
class ProcessQueue {
    constructor() {
        this.activeJobKeys = new Set();
        this.isInitialized = false;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized)
                return;
            const channel = yield rabbitmq_config_1.rabbitMQClient.getPublishChannel();
            yield channel.assertQueue(exports.PROCESS_QUEUE_NAME, { durable: true });
            this.isInitialized = true;
        });
    }
    hasJob(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initialize();
            return this.activeJobKeys.has(key);
        });
    }
    add(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            yield this.initialize();
            if (this.activeJobKeys.has(payload.key)) {
                return false;
            }
            this.activeJobKeys.add(payload.key);
            const message = Object.assign(Object.assign({}, payload), { attempts: (_a = payload.attempts) !== null && _a !== void 0 ? _a : 3, attemptsMade: (_b = payload.attemptsMade) !== null && _b !== void 0 ? _b : 0, backoff: (_c = payload.backoff) !== null && _c !== void 0 ? _c : 5000 });
            try {
                yield this.publish(message);
                return true;
            }
            catch (error) {
                this.activeJobKeys.delete(payload.key);
                throw error;
            }
        });
    }
    publish(payload_1) {
        return __awaiter(this, arguments, void 0, function* (payload, delay = 0) {
            const channel = yield rabbitmq_config_1.rabbitMQClient.getPublishChannel();
            const message = Buffer.from(JSON.stringify(payload));
            if (delay > 0) {
                yield new Promise((resolve, reject) => {
                    setTimeout(() => {
                        channel.sendToQueue(exports.PROCESS_QUEUE_NAME, message, { persistent: true }, (err) => {
                            if (err)
                                return reject(err);
                            resolve();
                        });
                    }, delay);
                });
                return;
            }
            yield new Promise((resolve, reject) => {
                channel.sendToQueue(exports.PROCESS_QUEUE_NAME, message, { persistent: true }, (err) => {
                    if (err)
                        return reject(err);
                    resolve();
                });
            });
        });
    }
    releaseJobKey(key) {
        if (!key)
            return;
        this.activeJobKeys.delete(key);
    }
}
exports.processQueue = new ProcessQueue();
