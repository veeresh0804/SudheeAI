import { 
  Candidate, 
  EligibilityResult, 
  EligibilityDecision, 
  SkillLevel, 
  SkillGap, 
  ImprovementRoadmap, 
  RoadmapStep,
  RoleType 
} from '@/types';
import { getCandidateById } from './rankingEngine';
import { 
  calculateLeetCodeScore, 
  calculateGitHubScore, 
  calculateLinkedInScore, 
  calculateOverallScore 
} from './scoringEngine';
import { normalizeSkill } from '@/data/skillTaxonomy';

/**
 * Eligibility Engine
 * Determines if a student should apply for a role and generates improvement roadmaps
 */

// Skill proficiency levels based on candidate data
function getSkillProficiency(candidate: Candidate, skill: string): number {
  const normalizedSkill = normalizeSkill(skill).toLowerCase();
  
  // Check LeetCode topics
  const lcTopics = candidate.leetcode.topics.map(t => t.toLowerCase());
  if (lcTopics.some(t => t.includes(normalizedSkill) || normalizedSkill.includes(t))) {
    const problemCount = candidate.leetcode.problemsSolved;
    return Math.min(Math.round((problemCount / 300) * 100), 95);
  }
  
  // Check GitHub repos
  for (const repo of candidate.github.relevantRepos) {
    const repoTopics = repo.topics.map(t => t.toLowerCase());
    if (repoTopics.some(t => t.includes(normalizedSkill) || normalizedSkill.includes(t))) {
      const commits = repo.commitsLastMonth;
      return Math.min(50 + Math.round((commits / 30) * 50), 90);
    }
  }
  
  // Check GitHub languages
  if (candidate.github.languages.map(l => l.toLowerCase()).includes(normalizedSkill)) {
    return 70;
  }
  
  // Check LinkedIn skills
  const linkedinSkills = candidate.linkedin.skills.map(s => s.toLowerCase());
  if (linkedinSkills.some(s => s.includes(normalizedSkill) || normalizedSkill.includes(s))) {
    return 60;
  }
  
  // Check internship skills
  for (const internship of candidate.linkedin.internships) {
    const internSkills = internship.skillsUsed.map(s => s.toLowerCase());
    if (internSkills.some(s => s.includes(normalizedSkill) || normalizedSkill.includes(s))) {
      return 75;
    }
  }
  
  return 0; // Skill not found
}

// Generate recommendation based on decision
function generateRecommendation(
  decision: EligibilityDecision,
  weaknesses: SkillLevel[],
  missing: SkillLevel[],
  fitPercentage: number
): string {
  if (decision === 'APPLY') {
    if (weaknesses.length > 0) {
      return `You're well-qualified for this role! Consider brushing up on ${weaknesses.slice(0, 2).map(w => w.skill).join(' and ')} before interviews.`;
    }
    return "Excellent match! You have strong coverage of all required skills. Apply confidently!";
  } else if (decision === 'IMPROVE') {
    const topPriorities = [...missing, ...weaknesses].slice(0, 3).map(s => s.skill);
    return `You're ${fitPercentage}% ready. Focus on ${topPriorities.join(', ')} for the next 4-6 weeks, then apply.`;
  } else {
    const criticalGaps = missing.slice(0, 3).map(s => s.skill);
    return `Build foundational skills in ${criticalGaps.join(', ')} before applying. Estimated preparation time: 8-12 weeks.`;
  }
}

/**
 * Check if a student is eligible for a job
 */
export function checkEligibility(
  studentId: number,
  jdSkills: string[],
  roleType: RoleType
): EligibilityResult | null {
  const candidate = getCandidateById(studentId);
  
  if (!candidate) {
    return null;
  }
  
  // Calculate overall fit
  const platformScores = {
    leetcode: calculateLeetCodeScore(candidate, jdSkills, roleType),
    github: calculateGitHubScore(candidate, jdSkills, roleType),
    linkedin: calculateLinkedInScore(candidate, jdSkills, roleType)
  };
  
  const fitPercentage = calculateOverallScore(platformScores, roleType);
  
  // Determine decision
  let decision: EligibilityDecision;
  let decisionColor: 'green' | 'yellow' | 'red';
  
  if (fitPercentage >= 80) {
    decision = 'APPLY';
    decisionColor = 'green';
  } else if (fitPercentage >= 50) {
    decision = 'IMPROVE';
    decisionColor = 'yellow';
  } else {
    decision = 'NOT_READY';
    decisionColor = 'red';
  }
  
  // Categorize skills by proficiency
  const strengths: SkillLevel[] = [];
  const weaknesses: SkillLevel[] = [];
  const missing: SkillLevel[] = [];
  
  for (const skill of jdSkills) {
    const level = getSkillProficiency(candidate, skill);
    const skillLevel = { skill, level };
    
    if (level >= 70) {
      strengths.push(skillLevel);
    } else if (level >= 30) {
      weaknesses.push(skillLevel);
    } else {
      missing.push(skillLevel);
    }
  }
  
  // Sort by level
  strengths.sort((a, b) => b.level - a.level);
  weaknesses.sort((a, b) => b.level - a.level);
  
  const recommendation = generateRecommendation(decision, weaknesses, missing, fitPercentage);
  
  return {
    fitPercentage,
    decision,
    decisionColor,
    breakdown: { strengths, weaknesses, missing },
    recommendation
  };
}

