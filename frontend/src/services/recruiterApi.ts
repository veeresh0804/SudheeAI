/**
 * Recruiter API Service
 * All recruiter-facing endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Job {
    id: string;
    title: string;
    description: string;
    company_name: string;
    location: string;
    job_type: string;
    experience_required: string;
    required_skills: string[];
    preferred_skills: string[];
    role_type: string;
    salary_range?: string;
    deadline?: string;
    status: string;
    created_at: string;
    applications_count: number;
}

export interface JobCreate {
    title: string;
    description: string;
    company_name: string;
    location?: string;
    job_type?: string;
    experience_required?: string;
    required_skills: string[];
    preferred_skills?: string[];
    role_type?: string;
    salary_range?: string;
    deadline?: string;
}

export interface RankedCandidate {
    application_id: string;
    student_id: string;
    student_name: string;
    institution: string;
    final_score: number;
    rank: number;
    platform_scores: {
        leetcode: number;
        github: number;
        linkedin: number;
    };
    gemini_insights: {
        recommendation: string;
        explanation: string;
        skill_match: number;
        hiring_confidence: string;
    };
    matched_skills: string[];
    missing_skills: [];
    profile_links: {
        leetcode?: string;
        github?: string;
        linkedin?: string;
    };
}

export interface CandidateAnalysis {
    student_name: string;
    institution: string;
    email: string;
    job_title: string;
    final_score: number;
    rank: number;
    score_breakdown: {
        algorithmic_score: number;
        gemini_score: number;
        platform_scores: {
            leetcode: number;
            github: number;
            linkedin: number;
        };
    };
    gemini_insights: any;
    skills_analysis: {
        matched: string[];
        gaps: string[];
    };
    detailed_profile: {
        leetcode: any;
        github: any;
        linkedin: any;
        ai_analysis: any;
    };
    profile_links: {
        leetcode?: string;
        github?: string;
        linkedin?: string;
    };
    application_status: string;
    applied_date: string;
}

/**
 * Create a new job posting
 */
export async function createJob(recruiterId: string, jobData: JobCreate): Promise<Job> {
    const response = await fetch(`${API_BASE}/recruiter/jobs?recruiter_id=${recruiterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create job');
    }

    return response.json();
}

/**
 * Get all jobs for a recruiter
 */
export async function getRecruiterJobs(recruiterId: string): Promise<Job[]> {
    const response = await fetch(`${API_BASE}/recruiter/jobs?recruiter_id=${recruiterId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch jobs');
    }

    return response.json();
}

/**
 * Get job details
 */
export async function getJobDetails(recruiterId: string, jobId: string): Promise<any> {
    const response = await fetch(
        `${API_BASE}/recruiter/jobs/${jobId}?recruiter_id=${recruiterId}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch job details');
    }

    return response.json();
}

/**
 * Get applications for a job
 */
export async function getJobApplications(recruiterId: string, jobId: string): Promise<any> {
    const response = await fetch(
        `${API_BASE}/recruiter/jobs/${jobId}/applications?recruiter_id=${recruiterId}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch applications');
    }

    return response.json();
}

/**
 * CORE: Rank candidates with AI
 */
export async function rankCandidates(
    recruiterId: string,
    jobId: string
): Promise<{
    status: string;
    job_id: string;
    job_title: string;
    total_candidates: number;
    ranked_candidates: RankedCandidate[];
}> {
    const response = await fetch(
        `${API_BASE}/recruiter/jobs/${jobId}/rank?recruiter_id=${recruiterId}`,
        {
            method: 'POST',
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to rank candidates');
    }

    return response.json();
}

/**
 * Get detailed candidate analysis
 */
export async function getCandidateAnalysis(
    recruiterId: string,
    studentId: string,
    jobId: string
): Promise<CandidateAnalysis> {
    const response = await fetch(
        `${API_BASE}/recruiter/candidate/${studentId}/analysis?job_id=${jobId}&recruiter_id=${recruiterId}`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch candidate analysis');
    }

    return response.json();
}

/**
  * Extract skills from job description using AI
 */
export async function extractSkills(description: string): Promise<{ skills: string[]; confidence: number }> {
    const response = await fetch(`${API_BASE}/recruiter/jobs/extract-skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });

    if (!response.ok) {
        throw new Error('Failed to extract skills');
    }

    return response.json();
}
