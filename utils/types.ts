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
  summary: string;
  email?: string;
  phone?: string;
  location?: string;
  photo?: string;
  experience: Experience[];
  projects: Project[];
  skillCategories: SkillCategory[];
  softSkills: string[];
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
