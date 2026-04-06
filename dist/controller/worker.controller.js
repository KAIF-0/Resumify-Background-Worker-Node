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
exports.worker = void 0;
const worker_helper_1 = require("../helper/worker.helper");
const process_queue_1 = require("../config/process.queue");
const rabbitmq_config_1 = require("../config/rabbitmq.config");
class ResumeWorker {
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield process_queue_1.processQueue.initialize();
            const consumerChannel = yield rabbitmq_config_1.rabbitMQClient.createConsumerChannel(5);
            yield consumerChannel.assertQueue(process_queue_1.PROCESS_QUEUE_NAME, { durable: true });
            yield consumerChannel.consume(process_queue_1.PROCESS_QUEUE_NAME, (message) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleMessage(message, consumerChannel);
            }));
        });
    }
    handleMessage(message, consumerChannel) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!message)
                return;
            const payload = JSON.parse(message.content.toString());
            const { portfolioId, key, resumeUrl } = payload;
            try {
                console.log("JOB DATA: ", portfolioId, resumeUrl);
                const generatedPortfolioData = yield (0, worker_helper_1.handleProcessingResume)(resumeUrl);
                yield (0, worker_helper_1.insertProfileData)(generatedPortfolioData, portfolioId);
                yield this.handleCompleted(payload);
                process_queue_1.processQueue.releaseJobKey(key);
                consumerChannel.ack(message);
            }
            catch (error) {
                if (error instanceof Error) {
                    console.error(`Error processing job for key ${key}: ${error.message}`);
                }
                const totalRetries = (_a = payload.attempts) !== null && _a !== void 0 ? _a : 3;
                const attemptsMade = ((_b = payload.attemptsMade) !== null && _b !== void 0 ? _b : 0) + 1;
                const retriesLeft = totalRetries - attemptsMade;
                if (retriesLeft > 0) {
                    console.log(`Job ${key} failed but will be retried. Attempts made: ${attemptsMade}`);
                    consumerChannel.ack(message);
                    yield process_queue_1.processQueue.publish(Object.assign(Object.assign({}, payload), { attemptsMade }), (_c = payload.backoff) !== null && _c !== void 0 ? _c : 5000);
                    return;
                }
                yield this.handleFailed(payload);
                process_queue_1.processQueue.releaseJobKey(key);
                consumerChannel.ack(message);
            }
        });
    }
    handleCompleted(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { portfolioId, resumeUrl, key } = payload;
                yield (0, worker_helper_1.updatePortfolioStatus)(portfolioId);
                //coolodown halt
                yield new Promise((resolve) => setTimeout(resolve, 5000));
                yield (0, worker_helper_1.deleteResume)(resumeUrl);
                console.log(`Job ${key} completed successfully`);
            }
            catch (error) {
                console.log("Resume Processing Job Success handling failed!");
            }
        });
    }
    handleFailed(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { portfolioId, resumeUrl } = payload;
            yield Promise.all([
                (0, worker_helper_1.deleteResume)(resumeUrl),
                (0, worker_helper_1.handleProcessingFail)(portfolioId),
            ])
                .then(() => {
                console.log(`Resume Processing Job failure handling successfull!`);
            })
                .catch((error) => {
                console.log(`Resume Processing Job failure handling failed: `, error.message);
            });
        });
    }
}
exports.worker = new ResumeWorker();
exports.worker.start().catch((error) => {
    console.error("Failed to start worker:", error.message);
});
