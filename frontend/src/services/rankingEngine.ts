import { Candidate, RankedCandidate, RoleType } from '@/types';
import { mockCandidates } from '@/data/mockCandidates';
import {
  calculateLeetCodeScore,
  calculateGitHubScore,
  calculateLinkedInScore,
  calculateOverallScore,
  getSkillMatch,
  generateCandidateSummary
} from './scoringEngine';

/**
 * Ranking Engine
 * Ranks candidates based on JD requirements and multi-platform scoring
 */

export function rankCandidates(
  jdSkills: string[],
  roleType: RoleType,
  candidateIds?: number[]
): RankedCandidate[] {
  // Get candidates to rank
  let candidates: Candidate[];
  if (candidateIds && candidateIds.length > 0) {
    candidates = mockCandidates.filter(c => candidateIds.includes(c.id));
  } else {
    candidates = mockCandidates;
  }
  
  // Calculate scores for each candidate
  const scoredCandidates = candidates.map(candidate => {
    const platformScores = {
      leetcode: calculateLeetCodeScore(candidate, jdSkills, roleType),
      github: calculateGitHubScore(candidate, jdSkills, roleType),
      linkedin: calculateLinkedInScore(candidate, jdSkills, roleType)
    };
    
    const overallScore = calculateOverallScore(platformScores, roleType);
    const { matched, missing } = getSkillMatch(candidate, jdSkills);
    const summary = generateCandidateSummary(candidate, platformScores, matched);
    
    return {
      candidateId: candidate.id,
      name: candidate.name,
      anonymizedName: candidate.anonymizedName,
      overallScore,
      platformScores,
      matchedSkills: matched,
      missingSkills: missing,
      summary
    };
  });
  
  // Sort by overall score descending
  scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);
  
  // Add ranks
  const rankedCandidates: RankedCandidate[] = scoredCandidates.map((candidate, index) => ({
    rank: index + 1,
    ...candidate
  }));
  
  return rankedCandidates;
}

// Get a specific candidate by ID
export function getCandidateById(id: number): Candidate | undefined {
  return mockCandidates.find(c => c.id === id);
}

// Filter candidates by minimum score threshold
export function filterByScoreThreshold(
  rankedCandidates: RankedCandidate[],
  minScore: number
): RankedCandidate[] {
  return rankedCandidates.filter(c => c.overallScore >= minScore);
}

// Filter candidates by platform strength
export function filterByPlatformStrength(
  rankedCandidates: RankedCandidate[],
  platform: 'leetcode' | 'github' | 'linkedin',
  minScore: number
): RankedCandidate[] {
  return rankedCandidates.filter(c => c.platformScores[platform] >= minScore);
}
