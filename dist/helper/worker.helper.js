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
exports.handleProcessingFail = exports.handleProcessingResume = exports.updatePortfolioStatus = exports.insertProfileData = void 0;
exports.deleteResume = deleteResume;
const client_1 = require("@prisma/client");
const prism_config_1 = require("../config/prism.config");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const pdf_1 = require("@langchain/community/document_loaders/fs/pdf");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
const gemini_config_1 = require("../config/gemini.config");
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
    You are an intelligent parser that extracts structured portfolio information from resume text. The input will be the full extracted text from a resume (in plain text). Your goal is to return a valid JavaScript object named "portfolioData" with the following structure.

If the input is not a resume (e.g., a blog post, essay, or random notes), respond with: "null"

If any field is missing, set its value to "null". For arrays, set them to empty arrays (e.g., []). For nested relational fields like experience, projects, skills, and education, use create: [] in curly brackets only at the top level (not inside each item).


🧾 Format:

portfolioData = {portfolioData}

INPUT TEXT: {resumeData}

Now output should be only in portfolioData JSON object format.
 
    `);
        const chain = runnables_1.RunnableSequence.from([prompt, gemini_config_1.model]);
        const response = (yield chain.invoke({
            resumeData,
            portfolioData,
        })).text;
        // console.log(response);
        //cleaning unstructured data
        const cleanedData = cleanPortfolioData(response);
        return cleanedData;
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
const portfolioData = {
    name: "John Doe",
    title: "Full Stack Developer",
    photo: "https://example.com/photo.jpg",
    summary: "Creative and detail-oriented developer with 5+ years of experience in building scalable web applications.",
    email: "john.doe@example.com",
    github: "https://github.com/johndoe",
    linkedIn: "https://www.linkedin.com/in/kaif-khan-47bb19292",
    phone: "+1 123 456 7890",
    location: "San Francisco, CA",
    softSkills: ["Teamwork", "Problem Solving", "Communication"],
    achievements: [
        "Complete Full Stack Web Developemnt from Physics Wallah",
        "Organized, Volunteered and Participated in 3+ Hackathon",
    ],
    experience: {
        create: [
            {
                company: "Google",
                role: "Software Engineer",
                startDate: "2019-01-01",
                endDate: "2022-12-31",
                description: "Worked on scalable systems and internal tools for Google Cloud Platform.",
            },
            {
                company: "StartupX",
                role: "Frontend Developer",
                startDate: "2017-06-01",
                endDate: "2018-12-31",
                description: "Built and maintained responsive user interfaces using React.",
            },
        ],
    },
    projects: {
        create: [
            {
                name: "AI Chatbot",
                description: "A GPT-powered customer support chatbot integrated into websites.",
                technologies: ["React", "Node.js", "OpenAI API"],
                link: "https://aichatbot.example.com",
                github: "https://github.com/johndoe/aichatbot",
            },
            {
                name: "Portfolio Generator",
                description: "App to generate developer portfolios from resumes.",
                technologies: ["Next.js", "Tailwind", "Prisma"],
                link: "https://portfolio-gen.example.com",
                github: "https://github.com/johndoe/portfolio-gen",
            },
        ],
    },
    skills: {
        create: [
            {
                name: "Frontend",
                skills: ["React", "Next.js", "Tailwind CSS", "Framer Motion"],
            },
            {
                name: "Backend",
                skills: ["Node.js", "Express", "Prisma", "PostgreSQL"],
            },
        ],
    },
    education: {
        create: [
            {
                institution: "MIT",
                degree: "B.Tech in Computer Science",
                year: "2017",
            },
        ],
    },
};
