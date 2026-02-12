import logging
import asyncio
import aiohttp
from typing import Dict, Optional, List
from datetime import datetime
from .platform_interface import PlatformScraper

logger = logging.getLogger("sudhee-ai-intelligence")

class GitHubScraper(PlatformScraper):
    """
    GitHub profile and repository scraper.
    
    Fetches:
    - User profile data
    - Repository statistics
    - Contribution activity
    - Language breakdown
    """
    
    def __init__(self, timeout: int = 5):
        super().__init__(timeout)
        self.api_base = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SkillScout-Intelligence/1.0"
        }
    
    async def fetch(self, username: str) -> Optional[Dict]:
        """Fetch GitHub user data via API."""
        try:
            async with aiohttp.ClientSession() as session:
                # Fetch user profile
                user_url = f"{self.api_base}/users/{username}"
                async with session.get(user_url, headers=self.headers, timeout=self.timeout) as resp:
                    if resp.status != 200:
                        logger.warning(f"GitHub API returned {resp.status} for user {username}")
                        return None
                    
                    user_data = await resp.json()
                
                # Fetch repositories
                repos_url = f"{self.api_base}/users/{username}/repos?per_page=100&sort=updated"
                async with session.get(repos_url, headers=self.headers, timeout=self.timeout) as resp:
                    if resp.status == 200:
                        repos_data = await resp.json()
                    else:
                        repos_data = []
                
                return {
                    "user": user_data,
                    "repositories": repos_data
                }
                
        except asyncio.TimeoutError:
            logger.error(f"GitHub fetch timeout for {username}")
            return None
        except Exception as e:
            logger.error(f"GitHub fetch error for {username}: {str(e)}")
            return None
    
    async def parse(self, raw_data: Dict) -> Dict:
        """Extract relevant GitHub metrics."""
        user = raw_data.get("user", {})
        repos = raw_data.get("repositories", [])
        
        # Calculate metrics
        total_stars = sum(repo.get("stargazers_count", 0) for repo in repos)
        total_forks = sum(repo.get("forks_count", 0) for repo in repos)
        
        # Extract languages
        languages = set()
        for repo in repos:
            lang = repo.get("language")
            if lang:
                languages.add(lang)
        
        # Find recent activity (repos updated in last 30 days)
        now = datetime.utcnow()
        recent_repos = []
        for repo in repos:
            updated_at = repo.get("updated_at")
            if updated_at:
                try:
                    updated_date = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
                    days_since_update = (now - updated_date.replace(tzinfo=None)).days
                    if days_since_update <= 30:
                        recent_repos.append(repo)
                except:
                    pass
        
        # Check for best practices
        has_tests = any(repo.get("has_issues", False) for repo in repos)
        has_ci = any("ci" in repo.get("description", "").lower() for repo in repos)
        
        return {
            "profile": {
                "username": user.get("login"),
                "name": user.get("name"),
                "bio": user.get("bio"),
                "company": user.get("company"),
                "location": user.get("location"),
                "public_repos": user.get("public_repos", 0),
                "followers": user.get("followers", 0),
                "following": user.get("following", 0),
                "created_at": user.get("created_at")
            },
            "activity": {
                "total_stars": total_stars,
                "total_forks": total_forks,
                "languages": list(languages),
                "repos_updated_30d": len(recent_repos),
                "has_tests": has_tests,
                "has_ci": has_ci
            },
            "repositories": [
                {
                    "name": repo.get("name"),
                    "description": repo.get("description"),
                    "language": repo.get("language"),
                    "stars": repo.get("stargazers_count", 0),
                    "forks": repo.get("forks_count", 0),
                    "updated_at": repo.get("updated_at")
                }
                for repo in repos[:20]  # Top 20 repos
            ]
        }
    
    async def normalize(self, parsed_data: Dict) -> Dict:
        """Convert to standard format."""
        profile = parsed_data.get("profile", {})
        activity = parsed_data.get("activity", {})
        repos = parsed_data.get("repositories", [])
        
        return self._create_standard_response(
            username=profile.get("username", "unknown"),
            profile_data={
                "name": profile.get("name"),
                "bio": profile.get("bio"),
                "company": profile.get("company"),
                "location": profile.get("location"),
                "repos_count": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "account_age_days": self._calculate_account_age(profile.get("created_at"))
            },
            activity_metrics={
                "total_stars": activity.get("total_stars", 0),
                "total_forks": activity.get("total_forks", 0),
                "languages_used": activity.get("languages", []),
                "recent_activity_30d": activity.get("repos_updated_30d", 0),
                "has_tests": activity.get("has_tests", False),
                "has_ci_cd": activity.get("has_ci", False),
                "top_repositories": repos
            }
        )
    
    def _calculate_account_age(self, created_at: Optional[str]) -> int:
        """Calculate account age in days."""
        if not created_at:
            return 0
        
        try:
            created_date = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            age = datetime.utcnow() - created_date.replace(tzinfo=None)
            return age.days
        except:
            return 0
