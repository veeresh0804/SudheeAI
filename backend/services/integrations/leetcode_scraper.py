import logging
import asyncio
import aiohttp
from typing import Dict, Optional
from datetime import datetime
from .platform_interface import PlatformScraper

logger = logging.getLogger("sudhee-ai-intelligence")

class LeetCodeScraper(PlatformScraper):
    """
    LeetCode profile scraper.
    
    Fetches:
    - Solved problems count
    - Contest rating
    - Recent submissions
    - Problem difficulty breakdown
    """
    
    def __init__(self, timeout: int = 5):
        super().__init__(timeout)
        self.graphql_endpoint = "https://leetcode.com/graphql"
    
    async def fetch(self, username: str) -> Optional[Dict]:
        """Fetch LeetCode user data via GraphQL API."""
        try:
            # Extract username from URL if provided
            if "/" in username:
                # Handle URLs like https://leetcode.com/u/eGlfvtK4Pg/ or https://leetcode.com/eGlfvtK4Pg/
                parts = username.rstrip("/").split("/")
                username = parts[-1]  # Get the last part which should be the username
                logger.info(f"Extracted username from URL: {username}")
            
            query = """
            query userProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    profile {
                        ranking
                        reputation
                    }
                }
                recentSubmissionList(username: $username, limit: 20) {
                    title
                    timestamp
                    statusDisplay
                }
            }
            """
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://leetcode.com/",
               "Content-Type": "application/json",
                "Accept": "application/json"
            }
            
            logger.info(f"Fetching LeetCode data for username: {username}")
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.graphql_endpoint,
                    json={"query": query, "variables": {"username": username}},
                    headers=headers,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    response_text = await resp.text()
                    logger.info(f"LeetCode API response status: {resp.status}")
                    
                    if resp.status != 200:
                        logger.warning(f"LeetCode API returned {resp.status} for user {username}")
                        logger.debug(f"Response: {response_text[:500]}")
                        return None
                    
                    data = await resp.json()
                    logger.debug(f"LeetCode API response: {str(data)[:500]}")
                    
                    user_data = data.get("data", {})
                    if not user_data.get("matchedUser"):
                        logger.warning(f"LeetCode user {username} not found or no public data")
                        logger.debug(f"Full response: {data}")
                        return None
                        
                    logger.info(f"Successfully fetched LeetCode data for {username}")
                    return user_data
        
        except asyncio.TimeoutError:
            logger.error(f"LeetCode fetch timeout for {username}")
            return None
        except aiohttp.ClientError as e:
            logger.error(f"LeetCode HTTP error for {username}: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"LeetCode fetch error for {username}: {str(e)}", exc_info=True)
            return None
    
    async def parse(self, raw_data: Dict) -> Dict:
        """Extract relevant LeetCode metrics."""
        user = raw_data.get("matchedUser", {})
        submissions = raw_data.get("recentSubmissionList", [])
        
        # Parse submission stats
        submit_stats = user.get("submitStats", {})
        ac_submissions = submit_stats.get("acSubmissionNum", [])
        
        # Count by difficulty
        difficulty_counts = {
            "Easy": 0,
            "Medium": 0,
            "Hard": 0,
            "All": 0
        }
        
        for stat in ac_submissions:
            difficulty = stat.get("difficulty", "")
            count = stat.get("count", 0)
            if difficulty in difficulty_counts:
                difficulty_counts[difficulty] = count
        
        # Calculate recent activity (last 7 days)
        now = datetime.utcnow()
        solved_last_7_days = 0
        
        for submission in submissions:
            timestamp = submission.get("timestamp")
            if timestamp:
                try:
                    sub_date = datetime.fromtimestamp(int(timestamp))
                    days_ago = (now - sub_date).days
                    if days_ago <= 7 and submission.get("statusDisplay") == "Accepted":
                        solved_last_7_days += 1
                except:
                    pass
        
        profile = user.get("profile", {})
        
        return {
            "username": user.get("username"),
            "ranking": profile.get("ranking"),
            "reputation": profile.get("reputation"),
            "total_solved": difficulty_counts.get("All", 0),
            "easy_solved": difficulty_counts.get("Easy", 0),
            "medium_solved": difficulty_counts.get("Medium", 0),
            "hard_solved": difficulty_counts.get("Hard", 0),
            "solved_last_7_days": solved_last_7_days,
            "recent_submissions": submissions[:10]
        }
    
    async def normalize(self, parsed_data: Dict) -> Dict:
        """Convert to standard format."""
        return self._create_standard_response(
            username=parsed_data.get("username", "unknown"),
            profile_data={
                "ranking": parsed_data.get("ranking"),
                "reputation": parsed_data.get("reputation"),
                "total_solved": parsed_data.get("total_solved", 0)
            },
            activity_metrics={
                "easy_solved": parsed_data.get("easy_solved", 0),
                "medium_solved": parsed_data.get("medium_solved", 0),
                "hard_solved": parsed_data.get("hard_solved", 0),
                "solved_last_7_days": parsed_data.get("solved_last_7_days", 0),
                "recent_submissions": parsed_data.get("recent_submissions", [])
            }
        )
