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
exports.PortfolioSchema = exports.handleProcessingFail = exports.handleProcessingResume = exports.updatePortfolioStatus = exports.insertProfileData = void 0;
exports.deleteResume = deleteResume;
const client_1 = require("@prisma/client");
const prism_config_1 = require("../config/prism.config");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const gemini_config_1 = require("../config/gemini.config");
const zod_1 = require("zod");
const insertProfileData = (portfolioData, portfolioId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prism_config_1.prisma.portfolioData.create({
            data: Object.assign(Object.assign({}, portfolioData), { portfolio: {
                    connect: { id: portfolioId },
                } }),
        });
    }
    catch (error) {
        if (error instanceof Error)
            throw new Error(error.message);
        throw error;
    }
});
exports.insertProfileData = insertProfileData;
const updatePortfolioStatus = (portfolioId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prism_config_1.prisma.portfolio.update({
            where: {
                id: portfolioId,
            },
            data: {
                status: client_1.PortStatus.READY,
            },
        });
    }
    catch (error) {
        if (error instanceof Error)
            throw new Error(error.message);
        throw error;
    }
});
exports.updatePortfolioStatus = updatePortfolioStatus;
const handleProcessingResume = (resumeUrl) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!resumeUrl) {
            throw new Error("Resume URL needed!");
        }
        const resumePath = yield generateResumePath(resumeUrl);
        yield downloadResume(resumeUrl, resumePath);
        const loader = new pdf_1.PDFLoader(resumePath);
        const docs = yield loader.load();
        // console.log(docs[0]?.pageContent)
        const portfolioData = yield generateData((_a = docs[0]) === null || _a === void 0 ? void 0 : _a.pageContent);
        console.log("PortfolioData: ", portfolioData);
        return portfolioData;
    }
    catch (error) {
        if (error instanceof Error)
            throw new Error(error.message);
        throw error;
    }
});
exports.handleProcessingResume = handleProcessingResume;
function generateData(resumeData) {
    return __awaiter(this, void 0, void 0, function* () {
        const prompt = prompts_1.PromptTemplate.fromTemplate(`
You are an intelligent resume parser.

Rules:
- If input is NOT a resume, return null
- Missing fields → null
- Arrays → []
- Use "create: []" only at top-level relations

Resume Text:
{resumeData}
`);
        const structuredModel = gemini_config_1.model.withStructuredOutput(exports.PortfolioSchema);
        const chain = runnables_1.RunnableSequence.from([prompt, structuredModel]);
        const response = yield chain.invoke({
            resumeData,
        });
        // console.log("Structured Response: ", response);
        // response is already a JS object
        return response;
    });
}
function downloadResume(resumeUrl, localPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(resumeUrl);
        const buffer = yield res.arrayBuffer();
        yield promises_1.default.writeFile(localPath, Buffer.from(buffer));
    });
}
function deleteResume(resumeUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resumePath = yield generateResumePath(resumeUrl);
            yield promises_1.default.unlink(resumePath);
        }
        catch (error) {
            throw error;
        }
    });
}
function generateResumePath(resumeUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(resumeUrl);
        const resumeDir = path_1.default.join(__dirname, "../downloads");
        yield promises_1.default.mkdir(resumeDir, { recursive: true });
        const urlObj = new URL(resumeUrl);
        const fileName = path_1.default.basename(urlObj.pathname);
        const resumePath = path_1.default.join(resumeDir, fileName);
        return resumePath;
    });
}
function cleanPortfolioData(data) {
    const jsonString = data
        .trim()
        .replace(/^```json/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();
    const parsed = JSON.parse(jsonString);
    if (parsed === null)
        throw new Error("Not a resume!");
    // console.log("Parsed: ", parsed);
    const fixNullsAndLinks = (value, key) => {
        if (value === "null")
            return null;
        if (key === "link" || key === "github") {
            if (typeof value === "string" &&
                value !== "null" &&
                !value.startsWith("http")) {
                return `https://${value}`;
            }
            if (value === "null")
                return null;
        }
        return value;
    };
    const deepClean = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map((item) => deepClean(item));
        }
        else if (obj !== null && typeof obj === "object") {
            const result = {};
            for (const key in obj) {
                result[key] = fixNullsAndLinks(deepClean(obj[key]), key);
            }
            return result;
        }
        else {
            return obj;
        }
    };
    return deepClean(parsed);
}
const handleProcessingFail = (portfolioId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!portfolioId)
            return;
        yield prism_config_1.prisma.portfolio.update({
            where: {
                id: portfolioId,
            },
            data: {
                status: client_1.PortStatus.ERROR,
            },
        });
    }
    catch (error) {
        if (error instanceof Error)
            throw new Error(error.message);
        throw error;
    }
});
exports.handleProcessingFail = handleProcessingFail;
exports.PortfolioSchema = zod_1.z.object({
    name: zod_1.z.string().nullable(),
    title: zod_1.z.string().nullable(),
    photo: zod_1.z.string().url().nullable(),
    summary: zod_1.z.string().nullable(),
    email: zod_1.z.string().email().nullable(),
    github: zod_1.z.string().url().nullable(),
    linkedIn: zod_1.z.string().url().nullable(),
    phone: zod_1.z.string().nullable(),
    location: zod_1.z.string().nullable(),
    softSkills: zod_1.z.array(zod_1.z.string()),
    achievements: zod_1.z.array(zod_1.z.string()),
    experience: zod_1.z.object({
        create: zod_1.z.array(zod_1.z.object({
            company: zod_1.z.string().nullable(),
            role: zod_1.z.string().nullable(),
            startDate: zod_1.z.string().nullable(),
            endDate: zod_1.z.string().nullable(),
            description: zod_1.z.string().nullable(),
        })),
    }),
    projects: zod_1.z.object({
        create: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().nullable(),
            description: zod_1.z.string().nullable(),
            technologies: zod_1.z.array(zod_1.z.string()),
            link: zod_1.z.string().url().nullable(),
            github: zod_1.z.string().url().nullable(),
        })),
    }),
    skills: zod_1.z.object({
        create: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().nullable(),
            skills: zod_1.z.array(zod_1.z.string()),
        })),
    }),
    education: zod_1.z.object({
        create: zod_1.z.array(zod_1.z.object({
            institution: zod_1.z.string().nullable(),
            degree: zod_1.z.string().nullable(),
            year: zod_1.z.string().nullable(),
        })),
    }),
});
