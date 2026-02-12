import { AnalyzedJD, RoleType } from '@/types';
import { getAllSkills, normalizeSkill, roleKeywords } from '@/data/skillTaxonomy';

/**
 * NLP Processor for Job Description Analysis
 * Extracts skills, role type, and categorizes requirements
 */

// Detect role type from JD text
function detectRoleType(text: string): RoleType {
  const lowerText = text.toLowerCase();
  
  const roleCounts: Record<string, number> = {};
  
  for (const [role, keywords] of Object.entries(roleKeywords)) {
    roleCounts[role] = keywords.reduce((count, keyword) => {
      const regex = new RegExp(keyword.toLowerCase(), 'gi');
      const matches = lowerText.match(regex);
      return count + (matches ? matches.length : 0);
    }, 0);
  }
  
  // Find role with highest keyword matches
  let maxCount = 0;
  let detectedRole: RoleType = 'SDE'; // Default
  
  for (const [role, count] of Object.entries(roleCounts)) {
    if (count > maxCount) {
      maxCount = count;
      detectedRole = role as RoleType;
    }
  }
  
  return detectedRole;
}

// Extract skills from text
function extractSkills(text: string): string[] {
  const allSkills = getAllSkills();
  const foundSkills: Set<string> = new Set();
  const lowerText = text.toLowerCase();
  
  for (const skill of allSkills) {
    // Create regex pattern for skill matching
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b${escapedSkill}\\b`, 'gi');
    
    if (pattern.test(text)) {
      foundSkills.add(normalizeSkill(skill));
    }
  }
  
  // Also check for common variations
  const additionalPatterns = [
    { pattern: /\bpython\b/gi, skill: 'Python' },
    { pattern: /\bjava(?!script)\b/gi, skill: 'Java' },
    { pattern: /\breact(?:\.?js)?\b/gi, skill: 'React' },
    { pattern: /\bnode(?:\.?js)?\b/gi, skill: 'Node.js' },
    { pattern: /\btypescript\b/gi, skill: 'TypeScript' },
    { pattern: /\bmachine[\s-]?learning\b/gi, skill: 'Machine Learning' },
    { pattern: /\bdeep[\s-]?learning\b/gi, skill: 'Deep Learning' },
    { pattern: /\bsystem[\s-]?design\b/gi, skill: 'System Design' },
    { pattern: /\bdata[\s-]?structures?\b/gi, skill: 'DSA' },
    { pattern: /\balgorithms?\b/gi, skill: 'DSA' },
    { pattern: /\bdsa\b/gi, skill: 'DSA' },
    { pattern: /\baws\b/gi, skill: 'AWS' },
    { pattern: /\bgcp\b/gi, skill: 'GCP' },
    { pattern: /\bci\/?cd\b/gi, skill: 'CI/CD' },
    { pattern: /\bpostgres(?:ql)?\b/gi, skill: 'PostgreSQL' },
    { pattern: /\bmongodb?\b/gi, skill: 'MongoDB' },
    { pattern: /\bdocker\b/gi, skill: 'Docker' },
    { pattern: /\bkubernetes\b|k8s\b/gi, skill: 'Kubernetes' },
    { pattern: /\bml[\s-]?ops\b/gi, skill: 'MLOps' },
    { pattern: /\bnlp\b/gi, skill: 'NLP' },
    { pattern: /\bcomputer[\s-]?vision\b/gi, skill: 'Computer Vision' },
  ];
  
  for (const { pattern, skill } of additionalPatterns) {
    if (pattern.test(text)) {
      foundSkills.add(skill);
    }
  }
  
  return Array.from(foundSkills);
}

// Categorize skills as mandatory or optional based on JD sections
function categorizeSkills(text: string, skills: string[]): { mandatory: string[]; optional: string[] } {
  const lowerText = text.toLowerCase();
  
  // Find section boundaries
  const requiredSectionPattern = /(?:required|must\s*have|essential|mandatory|qualifications)[:\s]*(.+?)(?=nice\s*to\s*have|preferred|optional|bonus|what\s*you|responsibilities|$)/gis;
  const optionalSectionPattern = /(?:nice\s*to\s*have|preferred|optional|bonus|good\s*to\s*have)[:\s]*(.+?)(?=what\s*you|responsibilities|$)/gis;
  
  let requiredSection = '';
  let optionalSection = '';
  
  const requiredMatch = requiredSectionPattern.exec(text);
  if (requiredMatch) {
    requiredSection = requiredMatch[1].toLowerCase();
  }
  
  const optionalMatch = optionalSectionPattern.exec(text);
  if (optionalMatch) {
    optionalSection = optionalMatch[1].toLowerCase();
  }
  
  const mandatory: string[] = [];
  const optional: string[] = [];
  
  for (const skill of skills) {
    const skillLower = skill.toLowerCase();
    const escapedSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const skillPattern = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    
    if (optionalSection && skillPattern.test(optionalSection)) {
      optional.push(skill);
    } else if (requiredSection && skillPattern.test(requiredSection)) {
      mandatory.push(skill);
    } else {
      // Default: if found in first half of document, likely mandatory
      const firstHalf = text.slice(0, text.length / 2).toLowerCase();
      if (skillPattern.test(firstHalf)) {
        mandatory.push(skill);
      } else {
        optional.push(skill);
      }
    }
  }
  
  // If no mandatory skills found, move top skills to mandatory
  if (mandatory.length === 0 && skills.length > 0) {
    const halfLength = Math.ceil(skills.length / 2);
    return {
      mandatory: skills.slice(0, halfLength),
      optional: skills.slice(halfLength)
    };
  }
  
  return { mandatory, optional };
}

// Detect experience level
function detectExperience(text: string): string {
  const patterns = [
    { pattern: /(\d+)\s*[-–to]\s*(\d+)\s*years?/i, type: 'range' },
    { pattern: /(\d+)\+?\s*years?/i, type: 'min' },
    { pattern: /entry[\s-]?level|fresher|graduate|intern/i, type: 'entry' },
    { pattern: /junior|0[\s-]?2\s*years?/i, type: 'junior' },
    { pattern: /mid[\s-]?level|2[\s-]?5\s*years?/i, type: 'mid' },
    { pattern: /senior|5\+?\s*years?/i, type: 'senior' }
  ];
  
  for (const { pattern, type } of patterns) {
    const match = text.match(pattern);
    if (match) {
      if (type === 'range') {
        return `${match[1]}-${match[2]} years`;
      } else if (type === 'min') {
        return `${match[1]}+ years`;
      } else if (type === 'entry' || type === 'junior') {
        return '0-2 years';
      } else if (type === 'mid') {
        return '2-5 years';
      } else if (type === 'senior') {
        return '5+ years';
      }
    }
  }
  
  return '0-2 years'; // Default to entry level
}

/**
 * Main function to analyze a job description
 */
export function analyzeJobDescription(jdText: string): AnalyzedJD {
  // Extract all skills from text
  const allSkills = extractSkills(jdText);
  
  // Categorize skills
  const categorizedSkills = categorizeSkills(jdText, allSkills);
  
  // Detect role type
  const roleType = detectRoleType(jdText);
  
  // Detect experience
  const experience = detectExperience(jdText);
  
  return {
    roleType,
    skills: categorizedSkills,
    experienceRequired: experience,
    roleCategory: roleType,
    totalSkills: allSkills.length
  };
}