/**
 * Analyze skill gaps for a student
 */
export function analyzeSkillGaps(
  studentId: number,
  jdSkills: string[]
): SkillGap[] {
  const candidate = getCandidateById(studentId);
  
  if (!candidate) {
    return [];
  }
  
  const gaps: SkillGap[] = [];
  
  for (const skill of jdSkills) {
    const currentLevel = getSkillProficiency(candidate, skill);
    const requiredLevel = 70; // Standard threshold
    const gap = Math.max(requiredLevel - currentLevel, 0);
    
    if (gap > 0) {
      let priority: 'CRITICAL' | 'IMPORTANT' | 'POLISH';
      let estimatedTime: string;
      
      if (currentLevel === 0) {
        priority = 'CRITICAL';
        estimatedTime = '3-4 weeks';
      } else if (currentLevel < 40) {
        priority = 'IMPORTANT';
        estimatedTime = '2-3 weeks';
      } else {
        priority = 'POLISH';
        estimatedTime = '1-2 weeks';
      }
      
      gaps.push({
        skill,
        requiredLevel,
        currentLevel,
        gap,
        priority,
        estimatedTime
      });
    }
  }
  
  // Sort by priority and gap size
  const priorityOrder = { 'CRITICAL': 0, 'IMPORTANT': 1, 'POLISH': 2 };
  gaps.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.gap - a.gap;
  });
  
  return gaps;
}

// Skill improvement templates
const skillRoadmaps: Record<string, { tasks: string[]; resources: { type: string; name: string; url?: string }[] }> = {
  'Docker': {
    tasks: [
      'Complete Docker official "Get Started" tutorial',
      'Dockerize 2 existing projects from your portfolio',
      'Learn Docker Compose for multi-container apps',
      'Deploy a containerized app to AWS/GCP'
    ],
    resources: [
      { type: 'tutorial', name: 'Docker Get Started', url: 'https://docs.docker.com/get-started/' },
      { type: 'course', name: 'Docker Mastery on Udemy' },
      { type: 'project', name: 'Dockerize a MERN stack app' }
    ]
  },
  'Dynamic Programming': {
    tasks: [
      'Understand the 5 DP patterns (Fibonacci, 0/1 Knapsack, Unbounded Knapsack, LCS, LIS)',
      'Solve 50 LeetCode DP problems (start with medium)',
      'Watch Striver\'s DP playlist on YouTube',
      'Implement classic DP problems from scratch'
    ],
    resources: [
      { type: 'video', name: 'Striver DP Series' },
      { type: 'practice', name: 'NeetCode DP Roadmap' },
      { type: 'book', name: 'Grokking Dynamic Programming Patterns' }
    ]
  },
  'System Design': {
    tasks: [
      'Learn fundamentals: Load balancing, Caching, Database sharding',
      'Study 5 classic system designs (URL shortener, Twitter, Netflix)',
      'Watch Gaurav Sen\'s System Design playlist',
      'Practice designing systems with trade-off analysis'
    ],
    resources: [
      { type: 'course', name: 'Grokking System Design Interview' },
      { type: 'video', name: 'System Design Primer on GitHub' },
      { type: 'book', name: 'Designing Data-Intensive Applications' }
    ]
  },
  'Machine Learning': {
    tasks: [
      'Complete Andrew Ng\'s ML course on Coursera',
      'Implement 5 classic ML algorithms from scratch',
      'Build 3 end-to-end ML projects',
      'Participate in a Kaggle competition'
    ],
    resources: [
      { type: 'course', name: 'Andrew Ng ML Specialization' },
      { type: 'practice', name: 'Kaggle Learn' },
      { type: 'project', name: 'Build a recommendation system' }
    ]
  },
  'default': {
    tasks: [
      'Complete official documentation/tutorial',
      'Build 2-3 projects using this skill',
      'Contribute to an open-source project',
      'Create a portfolio piece demonstrating mastery'
    ],
    resources: [
      { type: 'documentation', name: 'Official docs' },
      { type: 'practice', name: 'Build projects' },
      { type: 'community', name: 'Join Discord/Slack communities' }
    ]
  }
};

/**
 * Generate improvement roadmap for a student
 */
export function generateImprovementRoadmap(
  studentId: number,
  targetSkills: string[]
): ImprovementRoadmap | null {
  const gaps = analyzeSkillGaps(studentId, targetSkills);
  
  if (gaps.length === 0) {
    return {
      totalEstimatedTime: '0 weeks',
      steps: []
    };
  }
  
  const steps: RoadmapStep[] = gaps.slice(0, 5).map((gap, index) => {
    const template = skillRoadmaps[gap.skill] || skillRoadmaps['default'];
    
    return {
      stepNumber: index + 1,
      priority: gap.priority,
      skill: gap.skill,
      tasks: template.tasks,
      resources: template.resources,
      estimatedTime: gap.estimatedTime
    };
  });
  
  // Calculate total time
  const weekRanges = steps.map(s => {
    const match = s.estimatedTime.match(/(\d+)-(\d+)/);
    if (match) {
      return (parseInt(match[1]) + parseInt(match[2])) / 2;
    }
    return 2;
  });
  const totalWeeks = Math.round(weekRanges.reduce((a, b) => a + b, 0));
  
  return {
    totalEstimatedTime: `${totalWeeks} weeks`,
    steps
  };
}
