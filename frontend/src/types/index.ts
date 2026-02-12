// Core Types for the Career Intelligence Platform

export interface LeetCodeStats {
  problemsSolved: number;
  easy: number;
  medium: number;
  hard: number;
  topics: string[];
  contestRating: number;
  streakDays: number;
}

export interface GitHubRepo {
  name: string;
  description: string;
  topics: string[];
  stars: number;
  commitsLastMonth: number;
  lastUpdated: string;
}

export interface GitHubStats {
  totalRepos: number;
  relevantRepos: GitHubRepo[];
  totalCommitsLastMonth: number;
  languages: string[];
}

export interface Internship {
  company: string;
  role: string;
  duration: string;
  skillsUsed: string[];
}

export interface LinkedInStats {
  skills: string[];
  internships: Internship[];
  certifications: string[];
  postsLastMonth: number;
  engagementScore: number;
}

export interface Candidate {
  id: number;
  name: string;
  anonymizedName: string;
  avatar?: string;
  leetcode: LeetCodeStats;
  github: GitHubStats;
  linkedin: LinkedInStats;
  overallProfileStrength: number;
}

export interface JobDescription {
  id: number;
  title: string;
  company: string;
  location: string;
  experience: string;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  roleType: RoleType;
}

export type RoleType = 'AI' | 'SDE' | 'Data Analyst' | 'Full-Stack' | 'ML Engineer';

export interface AnalyzedJD {
  roleType: RoleType;
  skills: {
    mandatory: string[];
    optional: string[];
  };
  experienceRequired: string;
  roleCategory: string;
  totalSkills: number;
}

export interface PlatformScores {
  leetcode: number;
  github: number;
  linkedin: number;
}

export interface RankedCandidate {
  rank: number;
  candidateId: number;
  name: string;
  anonymizedName: string;
  overallScore: number;
  platformScores: PlatformScores;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export interface FeatureContribution {
  score: number;
  contribution: number;
  reason: string;
}

export interface ExplanationData {
  candidateName: string;
  rank: number;
  overallScore: number;
  featureContributions: {
    leetcode: FeatureContribution;
    github: FeatureContribution;
    linkedin: FeatureContribution;
  };
  matchedSkills: string[];
  missingSkills: string[];
  naturalLanguageExplanation: string;
}

export type EligibilityDecision = 'APPLY' | 'IMPROVE' | 'NOT_READY';

export interface SkillLevel {
  skill: string;
  level: number;
}

export interface EligibilityResult {
  fitPercentage: number;
  decision: EligibilityDecision;
  decisionColor: 'green' | 'yellow' | 'red';
  breakdown: {
    strengths: SkillLevel[];
    weaknesses: SkillLevel[];
    missing: SkillLevel[];
  };
  recommendation: string;
}

export interface SkillGap {
  skill: string;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  priority: 'CRITICAL' | 'IMPORTANT' | 'POLISH';
  estimatedTime: string;
}

export interface RoadmapStep {
  stepNumber: number;
  priority: 'CRITICAL' | 'IMPORTANT' | 'POLISH';
  skill: string;
  tasks: string[];
  resources: { type: string; name: string; url?: string }[];
  estimatedTime: string;
}

export interface ImprovementRoadmap {
  totalEstimatedTime: string;
  steps: RoadmapStep[];
}

// Skill weights by role type
export const ROLE_WEIGHTS: Record<RoleType, PlatformScores> = {
  'AI': { leetcode: 0.35, github: 0.45, linkedin: 0.20 },
  'SDE': { leetcode: 0.50, github: 0.35, linkedin: 0.15 },
  'Data Analyst': { leetcode: 0.25, github: 0.40, linkedin: 0.35 },
  'Full-Stack': { leetcode: 0.30, github: 0.50, linkedin: 0.20 },
  'ML Engineer': { leetcode: 0.35, github: 0.45, linkedin: 0.20 },
};
