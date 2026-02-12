import { supabase } from '@/integrations/supabase/client';

const INTELLIGENCE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligence-engine`;

async function callIntelligence(action: string, body: any) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${INTELLIGENCE_URL}/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `Intelligence API error: ${response.status}`);
  }

  return response.json();
}

export const intelligenceService = {
  scoreCandidate: (params: {
    profileData: any;
    jobData: any;
    applicationId?: string;
    studentId?: string;
    jobId?: string;
    legacyScore?: number;
    customWeights?: Record<string, number>;
  }) => callIntelligence('score', params),

  generateRejection: (params: {
    applicationId: string;
    studentId: string;
    jobId: string;
    studentProfile?: any;
    jobData?: any;
  }) => callIntelligence('rejection', params),

  analyzeCodingDna: (params: {
    studentId?: string;
    githubData: any;
  }) => callIntelligence('coding-dna', params),

  predictTrajectory: (params: {
    studentId?: string;
    profileSnapshot: any;
  }) => callIntelligence('trajectory', params),

  getFlags: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return {};

    const response = await fetch(`${INTELLIGENCE_URL}/flags`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    });

    if (!response.ok) return {};
    const result = await response.json();
    return result.flags || [];
  },
};
