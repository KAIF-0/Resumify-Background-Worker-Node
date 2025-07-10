"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processQueue = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// console.log(process.env.REDIS_INSTANCE_URL);
exports.processQueue = new bullmq_1.Queue("processQueue", {
    connection: {
        url: process.env.REDIS_INSTANCE_URL,
    },
});
