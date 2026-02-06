import { PortStatus } from "@prisma/client";
import { prisma } from "../config/prism.config";
import { PortfolioData } from "../utils/types";
import fs from "fs/promises";
import path, { parse } from "path";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "../config/gemini.config";
import { z } from "zod";

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
You are an intelligent resume parser.

Rules:
- If input is NOT a resume, return null
- Missing fields → null
- Arrays → []
- Use "create: []" only at top-level relations

Resume Text:
{resumeData}
`); 

 const structuredModel = model.withStructuredOutput(PortfolioSchema)

  const chain = RunnableSequence.from([prompt, structuredModel]);

  const response = await chain.invoke({
    resumeData,
  });
  // console.log("Structured Response: ", response);
  // response is already a JS object
  return response;
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

  // console.log("Parsed: ", parsed);

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

export const PortfolioSchema = z.object({
  name: z.string().nullable(),
  title: z.string().nullable(),
  photo: z.string().url().nullable(),
  summary: z.string().nullable(),

  email: z.string().email().nullable(),
  github: z.string().url().nullable(),
  linkedIn: z.string().url().nullable(),
  phone: z.string().nullable(),
  location: z.string().nullable(),

  softSkills: z.array(z.string()),
  achievements: z.array(z.string()),

  experience: z.object({
    create: z.array(
      z.object({
        company: z.string().nullable(),
        role: z.string().nullable(),
        startDate: z.string().nullable(),
        endDate: z.string().nullable(),
        description: z.string().nullable(),
      })
    ),
  }),

  projects: z.object({
    create: z.array(
      z.object({
        name: z.string().nullable(),
        description: z.string().nullable(),
        technologies: z.array(z.string()),
        link: z.string().url().nullable(),
        github: z.string().url().nullable(),
      })
    ),
  }),

  skills: z.object({
    create: z.array(
      z.object({
        name: z.string().nullable(),
        skills: z.array(z.string()),
      })
    ),
  }),

  education: z.object({
    create: z.array(
      z.object({
        institution: z.string().nullable(),
        degree: z.string().nullable(),
        year: z.string().nullable(),
      })
    ),
  }),
});

