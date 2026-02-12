import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return { error: "Missing auth" };

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return { error: "Unauthorized" };

  return { userId: data.claims.sub as string, supabase };
}

async function getFeatureFlag(supabase: any, flagName: string): Promise<boolean> {
  const { data } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("flag_name", flagName)
    .maybeSingle();
  return data?.enabled ?? false;
}

async function callGemini(systemPrompt: string, userPrompt: string): Promise<any> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nData: ${userPrompt}` }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
      }
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw { status: 429, message: "Rate limit exceeded" };
    if (status === 402) throw { status: 402, message: "AI credits exhausted" };
    throw new Error(`AI gateway error: ${status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    // Retry once
    console.error("JSON parse failed, retrying...", content.substring(0, 200));
    const retry = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nCRITICAL: Return ONLY valid JSON. No markdown, no extra text.\n\nData: ${userPrompt}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
        }
      }),
    });
    if (!retry.ok) throw new Error("Retry failed");
    const retryData = await retry.json();
    const retryContent = retryData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const retryJson = retryContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(retryJson);
  }
}

// ── Route Handlers ──

async function handleScoreCandidate(body: any, userId: string, supabase: any) {
  const { profileData, jobData, applicationId, customWeights } = body;
  if (!profileData || !jobData) return jsonResponse({ error: "profileData and jobData required" }, 400);

  const compositeEnabled = await getFeatureFlag(supabase, "ENABLE_COMPOSITE_SCORE");
  const trustEnabled = await getFeatureFlag(supabase, "ENABLE_TRUST_ENGINE");

  const systemPrompt = `You are an expert AI recruiter. Score this candidate for the job. Return ONLY valid JSON:
{
  "skill_match_score": number 0-100,
  "project_score": number 0-100,
  "growth_score": number 0-100,
  "trust_score": number 0-100,
  "dna_score": number 0-100,
  "overall_reasoning_score": number 0-100,
  "eligible": boolean,
  "explanation": "2-3 sentence reasoning"
}`;

  const userPrompt = `Candidate: ${JSON.stringify(profileData).slice(0, 5000)}\nJob: ${JSON.stringify(jobData).slice(0, 3000)}`;

  let analysis;
  try {
    analysis = await callGemini(systemPrompt, userPrompt);
  } catch (e: any) {
    if (e.status) return jsonResponse({ error: e.message }, e.status);
    console.error("Score candidate error:", e);
    // Safe fallback
    analysis = {
      skill_match_score: 0, project_score: 0, growth_score: 0,
      trust_score: 50, dna_score: 0, overall_reasoning_score: 0,
      eligible: false, explanation: "Scoring temporarily unavailable."
    };
  }

  // Calculate composite score
  let compositeScore = analysis.overall_reasoning_score;
  if (compositeEnabled && customWeights) {
    const w = customWeights;
    compositeScore = (
      (analysis.skill_match_score * (w.skill_match || 0.3)) +
      (analysis.project_score * (w.project || 0.2)) +
      (analysis.growth_score * (w.growth || 0.15)) +
      (analysis.trust_score * (w.trust || 0.15)) +
      (analysis.dna_score * (w.dna || 0.1)) +
      (analysis.overall_reasoning_score * (w.reasoning || 0.1))
    );
  }

  // Store intelligence score (additive, never overwrites legacy)
  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const scoreRecord = {
    application_id: applicationId || null,
    student_id: body.studentId || userId,
    job_id: body.jobId || null,
    legacy_score: body.legacyScore || null,
    composite_score: compositeScore,
    skill_match_score: analysis.skill_match_score,
    project_score: analysis.project_score,
    growth_score: analysis.growth_score,
    trust_score: trustEnabled ? analysis.trust_score : null,
    dna_score: analysis.dna_score,
    overall_reasoning_score: analysis.overall_reasoning_score,
    component_scores_json: analysis,
    custom_weights: customWeights || null,
    eligible: analysis.eligible,
    explanation: analysis.explanation,
  };

  const { error: insertError } = await serviceClient
    .from("intelligence_scores")
    .insert(scoreRecord);

  if (insertError) console.error("Failed to store intelligence score:", insertError);

  return jsonResponse({ analysis, compositeScore, stored: !insertError });
}

