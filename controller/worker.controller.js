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
const bullmq_1 = require("bullmq");
const dotenv_1 = require("dotenv");
const worker_helper_1 = require("../helper/worker.helper");
(0, dotenv_1.config)();
exports.worker = new bullmq_1.Worker("processQueue", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { portfolioId, key, resumeUrl } = job.data;
    try {
        console.log("JOB DATA: ", portfolioId, resumeUrl);
        const generatedPortfolioData = yield (0, worker_helper_1.handleProcessingResume)(resumeUrl);
        yield (0, worker_helper_1.insertProfileData)(generatedPortfolioData, portfolioId);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error processing job for key ${key}: ${error.message}`);
            throw error;
        }
    }
}), {
    connection: {
        url: process.env.REDIS_INSTANCE_URL,
    },
    concurrency: 5,
});
exports.worker.on("completed", (job) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { portfolioId, key, resumeUrl } = job.data;
        yield (0, worker_helper_1.updatePortfolioStatus)(portfolioId);
        //coolodown halt
        yield new Promise((resolve) => setTimeout(resolve, 5000));
        yield (0, worker_helper_1.deleteResume)(resumeUrl);
        console.log(`Job ${job === null || job === void 0 ? void 0 : job.id} completed successfully`);
    }
    catch (error) {
        console.log("Resume Processing Job Success handling failed!");
    }
}));
exports.worker.on("failed", (job, err) => __awaiter(void 0, void 0, void 0, function* () {
    const { portfolioId, resumeUrl } = job === null || job === void 0 ? void 0 : job.data;
    //cleanup
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
}));
