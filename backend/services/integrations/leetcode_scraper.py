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
            
            logger.info(f"Fetching LeetCode HTML for: {leetcode_url}")
            
            # First, fetch the HTML content
            import aiohttp
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(leetcode_url, headers=headers, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                    if resp.status != 200:
                        logger.warning(f"Failed to fetch LeetCode profile page: {resp.status}")
                        return None
                    
                    html_content = await resp.text()
                    logger.info(f"Successfully fetched LeetCode HTML ({len(html_content)} chars)")
            
            # Now use Gemini to analyze the HTML
            logger.info(f"Analyzing LeetCode HTML with Gemini for: {username}")
            
            prompt = f"""
Analyze this LeetCode profile HTML and extract statistics.

Username: {username}
Profile URL: {leetcode_url}

HTML Content (first 15000 chars):
{html_content[:15000]}

Extract the following information from the HTML:
1. Username
2. Total problems solved
3. Easy problems solved
4. Medium problems solved  
5. Hard problems solved
6. Contest rating (if visible)
7. Global ranking (if visible)
8. Any badges or achievements
9. Recent activity patterns

Return ONLY a valid JSON object with this exact structure (no markdown formatting):
{{
    "username": "username_here",
    "total_solved": 0,
    "easy_solved": 0,
    "medium_solved": 0,
    "hard_solved": 0,
    "contest_rating": 0,
    "ranking": 0,
    "badges": [],
    "recent_activity": "brief description",
    "skills": ["skill1", "skill2"],
    "analysis": "Brief 2-sentence analysis of coding profile and strengths based on the stats"
}}

If you cannot find the data in the HTML, use 0 for numeric fields and empty arrays/strings for others, but still return valid JSON.
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
            logger.debug(f"Gemini response: {response_text[:500]}")
            
            # Remove markdown code blocks if present
            if response_text.startswith("```"):
                lines = response_text.split("\n")
                response_text = "\n".join(lines[1:-1])
                if response_text.startswith("json"):
                    response_text = response_text[4:].strip()
            
            data = json.loads(response_text)
            
            logger.info(f"Successfully analyzed LeetCode profile for {username}")
            logger.debug(f"Extracted data: {data}")
            
            return {
                "gemini_analysis": True,
                "profile_url": leetcode_url,
                **data
            }
        
        except aiohttp.ClientError as e:
            logger.error(f"Failed to fetch LeetCode HTML for {username}: {str(e)}")
            return None
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini JSON response for {username}: {str(e)}")
            logger.debug(f"Raw response: {response.text if 'response' in locals() else 'None'}")
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
