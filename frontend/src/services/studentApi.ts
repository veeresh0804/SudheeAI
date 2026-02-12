/**
 * Student API Service
 * All student-facing endpoints
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface StudentProfile {
    profile_complete: boolean;
    profile_strength: number;
    platform_links: {
        leetcode?: string;
        github?: string;
        linkedin?: string;
    };
    platforms_data: {
        leetcode: any;
        github: any;
        linkedin: any;
    };
    ai_analysis: {
        overall_assessment: string;
        technical_skills: string[];
        strengths: string[];
        suitable_roles: string[];
        skill_level: string;
        coding_proficiency: string;
        recommendation: string;
    };
    technical_skills: string[];
    last_analyzed?: string;
}

export interface JobMatch {
    id: string;
    title: string;
    company_name: string;
    location: string;
    job_type: string;
    required_skills: string[];
    match_percentage: number;
    match_label: string;
    matched_skills: string[];
    missing_skills: string[];
    created_at: string;
}

export interface EligibilityResult {
    fit_percentage: number;
    decision: 'APPLY' | 'IMPROVE' | 'NOT_READY';
    decision_message: string;
    strengths: Array<{
        category: string;
        detail: string;
        impact: string;
    }>;
    skill_gaps: Array<{
        skill: string;
        importance: string;
        current_level: string;
        required_level: string;
    }>;
    ai_recommendation: string;
    action_items: Array<{
        priority: string;
        action: string;
        reason: string;
        estimated_time: string;
    }>;
}

export interface SkillGapRoadmap {
    current_fit: number;
    target_fit: number;
    skill_gaps: Array<{
        skill: string;
        importance: string;
        current_level: string;
        target_level: string;
        estimated_hours: number;
    }>;
    roadmap: {
        current_fit_analysis: any;
        target_outcome: any;
        learning_phases: any[];
        skill_deep_dives: any[];
        hands_on_projects: any[];
        coding_practice: any;
        weekly_schedule: any;
        progress_tracking: any;
        motivation_tips: string[];
        common_pitfalls: any[];
        final_recommendation: string;
    };
    expected_outcome: {
        duration_weeks: number;
        improvement_percentage: number;
        expected_role_readiness: string;
        projects_count: number;
        hours_per_week: number;
    };
}

/**
 * Setup student profile (start extraction)
 */
export async function setupProfile(data: {
    student_id: string;
    leetcode_url?: string;
    github_url?: string;
    linkedin_url?: string;
    linkedin_manual_data?: any;
}): Promise<{ status: string; message: string; estimated_time: string }> {
    const response = await fetch(`${API_BASE}/student/profile/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to setup profile');
    }

    return response.json();
}

/**
 * Get student profile
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
    const response = await fetch(`${API_BASE}/student/profile?student_id=${studentId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch profile');
    }

    return response.json();
}

/**
 * Browse jobs with match percentages
 */
export async function getStudentJobs(
    studentId: string,
    filters?: {
        job_type?: string;
        location?: string;
        search?: string;
    }
): Promise<JobMatch[]> {
    const params = new URLSearchParams({ student_id: studentId });

    if (filters?.job_type) params.append('job_type', filters.job_type);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.search) params.append('search', filters.search);

    const response = await fetch(`${API_BASE}/student/jobs?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Failed to fetch jobs');
    }

    return response.json();
}

/**
 * Apply to a job
 */
export async function applyToJob(
    studentId: string,
    jobId: string
): Promise<{ application_id: string; status: string; message: string }> {
    const response = await fetch(`${API_BASE}/student/jobs/${jobId}/apply?student_id=${studentId}`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to apply');
    }

    return response.json();
}

/**
 * Check eligibility for a job ("Can I apply?")
 */
export async function checkEligibility(
    studentId: string,
    jobId: string
): Promise<EligibilityResult> {
    const response = await fetch(`${API_BASE}/student/jobs/${jobId}/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to check eligibility');
    }

    return response.json();
}

/**
 * Generate skill gap learning roadmap
 */
export async function generateRoadmap(
    studentId: string,
    jobId: string
): Promise<SkillGapRoadmap> {
    const response = await fetch(`${API_BASE}/student/jobs/${jobId}/skill-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate roadmap');
    }

    return response.json();
}

/**
 * Get student's applications
 */
export async function getStudentApplications(studentId: string): Promise<{
    applications: any[];
    stats: {
        total: number;
        pending: number;
        under_review: number;
        shortlisted: number;
        rejected: number;
    };
}> {
    const response = await fetch(`${API_BASE}/student/applications?student_id=${studentId}`);

    if (!response.ok) {
        throw new Error('Failed to fetch applications');
    }

    return response.json();
}
