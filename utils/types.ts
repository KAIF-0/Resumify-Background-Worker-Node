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
  name: string | null;
  title: string | null;
  summary: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  photo: string | null;
  github: string | null;
  linkedIn: string | null;
  softSkills: string[];
  achievements: string[];
  experience: { create: Experience[] };
  projects: { create: Project[] };
  skills: { create: SkillCategory[] };
  education: { create: Education[] };
}

export interface Experience {
  company: string | null;
  role: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
}

export interface Project {
  name: string | null;
  description: string | null;
  technologies: string[];
  link: string | null;
  github: string | null;
}

export interface Education {
  institution: string | null;
  degree: string | null;
  year: string | null;
}

export interface SkillCategory {
  name: string | null;
  skills: string[];
}
