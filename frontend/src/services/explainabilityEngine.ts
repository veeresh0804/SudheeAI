import { Candidate, ExplanationData, RoleType, ROLE_WEIGHTS } from '@/types';
import { getCandidateById } from './rankingEngine';
import {
  calculateLeetCodeScore,
  calculateGitHubScore,
  calculateLinkedInScore,
  calculateOverallScore,
  getSkillMatch
} from './scoringEngine';

/**
 * Explainability Engine
 * Generates detailed explanations for candidate rankings
 */

// Generate reason for LeetCode score
function generateLeetCodeReason(candidate: Candidate, score: number): string {
  const { leetcode } = candidate;
  
  if (score >= 80) {
    return `Exceptional problem-solving with ${leetcode.problemsSolved} problems solved, including ${leetcode.hard} hard problems. Strong in ${leetcode.topics.slice(0, 3).join(', ')}. Contest rating: ${leetcode.contestRating}.`;
  } else if (score >= 60) {
    return `Solid DSA foundation with ${leetcode.problemsSolved} problems across ${leetcode.topics.length} topics. Medium and hard problems show depth.`;
  } else if (score >= 40) {
    return `Developing problem-solving skills with ${leetcode.problemsSolved} problems. Focus areas: ${leetcode.topics.slice(0, 2).join(', ')}.`;
  } else {
    return `Limited LeetCode activity (${leetcode.problemsSolved} problems). Opportunity to strengthen algorithmic skills.`;
  }
}

// Generate reason for GitHub score
function generateGitHubReason(candidate: Candidate, score: number, jdSkills: string[]): string {
  const { github } = candidate;
  
  if (github.relevantRepos.length === 0) {
    return `No directly relevant projects found. ${github.totalCommitsLastMonth} commits last month show coding activity.`;
  }
  
  const topRepo = github.relevantRepos[0];
  const allTopics = github.relevantRepos.flatMap(r => r.topics);
  const uniqueTopics = [...new Set(allTopics)].slice(0, 4);
  
  if (score >= 80) {
    return `Impressive portfolio with ${github.relevantRepos.length} relevant projects. Featured: "${topRepo.name}" (${topRepo.stars} stars) using ${uniqueTopics.join(', ')}. ${github.totalCommitsLastMonth} commits last month.`;
  } else if (score >= 60) {
    return `Good project experience with ${github.relevantRepos.length} relevant repos. Demonstrates ${uniqueTopics.join(', ')} skills. Active contributor.`;
  } else if (score >= 40) {
    return `Some relevant projects found. "${topRepo.name}" shows familiarity with ${topRepo.topics.slice(0, 2).join(', ')}.`;
  } else {
    return `Limited project portfolio. Building more projects in ${jdSkills[0] || 'relevant areas'} would strengthen profile.`;
  }
}

// Generate reason for LinkedIn score
function generateLinkedInReason(candidate: Candidate, score: number): string {
  const { linkedin } = candidate;
  
  if (score >= 80) {
    return `Strong professional presence with ${linkedin.internships.length} internships (${linkedin.internships.map(i => i.company).join(', ')}). ${linkedin.certifications.length} certifications. Active engagement with ${linkedin.postsLastMonth} technical posts.`;
  } else if (score >= 60) {
    return `Solid professional profile with ${linkedin.skills.length} listed skills. ${linkedin.internships.length > 0 ? `Internship at ${linkedin.internships[0].company}.` : ''} ${linkedin.certifications.length} certifications.`;
  } else if (score >= 40) {
    return `Growing professional network. ${linkedin.skills.length} skills listed. ${linkedin.certifications.length > 0 ? `Certified in ${linkedin.certifications[0]}.` : 'Building credentials.'}`;
  } else {
    return `Limited LinkedIn activity. Adding internship experiences and technical posts would boost visibility.`;
  }
}

