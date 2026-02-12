import { Candidate, PlatformScores, RoleType, ROLE_WEIGHTS } from '@/types';
import { normalizeSkill } from '@/data/skillTaxonomy';

/**
 * Scoring Engine for Candidate Evaluation
 * Calculates platform-specific scores and overall suitability
 */

// Calculate LeetCode score for a candidate
export function calculateLeetCodeScore(
  candidate: Candidate, 
  jdSkills: string[], 
  roleType: RoleType
): number {
  const { leetcode } = candidate;
  
  // Base score from problems solved (max 40 points)
  const problemsScore = Math.min((leetcode.problemsSolved / 500) * 40, 40);
  
  // Contest rating bonus (max 20 points)
  const ratingBonus = Math.min((leetcode.contestRating / 2000) * 20, 20);
  
  // Topic coverage bonus (max 25 points)
  const dsaTopics = ['Dynamic Programming', 'Graphs', 'Trees', 'Arrays', 'Binary Search', 'Heap', 'Trie'];
  const coveredTopics = leetcode.topics.filter(t => dsaTopics.includes(t));
  const topicCoverageScore = (coveredTopics.length / dsaTopics.length) * 25;
  
  // Difficulty distribution bonus (max 10 points)
  const hardRatio = leetcode.hard / leetcode.problemsSolved;
  const difficultyBonus = Math.min(hardRatio * 40, 10);
  
  // Streak consistency bonus (max 5 points)
  const streakBonus = Math.min(leetcode.streakDays / 10, 5);
  
  const totalScore = problemsScore + ratingBonus + topicCoverageScore + difficultyBonus + streakBonus;
  
  return Math.min(Math.round(totalScore), 100);
}

// Calculate GitHub score for a candidate
export function calculateGitHubScore(
  candidate: Candidate, 
  jdSkills: string[], 
  roleType: RoleType
): number {
  const { github } = candidate;
  
  if (github.relevantRepos.length === 0) {
    return Math.min(github.totalCommitsLastMonth / 2, 20); // Minimal score for activity
  }
  
  // Normalize JD skills for comparison
  const normalizedJdSkills = jdSkills.map(s => normalizeSkill(s).toLowerCase());
  
  // Calculate relevance score (max 40 points)
  let relevanceScore = 0;
  for (const repo of github.relevantRepos) {
    const repoTopics = repo.topics.map(t => t.toLowerCase());
    const matchedSkills = repoTopics.filter(t => 
      normalizedJdSkills.some(skill => 
        t.includes(skill.toLowerCase()) || skill.toLowerCase().includes(t)
      )
    );
    const skillMatch = matchedSkills.length / Math.max(normalizedJdSkills.length, 1);
    relevanceScore += skillMatch * 15;
  }
  relevanceScore = Math.min(relevanceScore, 40);
  
  // Stars bonus (max 15 points)
  const totalStars = github.relevantRepos.reduce((sum, repo) => sum + repo.stars, 0);
  const starsBonus = Math.min(totalStars / 10, 15);
  
  // Commit activity bonus (max 20 points)
  const activityBonus = Math.min(github.totalCommitsLastMonth / 5, 20);
  
  // Project count bonus (max 15 points)
  const projectBonus = Math.min(github.relevantRepos.length * 5, 15);
  
  // Language diversity bonus (max 10 points)
  const languageBonus = Math.min(github.languages.length * 3, 10);
  
  const totalScore = relevanceScore + starsBonus + activityBonus + projectBonus + languageBonus;
  
  return Math.min(Math.round(totalScore), 100);
}

