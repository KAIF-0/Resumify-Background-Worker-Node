import { PortStatus } from "@prisma/client";
import { prisma } from "../config/prism.config";
import { PortfolioData } from "../utils/types";
import fs from "fs/promises";
import path, { parse } from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "../config/gemini.config";

export const insertProfileData = async (
  portfolioData: PortfolioData,
  portfolioId: string
) => {
  try {
    await prisma.portfolioData.create({
      data: {
        ...portfolioData,
        portfolio: {
          connect: { id: portfolioId },
        },
      } as any,
    });
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw error;
  }
};

export const updatePortfolioStatus = async (portfolioId: string) => {
  try {
    await prisma.portfolio.update({
      where: {
        id: portfolioId,
      },
      data: {
        status: PortStatus.READY,
      },
    });
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw error;
  }
};

export const handleProcessingResume = async (resumeUrl: string) => {
  try {
    if (!resumeUrl) {
      throw new Error("Resume URL needed!");
    }
    const resumePath = await generateResumePath(resumeUrl);

    await downloadResume(resumeUrl, resumePath);

    const loader = new PDFLoader(resumePath);
    const docs = await loader.load();

    // console.log(docs[0]?.pageContent)
    const portfolioData = await generateData(docs[0]?.pageContent);

    console.log("PortfolioData: ", portfolioData);

    return portfolioData;
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw error;
  }
};

async function generateData(resumeData: string) {
  const prompt = PromptTemplate.fromTemplate(`
    You are an intelligent parser that extracts structured portfolio information from resume text. The input will be the full extracted text from a resume (in plain text). Your goal is to return a valid JavaScript object named "portfolioData" with the following structure.

If the input is not a resume (e.g., a blog post, essay, or random notes), respond with: "null"

If any field is missing, set its value to "null". For arrays or objects, set them as "[]" or " create: [] " accordingly.

🧾 Format:

portfolioData = {portfolioData}

INPUT TEXT: {resumeData}

Now output should be only in portfolioData JSON object format.
 
    `);

  const chain = RunnableSequence.from([prompt, model]);

  const response = (
    await chain.invoke({
      resumeData,
      portfolioData,
    })
  ).text;

  // console.log(response);

  //cleaning unstructured data
  const cleanedData = cleanPortfolioData(response);

  return cleanedData;
}

async function downloadResume(resumeUrl: string, localPath: string) {
  const res = await fetch(resumeUrl);
  const buffer = await res.arrayBuffer();
  await fs.writeFile(localPath, Buffer.from(buffer));
}

export async function deleteResume(resumeUrl: string) {
  try {
    const resumePath = await generateResumePath(resumeUrl);

    await fs.unlink(resumePath);
  } catch (error) {
    throw error;
  }
}

async function generateResumePath(resumeUrl: string) {
  const res = await fetch(resumeUrl);
  const resumeDir = path.join(__dirname, "../downloads");
  await fs.mkdir(resumeDir, { recursive: true });

  const urlObj = new URL(resumeUrl);
  const fileName = path.basename(urlObj.pathname);
  const resumePath = path.join(resumeDir, fileName);

  return resumePath;
}

function cleanPortfolioData(data: any) {
  const jsonString = data
    .trim()
    .replace(/^```json/, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  const parsed = JSON.parse(jsonString);

  if (parsed === null) throw new Error("Not a resume!");

  console.log("Parsed: ", parsed);

  const fixNullsAndLinks = (value: any, key: string) => {
    if (value === "null") return null;

    if (key === "link" || key === "github") {
      if (
        typeof value === "string" &&
        value !== "null" &&
        !value.startsWith("http")
      ) {
        return `https://${value}`;
      }
      if (value === "null") return null;
    }

    return value;
  };

  const deepClean = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((item) => deepClean(item));
    } else if (obj !== null && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) {
        result[key] = fixNullsAndLinks(deepClean(obj[key]), key);
      }
      return result;
    } else {
      return obj;
    }
  };

  return deepClean(parsed);
}

export const handleProcessingFail = async (portfolioId: string) => {
  try {
    if (!portfolioId) return;
    await prisma.portfolio.update({
      where: {
        id: portfolioId,
      },
      data: {
        status: PortStatus.ERROR,
      },
    });
  } catch (error) {
    if (error instanceof Error) throw new Error(error.message);
    throw error;
  }
};

const portfolioData = {
  name: "John Doe",
  title: "Full Stack Developer",
  photo: "https://example.com/photo.jpg",
  summary:
    "Creative and detail-oriented developer with 5+ years of experience in building scalable web applications.",
  email: "john.doe@example.com",
  github: "https://github.com/johndoe",
  linkedIn: "https://www.linkedin.com/in/kaif-khan-47bb19292",
  phone: "+1 123 456 7890",
  location: "San Francisco, CA",
  softSkills: ["Teamwork", "Problem Solving", "Communication"],
  experience: {
    create: [
      {
        company: "Google",
        role: "Software Engineer",
        startDate: "2019-01-01",
        endDate: "2022-12-31",
        description:
          "Worked on scalable systems and internal tools for Google Cloud Platform.",
      },
      {
        company: "StartupX",
        role: "Frontend Developer",
        startDate: "2017-06-01",
        endDate: "2018-12-31",
        description:
          "Built and maintained responsive user interfaces using React.",
      },
    ],
  },
  projects: {
    create: [
      {
        name: "AI Chatbot",
        description:
          "A GPT-powered customer support chatbot integrated into websites.",
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