// Generate natural language explanation
function generateNaturalLanguageExplanation(
  candidate: Candidate,
  rank: number,
  overallScore: number,
  matchedSkills: string[],
  missingSkills: string[],
  platformScores: { leetcode: number; github: number; linkedin: number }
): string {
  const { name, leetcode, github, linkedin } = candidate;
  
  // Determine primary strength
  let primaryStrength = '';
  const maxScore = Math.max(platformScores.leetcode, platformScores.github, platformScores.linkedin);
  
  if (maxScore === platformScores.leetcode) {
    primaryStrength = `exceptional problem-solving skills demonstrated through ${leetcode.problemsSolved} LeetCode problems`;
  } else if (maxScore === platformScores.github) {
    primaryStrength = `strong project portfolio with ${github.relevantRepos.length} relevant GitHub repositories`;
  } else {
    primaryStrength = `solid professional experience with ${linkedin.internships.length} internships`;
  }
  
  let explanation = `${name} ranked #${rank} (${overallScore}% match) due to ${primaryStrength}. `;
  
  // Add platform-specific details
  if (platformScores.leetcode >= 70) {
    explanation += `Strong algorithmic skills covering ${leetcode.topics.slice(0, 3).join(', ')}. `;
  }
  
  if (platformScores.github >= 70 && github.relevantRepos.length > 0) {
    const topProject = github.relevantRepos[0];
    explanation += `Notable project: "${topProject.name}" using ${topProject.topics.slice(0, 3).join(', ')}. `;
  }
  
  if (linkedin.internships.length > 0) {
    explanation += `Professional experience at ${linkedin.internships.map(i => i.company).join(' and ')}. `;
  }
  
  // Add skill match summary
  if (matchedSkills.length > 0) {
    explanation += `Matched skills: ${matchedSkills.slice(0, 5).join(', ')}${matchedSkills.length > 5 ? ` (+${matchedSkills.length - 5} more)` : ''}. `;
  }
  
  if (missingSkills.length > 0 && missingSkills.length <= 3) {
    explanation += `Areas for growth: ${missingSkills.join(', ')}.`;
  } else if (missingSkills.length > 3) {
    explanation += `Key gaps: ${missingSkills.slice(0, 3).join(', ')}.`;
  }
  
  return explanation.trim();
}

/**
 * Main function to generate explanation for a candidate's ranking
 */
export function generateExplanation(
  candidateId: number,
  jdSkills: string[],
  roleType: RoleType,
  rank: number
): ExplanationData | null {
  const candidate = getCandidateById(candidateId);
  
  if (!candidate) {
    return null;
  }
  
  const weights = ROLE_WEIGHTS[roleType];
  
  // Calculate scores
  const leetcodeScore = calculateLeetCodeScore(candidate, jdSkills, roleType);
  const githubScore = calculateGitHubScore(candidate, jdSkills, roleType);
  const linkedinScore = calculateLinkedInScore(candidate, jdSkills, roleType);
  
  const platformScores = { leetcode: leetcodeScore, github: githubScore, linkedin: linkedinScore };
  const overallScore = calculateOverallScore(platformScores, roleType);
  
  // Calculate contributions
  const leetcodeContribution = Math.round(weights.leetcode * leetcodeScore);
  const githubContribution = Math.round(weights.github * githubScore);
  const linkedinContribution = Math.round(weights.linkedin * linkedinScore);
  
  // Get skill matches
  const { matched, missing } = getSkillMatch(candidate, jdSkills);
  
  // Generate natural language explanation
  const explanation = generateNaturalLanguageExplanation(
    candidate,
    rank,
    overallScore,
    matched,
    missing,
    platformScores
  );
  
  return {
    candidateName: candidate.name,
    rank,
    overallScore,
    featureContributions: {
      leetcode: {
        score: leetcodeScore,
        contribution: leetcodeContribution,
        reason: generateLeetCodeReason(candidate, leetcodeScore)
      },
      github: {
        score: githubScore,
        contribution: githubContribution,
        reason: generateGitHubReason(candidate, githubScore, jdSkills)
      },
      linkedin: {
        score: linkedinScore,
        contribution: linkedinContribution,
        reason: generateLinkedInReason(candidate, linkedinScore)
      }
    },
    matchedSkills: matched,
    missingSkills: missing,
    naturalLanguageExplanation: explanation
  };
}