// Calculate LinkedIn score for a candidate
export function calculateLinkedInScore(
  candidate: Candidate, 
  jdSkills: string[], 
  roleType: RoleType
): number {
  const { linkedin } = candidate;
  
  // Normalize skills for comparison
  const normalizedJdSkills = jdSkills.map(s => normalizeSkill(s).toLowerCase());
  const normalizedLinkedInSkills = linkedin.skills.map(s => s.toLowerCase());
  
  // Skill match score (max 40 points)
  const matchedSkills = normalizedJdSkills.filter(skill =>
    normalizedLinkedInSkills.some(ls => 
      ls.includes(skill) || skill.includes(ls)
    )
  );
  const skillMatchScore = (matchedSkills.length / Math.max(normalizedJdSkills.length, 1)) * 40;
  
  // Internship bonus (max 25 points)
  const internshipBonus = Math.min(linkedin.internships.length * 10, 25);
  
  // Certification bonus (max 15 points)
  const certBonus = Math.min(linkedin.certifications.length * 5, 15);
  
  // Engagement bonus (max 10 points)
  const engagementBonus = Math.min(linkedin.postsLastMonth * 2, 10);
  
  // Overall engagement score bonus (max 10 points)
  const engagementScoreBonus = (linkedin.engagementScore / 100) * 10;
  
  const totalScore = skillMatchScore + internshipBonus + certBonus + engagementBonus + engagementScoreBonus;
  
  return Math.min(Math.round(totalScore), 100);
}

// Calculate overall score with role-specific weights
export function calculateOverallScore(
  platformScores: PlatformScores,
  roleType: RoleType
): number {
  const weights = ROLE_WEIGHTS[roleType];
  
  const overallScore = 
    weights.leetcode * platformScores.leetcode +
    weights.github * platformScores.github +
    weights.linkedin * platformScores.linkedin;
  
  return Math.round(overallScore);
}

// Get matched and missing skills for a candidate
export function getSkillMatch(
  candidate: Candidate,
  jdSkills: string[]
): { matched: string[]; missing: string[] } {
  // Combine all candidate skills
  const candidateSkills = new Set<string>();
  
  // From LeetCode topics
  candidate.leetcode.topics.forEach(t => candidateSkills.add(t.toLowerCase()));
  
  // From GitHub repos
  candidate.github.relevantRepos.forEach(repo => {
    repo.topics.forEach(t => candidateSkills.add(t.toLowerCase()));
  });
  candidate.github.languages.forEach(l => candidateSkills.add(l.toLowerCase()));
  
  // From LinkedIn
  candidate.linkedin.skills.forEach(s => candidateSkills.add(s.toLowerCase()));
  candidate.linkedin.internships.forEach(i => {
    i.skillsUsed.forEach(s => candidateSkills.add(s.toLowerCase()));
  });
  
  const matched: string[] = [];
  const missing: string[] = [];
  
  for (const skill of jdSkills) {
    const normalizedSkill = normalizeSkill(skill).toLowerCase();
    const isMatched = Array.from(candidateSkills).some(cs => 
      cs.includes(normalizedSkill) || normalizedSkill.includes(cs)
    );
    
    if (isMatched) {
      matched.push(skill);
    } else {
      missing.push(skill);
    }
  }
  
  return { matched, missing };
}

// Generate summary for candidate ranking
export function generateCandidateSummary(
  candidate: Candidate,
  platformScores: PlatformScores,
  matchedSkills: string[]
): string {
  const highlights: string[] = [];
  
  // LeetCode highlight
  if (platformScores.leetcode >= 80) {
    highlights.push(`Strong DSA (${candidate.leetcode.problemsSolved} LC problems)`);
  } else if (platformScores.leetcode >= 60) {
    highlights.push(`Solid problem-solving skills`);
  }
  
  // GitHub highlight
  if (platformScores.github >= 80) {
    const topRepo = candidate.github.relevantRepos[0];
    if (topRepo) {
      highlights.push(`Active GitHub (${topRepo.name})`);
    }
  } else if (platformScores.github >= 60) {
    highlights.push(`${candidate.github.relevantRepos.length} relevant projects`);
  }
  
  // LinkedIn highlight
  if (candidate.linkedin.internships.length >= 2) {
    highlights.push(`${candidate.linkedin.internships.length} internships`);
  }
  
  // Skill match highlight
  if (matchedSkills.length >= 5) {
    highlights.push(`${matchedSkills.length} skills matched`);
  }
  
  return highlights.length > 0 ? highlights.join(' • ') : 'Entry-level profile';
}
