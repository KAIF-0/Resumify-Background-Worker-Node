"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = void 0;
const google_genai_1 = require("@langchain/google-genai");
exports.model = new google_genai_1.ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    temperature: 0,
});
