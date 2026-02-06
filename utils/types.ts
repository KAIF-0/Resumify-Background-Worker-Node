import { z } from "zod";

export enum PortStatus {
  READY,
  PROCESSING,
  ERROR,
}

export interface Portfolio {
  id: string;
  status: PortStatus;
  portfolio: PortfolioData;
}

export interface PortfolioData {
  name: string;
  title: string;
  summary?: string;
  email?: string;
  phone?: string;
  location?: string;
  photo?: string;
  github?: string;
  linkedIn?: string;
  softSkills: string[];
  achievements: string[];
  experience: Experience[];
  projects: Project[];
  skillCategories: SkillCategory[];
  education: Education[];
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  technologies?: string[];
  link?: string;
  github?: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface SkillCategory {
  name: string;
  skills: string[];
}

export const PortfolioDataSchema = z.object({
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