async function handleRejection(body: any, userId: string, supabase: any) {
  const enabled = await getFeatureFlag(supabase, "ENABLE_REJECTION_PORTAL");
  if (!enabled) return jsonResponse({ error: "Rejection portal is not enabled" }, 403);

  const { applicationId, studentId, jobId, studentProfile, jobData } = body;
  if (!applicationId || !studentId || !jobId) {
    return jsonResponse({ error: "applicationId, studentId, jobId required" }, 400);
  }

  const systemPrompt = `You are a career coach. A candidate was rejected. Provide constructive feedback. Return ONLY valid JSON:
{
  "reason": "clear professional reason for rejection",
  "skill_gaps": ["skill1", "skill2"],
  "roadmap": [{"week": 1, "task": "description", "resources": ["url"]}],
  "timeline_weeks": number,
  "target_score": number 0-100
}`;

  const userPrompt = `Student: ${JSON.stringify(studentProfile || {}).slice(0, 3000)}\nJob: ${JSON.stringify(jobData || {}).slice(0, 2000)}`;

  let analysis;
  try {
    analysis = await callGemini(systemPrompt, userPrompt);
  } catch (e: any) {
    if (e.status) return jsonResponse({ error: e.message }, e.status);
    return jsonResponse({ error: "Failed to generate rejection report" }, 500);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await serviceClient.from("ai_rejection_reports").insert({
    application_id: applicationId,
    student_id: studentId,
    job_id: jobId,
    reason: analysis.reason || "No specific reason provided",
    skill_gaps: analysis.skill_gaps || [],
    roadmap: analysis.roadmap || [],
    timeline_weeks: analysis.timeline_weeks || null,
    target_score: analysis.target_score || null,
  });

  if (error) console.error("Failed to store rejection report:", error);

  return jsonResponse({ report: analysis, stored: !error });
}

async function handleCodingDna(body: any, userId: string, supabase: any) {
  const enabled = await getFeatureFlag(supabase, "ENABLE_CODING_DNA");
  if (!enabled) return jsonResponse({ error: "Coding DNA analyzer is not enabled" }, 403);

  const { studentId, githubData } = body;
  if (!githubData) return jsonResponse({ error: "githubData required" }, 400);

  const systemPrompt = `You are a code quality analyst. Analyze this developer's GitHub profile and code patterns. Return ONLY valid JSON:
{
  "abstraction_score": number 0-100,
  "architecture_score": number 0-100,
  "maturity_score": number 0-100,
  "patterns_detected": ["pattern1", "pattern2"],
  "summary": "brief assessment"
}`;

  const userPrompt = `GitHub Data: ${JSON.stringify(githubData).slice(0, 5000)}`;

  let analysis;
  try {
    analysis = await callGemini(systemPrompt, userPrompt);
  } catch (e: any) {
    if (e.status) return jsonResponse({ error: e.message }, e.status);
    return jsonResponse({ error: "DNA analysis failed" }, 500);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const targetStudentId = studentId || userId;
  const { error } = await serviceClient.from("coding_dna_analyses").upsert({
    student_id: targetStudentId,
    abstraction_score: analysis.abstraction_score,
    architecture_score: analysis.architecture_score,
    maturity_score: analysis.maturity_score,
    patterns_detected: analysis.patterns_detected || [],
    analysis_json: analysis,
    status: "completed",
  }, { onConflict: "student_id" });

  if (error) console.error("Failed to store DNA analysis:", error);

  return jsonResponse({ analysis, stored: !error });
}

async function handleTrajectory(body: any, userId: string, supabase: any) {
  const enabled = await getFeatureFlag(supabase, "ENABLE_TRAJECTORY");
  if (!enabled) return jsonResponse({ error: "Trajectory prediction is not enabled" }, 403);

  const { studentId, profileSnapshot } = body;
  if (!profileSnapshot) return jsonResponse({ error: "profileSnapshot required" }, 400);

  const systemPrompt = `You are a career trajectory analyst. Predict this student's career path. Return ONLY valid JSON:
{
  "projected_role": "most likely role title",
  "forecast_6_month": {"role_readiness": number 0-100, "key_milestones": ["milestone1"]},
  "forecast_12_month": {"role_readiness": number 0-100, "key_milestones": ["milestone1"]},
  "probability": number 0-100
}`;

  const userPrompt = `Profile: ${JSON.stringify(profileSnapshot).slice(0, 5000)}`;

  let analysis;
  try {
    analysis = await callGemini(systemPrompt, userPrompt);
  } catch (e: any) {
    if (e.status) return jsonResponse({ error: e.message }, e.status);
    return jsonResponse({ error: "Trajectory prediction failed" }, 500);
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const targetStudentId = studentId || userId;
  const { error } = await serviceClient.from("talent_trajectory_predictions").upsert({
    student_id: targetStudentId,
    projected_role: analysis.projected_role,
    forecast_6_month: analysis.forecast_6_month || {},
    forecast_12_month: analysis.forecast_12_month || {},
    probability: analysis.probability,
    input_snapshot: profileSnapshot,
  }, { onConflict: "student_id" });

  if (error) console.error("Failed to store trajectory:", error);

  return jsonResponse({ prediction: analysis, stored: !error });
}

async function handleFeatureFlags(supabase: any) {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("flag_name, enabled, description");
  if (error) return jsonResponse({ error: "Failed to fetch flags" }, 500);
  return jsonResponse({ flags: data });
}

// ── Main Router ──

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if ("error" in auth) return jsonResponse({ error: auth.error }, 401);
    const { userId, supabase } = auth;

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (req.method === "GET" && path === "flags") {
      return await handleFeatureFlags(supabase);
    }

    if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

    const body = await req.json();

    switch (path) {
      case "score":
        return await handleScoreCandidate(body, userId, supabase);
      case "rejection":
        return await handleRejection(body, userId, supabase);
      case "coding-dna":
        return await handleCodingDna(body, userId, supabase);
      case "trajectory":
        return await handleTrajectory(body, userId, supabase);
      default:
        return jsonResponse({ error: `Unknown action: ${path}` }, 404);
    }
  } catch (e) {
    console.error("intelligence-engine error:", e);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
