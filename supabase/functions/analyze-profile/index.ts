import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const VALID_ANALYSIS_TYPES = ["profile", "match", "roadmap", "resume"];
const MAX_STRING_LENGTH = 10000;
const MAX_ARRAY_LENGTH = 100;

function validateAndSanitizeInput(body: any): { profileData: any; jobData: any; analysisType: string } | { error: string } {
  if (!body || typeof body !== "object") return { error: "Request body must be a JSON object" };

  const { analysisType, profileData, jobData } = body;

  if (!analysisType || !VALID_ANALYSIS_TYPES.includes(analysisType)) {
    return { error: `analysisType must be one of: ${VALID_ANALYSIS_TYPES.join(", ")}` };
  }

  if (!profileData || typeof profileData !== "object") {
    return { error: "profileData must be a valid object" };
  }

  // Enforce size limit on serialized input
  const serialized = JSON.stringify(profileData);
  if (serialized.length > 50000) {
    return { error: "profileData exceeds maximum allowed size" };
  }

  // Sanitize string fields to prevent prompt injection
  const sanitizeStr = (s: unknown): string => {
    if (typeof s !== "string") return "";
    return s.slice(0, MAX_STRING_LENGTH).replace(/[<>]/g, "");
  };

  const sanitizeArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, MAX_ARRAY_LENGTH).map(sanitizeStr).filter(Boolean);
  };

  const cleanProfile: Record<string, any> = {};
  for (const [key, val] of Object.entries(profileData)) {
    if (typeof val === "string") cleanProfile[key] = sanitizeStr(val);
    else if (Array.isArray(val)) cleanProfile[key] = sanitizeArray(val);
    else if (typeof val === "object" && val !== null) {
      const s = JSON.stringify(val);
      if (s.length <= 20000) cleanProfile[key] = val;
    } else if (typeof val === "number") cleanProfile[key] = val;
  }

  let cleanJob: any = undefined;
  if (analysisType === "match") {
    if (!jobData || typeof jobData !== "object") {
      return { error: "jobData is required for match analysis" };
    }
    const jobSerialized = JSON.stringify(jobData);
    if (jobSerialized.length > 20000) {
      return { error: "jobData exceeds maximum allowed size" };
    }
    cleanJob = {
      title: sanitizeStr(jobData.title),
      required_skills: sanitizeArray(jobData.required_skills),
      preferred_skills: sanitizeArray(jobData.preferred_skills),
      role_type: sanitizeStr(jobData.role_type),
    };
  }

  return { profileData: cleanProfile, jobData: cleanJob, analysisType };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated request from user: ${userId}`);

    // --- Input Validation ---
    const body = await req.json();
    const validation = validateAndSanitizeInput(body);
    if ("error" in validation) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileData, jobData, analysisType } = validation;

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    let systemPrompt = "";
    let userPrompt = "";

    if (analysisType === "profile") {
      systemPrompt = `You are an expert technical recruiter analyzing a student's coding profile. Provide analysis in JSON format with these fields:
      - overall_assessment (string, 2-3 sentences)
      - technical_skills (array of strings)
      - strengths (array of strings)
      - areas_for_improvement (array of strings)
      - suitable_roles (array of strings)
      - skill_level (Beginner/Intermediate/Advanced)
      - profile_strength (number 0-100)`;

      userPrompt = `Analyze this student profile:\n${JSON.stringify(profileData, null, 2)}`;
    } else if (analysisType === "match") {
      systemPrompt = `You are an AI recruiter evaluating candidate fit for a job. Provide analysis in JSON format with these fields:
      - overall_match_percentage (number 0-100)
      - matched_skills (array of strings)
      - missing_skills (array of strings)  
      - strengths_for_role (array of strings)
      - recommendation (STRONG_FIT / MODERATE_FIT / WEAK_FIT)
      - explanation (string, 2-3 sentences)`;

      userPrompt = `Match this candidate to job:\nCandidate: ${JSON.stringify(profileData, null, 2)}\nJob: ${JSON.stringify(jobData, null, 2)}`;
    } else if (analysisType === "roadmap") {
      systemPrompt = `You are a career coach creating a learning roadmap. Provide analysis in JSON format with these fields:
      - total_estimated_weeks (number)
      - steps (array of objects with: week, priority (CRITICAL/IMPORTANT/POLISH), skill, tasks (array), resources (array of {title, url}))`;

      userPrompt = `Create a roadmap for:\nCurrent skills: ${JSON.stringify(profileData?.currentSkills)}\nMissing skills: ${JSON.stringify(profileData?.missingSkills)}`;
    } else if (analysisType === "resume") {
      systemPrompt = `You are an expert resume analyzer. Extract structured data from the resume text. Provide analysis in JSON format with these fields:
      - extracted_skills (array of strings)
      - experience_summary (string)
      - education (array of strings)
      - projects (array of {name, description, technologies})
      - certifications (array of strings)
      - overall_quality (number 0-100)`;

      userPrompt = `Analyze this resume content:\n${profileData?.resumeText || 'No resume text provided'}`;
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nAnalyze this data:\n${userPrompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
    });

    if (!response.ok) {
      const statusCode = response.status;
      if (statusCode === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (statusCode === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", statusCode, errorText);
      throw new Error(`AI gateway error: ${statusCode}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let analysis;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response as JSON:", content.substring(0, 500));
      analysis = { raw_response: content };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-profile error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
