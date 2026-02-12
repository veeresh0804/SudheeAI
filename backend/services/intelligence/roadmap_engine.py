"""
Roadmap Engine - Generates personalized learning roadmaps for skill gaps.

Uses Gemini AI to create structured learning paths with resources and timelines.
"""

import logging
from typing import List, Dict
from datetime import datetime, timedelta
import google.generativeai as genai

logger = logging.getLogger("sudhee-ai-intelligence")

async def generate_learning_roadmap(
    student_profile: dict,
    job_requirements: dict,
    missing_skills: List[str],
    gemini_api_key: str
) -> dict:
    """
    Generate a personalized learning roadmap to bridge skill gaps.
    
    Args:
        student_profile: Student's complete profile data
        job_requirements: Target job requirements
        missing_skills: List of skills the student needs to acquire
        gemini_api_key: Gemini API key
    
    Returns:
        Structured roadmap with phases, resources, and timeline
    """
    
    if not gemini_api_key:
        raise Exception("Gemini API key required for roadmap generation")
    
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel('gemini-pro')
        
        # Extract student context
        current_skills = student_profile.get("extracted_skills", [])
        ai_analysis = student_profile.get("ai_analysis", {})
        skill_level = ai_analysis.get("skill_level", "Beginner")
        coding_proficiency = ai_analysis.get("coding_proficiency", "Beginner")
        
        # Platform data for context
        leetcode_data = student_profile.get("leetcode_data", {})
        github_data = student_profile.get("github_data", {})
        
        leetcode_total = leetcode_data.get("problems_solved", {}).get("total", 0)
        github_repos = github_data.get("public_repos", 0)
        
        import json
        
        prompt = f"""
You are a technical career coach creating a personalized learning roadmap.

**Student Context:**
- Current Skill Level: {skill_level}
- Coding Proficiency: {coding_proficiency}
- Current Skills: {json.dumps(current_skills)}
- LeetCode Problems: {leetcode_total}
- GitHub Repos: {github_repos}

**Target Job:**
- Title: {job_requirements.get('title', 'Software Engineer')}
- Required Skills: {json.dumps(job_requirements.get('required_skills', []))}
- Preferred Skills: {json.dumps(job_requirements.get('preferred_skills', []))}
- Experience Level: {job_requirements.get('experience_required', 'Entry-level')}
- Role Type: {job_requirements.get('role_type', 'SDE')}

**Skills to Acquire:**
{json.dumps(missing_skills)}

**Task:** Create a comprehensive, actionable learning roadmap.

Return STRICT JSON with this structure:
{{
  "current_fit_analysis": {{
    "current_match_percentage": <integer 0-100>,
    "gap_severity": "<MINOR|MODERATE|SIGNIFICANT>",
    "estimated_learning_time_weeks": <integer>,
    "difficulty_level": "<EASY|MEDIUM|HARD>"
  }},
  "target_outcome": {{
    "target_match_percentage": <integer, realistic improvement>,
    "expected_role_readiness": "<string, e.g., 'Ready for Junior SDE roles'>",
    "competitive_advantage": "<string, what makes them stand out>"
  }},
  "learning_phases": [
    {{
      "phase_number": 1,
      "phase_name": "<string>",
      "duration_weeks": <integer>,
      "focus_areas": ["<skill1>", "<skill2>"],
      "objectives": ["<specific objective 1>", "<specific objective 2>"],
      "milestones": [
        {{
          "milestone": "<string>",
          "verification": "<how to verify completion>"
        }}
      ]
    }}
  ],
  "skill_deep_dives": [
    {{
      "skill": "<skill name from missing_skills>",
      "importance": "<CRITICAL|HIGH|MEDIUM>",
      "current_level": "<NONE|BASIC|INTERMEDIATE>",
      "target_level": "<INTERMEDIATE|ADVANCED|EXPERT>",
      "learning_path": [
        {{
          "step": 1,
          "topic": "<specific topic>",
          "description": "<what to learn>",
          "estimated_hours": <integer>,
          "resources": [
            {{
              "type": "<COURSE|DOCUMENTATION|TUTORIAL|BOOK|PROJECT>",
              "name": "<resource name>",
              "url": "<URL or 'Search for: <query>'>",
              "difficulty": "<BEGINNER|INTERMEDIATE|ADVANCED>"
            }}
          ],
          "practice_tasks": ["<task 1>", "<task 2>"]
        }}
      ]
    }}
  ],
  "hands_on_projects": [
    {{
      "project_name": "<string>",
      "description": "<string>",
      "skills_covered": ["<skill1>", "<skill2>"],
      "complexity": "<BEGINNER|INTERMEDIATE|ADVANCED>",
      "estimated_time_weeks": <integer>,
      "deliverables": ["<deliverable 1>", "<deliverable 2>"],
      "success_criteria": ["<criterion 1>", "<criterion 2>"]
    }}
  ],
  "coding_practice": {{
    "leetcode_strategy": {{
      "problems_per_week": <integer>,
      "difficulty_split": {{
        "easy": <integer>,
        "medium": <integer>,
        "hard": <integer>
      }},
      "focus_topics": ["<topic1>", "<topic2>"],
      "target_total": <integer, realistic goal>
    }},
    "github_strategy": {{
      "commit_frequency": "<daily|3-4 times per week|weekly>",
      "project_types": ["<type1>", "<type2>"],
      "contribution_ideas": ["<idea1>", "<idea2>"]
    }}
  }},
  "weekly_schedule": {{
    "hours_per_week": <integer, realistic 10-20>,
    "time_breakdown": {{
      "learning": <integer hours>,
      "coding_practice": <integer hours>,
      "projects": <integer hours>,
      "revision": <integer hours>
    }},
    "sample_week": [
      {{
        "day": "<Monday|Tuesday|etc>",
        "activities": ["<activity 1>", "<activity 2>"]
      }}
    ]
  }},
  "progress_tracking": {{
    "checkpoints": [
      {{
        "week": <integer>,
        "goals": ["<goal 1>", "<goal 2>"],
        "self_assessment": "<questions to ask yourself>"
      }}
    ],
    "success_indicators": ["<indicator 1>", "<indicator 2>"]
  }},
  "motivation_tips": [
    "<tip 1>",
    "<tip 2>",
    "<tip 3>"
  ],
  "common_pitfalls": [
    {{
      "pitfall": "<string>",
      "how_to_avoid": "<string>"
    }}
  ],
  "final_recommendation": "<comprehensive paragraph with encouragement and next immediate steps>"
}}

CRITICAL RULES:
1. Be realistic about timelines (don't promise miracles)
2. Prioritize most important skills first
3. Include specific, actionable resources (real URLs when possible, otherwise search queries)
4. Tailor difficulty to student's current level
5. Projects should be portfolio-worthy
6. Timeline should account for learning curve and practice time
7. Pure JSON only, no markdown formatting
"""

        response = model.generate_content(prompt)
        ai_text = response.text.strip()
        
        # Clean response
        import re
        ai_text = re.sub(r'^```json\s*', '', ai_text)
        ai_text = re.sub(r'\s*```$', '', ai_text)
        
        roadmap = json.loads(ai_text)
        
        # Add metadata
        roadmap["generated_at"] = datetime.utcnow().isoformat()
        roadmap["student_id"] = student_profile.get("user_id")
        roadmap["job_title"] = job_requirements.get("title")
        
        # Calculate end date
        total_weeks = roadmap["current_fit_analysis"]["estimated_learning_time_weeks"]
        end_date = datetime.utcnow() + timedelta(weeks=total_weeks)
        roadmap["estimated_completion_date"] = end_date.isoformat()
        
        logger.info(f"Generated roadmap: {total_weeks} weeks, {len(missing_skills)} skills")
        
        return roadmap
    
    except Exception as e:
        logger.error(f"Roadmap generation failed: {str(e)}")
        raise


def format_roadmap_summary(roadmap: dict) -> dict:
    """
    Extract key highlights from roadmap for quick display.
    """
    return {
        "duration_weeks": roadmap["current_fit_analysis"]["estimated_learning_time_weeks"],
        "difficulty": roadmap["current_fit_analysis"]["difficulty_level"],
        "current_fit": roadmap["current_fit_analysis"]["current_match_percentage"],
        "target_fit": roadmap["target_outcome"]["target_match_percentage"],
        "improvement": roadmap["target_outcome"]["target_match_percentage"] - 
                      roadmap["current_fit_analysis"]["current_match_percentage"],
        "phase_count": len(roadmap["learning_phases"]),
        "skills_to_learn": len(roadmap["skill_deep_dives"]),
        "projects_count": len(roadmap["hands_on_projects"]),
        "hours_per_week": roadmap["weekly_schedule"]["hours_per_week"],
        "key_milestones": [
            phase["phase_name"] for phase in roadmap["learning_phases"]
        ]
    }
