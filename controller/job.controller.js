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
exports.handleAddJob = void 0;
const http_exception_1 = require("hono/http-exception");
const redis_queue_1 = require("../config/redis.queue");
const handleAddJob = (c) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { portfolioId, key } = yield c.req.json();
        console.log(portfolioId, key);
        const job = yield redis_queue_1.processQueue.getJob(key);
        if (!job) {
            yield redis_queue_1.processQueue.add("processResumeJob", { portfolioId, key }, {
                jobId: key,
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: 5000,
            });
            console.log("Job added successfully!");
        }
        else {
            console.log("Job already exists!");
        }
        return c.json({
            success: true,
            message: "Job added successfully!",
        });
    }
    catch (error) {
        console.log(error);
        if (error instanceof Error) {
            throw new http_exception_1.HTTPException(500, {
                message: error.message,
            });
        }
        else {
            throw new http_exception_1.HTTPException(500, {
                message: "Failed to add resume processing Job!",
            });
        }
    }
});
exports.handleAddJob = handleAddJob;
