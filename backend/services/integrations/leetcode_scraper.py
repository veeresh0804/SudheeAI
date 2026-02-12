import logging
import asyncio
import json
from typing import Dict, Optional
from datetime import datetime
import google.generativeai as genai
import os
from .platform_interface import PlatformScraper

logger = logging.getLogger("sudhee-ai-intelligence")

class LeetCodeScraper(PlatformScraper):
    """
    LeetCode profile analyzer using Gemini AI.
    
    Instead of scraping, Gemini analyzes the public LeetCode profile URL
    and extracts relevant statistics and insights.
    """
    
    def __init__(self, timeout: int = 30):
        super().__init__(timeout)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY not found in environment")
            raise ValueError("GEMINI_API_KEY is required for LeetCode analysis")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
    
    async def fetch(self, username: str) -> Optional[Dict]:
        """Analyze LeetCode profile using Gemini AI."""
        try:
            # Extract username from URL if provided
            if "/" in username:
                parts = username.rstrip("/").split("/")
                username = parts[-1]
                logger.info(f"Extracted username from URL: {username}")
            
            # Construct the LeetCode profile URL
            leetcode_url = f"https://leetcode.com/u/{username}/"
            
            logger.info(f"Analyzing LeetCode profile with Gemini: {leetcode_url}")
            
            # Gemini prompt for analyzing LeetCode profile
            prompt = f"""
Analyze this LeetCode profile: {leetcode_url}

Extract the following information from the public profile page:
1. Username
2. Total problems solved
3. Easy problems solved
4. Medium problems solved  
5. Hard problems solved
6. Contest rating (if available)
7. Global ranking (if available)
8. Badges or achievements
9. Recent activity/submission trends
10. Any other notable stats

Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
{{
    "username": "username",
    "total_solved": 0,
    "easy_solved": 0,
    "medium_solved": 0,
    "hard_solved": 0,
    "contest_rating": 0,
    "ranking": 0,
    "badges": [],
    "recent_activity": "description of recent activity",
    "skills": [],
    "analysis": "Brief analysis of the user's coding profile and strengths"
}}

If you cannot access the profile or it's not public, return:
{{
    "error": "Unable to access profile",
    "reason": "explanation"
}}
"""
            
            # Call Gemini API
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt
            )
            
            if not response or not response.text:
                logger.error(f"Empty response from Gemini for LeetCode profile: {username}")
                return None
            
            # Parse Gemini's JSON response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                # Extract JSON from markdown code block
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1])  # Remove first and last line (```)
                if response_text.startswith("json"):
                    response_text = response_text[4:]  # Remove "json" prefix
            
            data = json.loads(response_text)
            
            # Check for error
            if "error" in data:
                logger.warning(f"Gemini reported error for LeetCode profile {username}: {data.get('reason')}")
                return None
            
            logger.info(f"Successfully analyzed LeetCode profile for {username} using Gemini")
            logger.debug(f"LeetCode data: {data}")
            
            return {
                "gemini_analysis": True,
                "profile_url": leetcode_url,
                **data
            }
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response for {username}: {str(e)}")
            logger.debug(f"Raw response: {response.text if response else 'None'}")
            return None
        except Exception as e:
            logger.error(f"LeetCode Gemini analysis error for {username}: {str(e)}", exc_info=True)
            return None
    
    async def parse(self, raw_data: Dict) -> Dict:
        """Parse Gemini analysis data."""
        if not raw_data:
            return {}
        
        # If it's Gemini analysis, data is already structured
        if raw_data.get("gemini_analysis"):
            return {
                "username": raw_data.get("username", "unknown"),
                "total_solved": raw_data.get("total_solved", 0),
                "easy_solved": raw_data.get("easy_solved", 0),
                "medium_solved": raw_data.get("medium_solved", 0),
                "hard_solved": raw_data.get("hard_solved", 0),
                "contest_rating": raw_data.get("contest_rating"),
                "ranking": raw_data.get("ranking"),
                "badges": raw_data.get("badges", []),
                "recent_activity": raw_data.get("recent_activity", ""),
                "skills": raw_data.get("skills", []),
                "analysis": raw_data.get("analysis", ""),
                "profile_url": raw_data.get("profile_url", "")
            }
        
        return raw_data
    
    async def normalize(self, parsed_data: Dict) -> Dict:
        """Convert to standard format."""
        return self._create_standard_response(
            username=parsed_data.get("username", "unknown"),
            profile_data={
                "ranking": parsed_data.get("ranking"),
                "contest_rating": parsed_data.get("contest_rating"),
                "total_solved": parsed_data.get("total_solved", 0),
                "profile_url": parsed_data.get("profile_url", ""),
                "badges": parsed_data.get("badges", [])
            },
            activity_metrics={
                "easy_solved": parsed_data.get("easy_solved", 0),
                "medium_solved": parsed_data.get("medium_solved", 0),
                "hard_solved": parsed_data.get("hard_solved", 0),
                "recent_activity": parsed_data.get("recent_activity", ""),
                "skills": parsed_data.get("skills", []),
                "gemini_analysis": parsed_data.get("analysis", "")
            }
        )
