import logging
import asyncio
from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import json

from .github_scraper import GitHubScraper
from .leetcode_scraper import LeetCodeScraper
from .linkedin_scraper import LinkedInScraper
from .platform_interface import ScraperConfig

logger = logging.getLogger("sudhee-ai-intelligence")

class PlatformOrchestrator:
    """
    Orchestrates multi-platform scraping with caching and rate limiting.
    
    Features:
    - Parallel async scraping
    - Cache management
    - Rate limiting per platform
    - Result aggregation
    - Error isolation (one failure doesn't affect others)
    """
    
    def __init__(self):
        self.scrapers = {
            "github": GitHubScraper(),
            "leetcode": LeetCodeScraper(),
            "linkedin": LinkedInScraper()
        }
        self.cache = {}  # In-memory cache (would use scrape_cache table in production)
    
    async def scrape_all_platforms(
        self,
        student_id: str,
        usernames: Dict[str, str],
        force_refresh: bool = False
    ) -> Dict[str, Dict]:
        """
        Scrape multiple platforms in parallel.
        
        Args:
            student_id: Student UUID
            usernames: Dict of platform -> username
            force_refresh: Bypass cache and scraping frequency checks
        
        Returns:
            Dict of platform -> scraped_data
        """
        results = {}
        
        # Create scraping tasks
        tasks = []
        platforms_to_scrape = []
        
        for platform, username in usernames.items():
            if platform not in self.scrapers:
                logger.warning(f"Unknown platform: {platform}")
                continue
            
            # Check cache first
            if not force_refresh:
                cached_data = self._get_cached_data(platform, username)
                if cached_data:
                    results[platform] = cached_data
                    logger.info(f"Using cached data for {platform}/{username}")
                    continue
            
            # Check rate limiting
            if not force_refresh and not self._can_scrape(student_id, platform):
                logger.info(f"Rate limit: skipping {platform} for student {student_id}")
                continue
            
            # Schedule scraping task
            tasks.append(self._scrape_platform(platform, username))
            platforms_to_scrape.append(platform)
        
        # Run all scraping tasks in parallel
        if tasks:
            scrape_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results
            for platform, result in zip(platforms_to_scrape, scrape_results):
                if isinstance(result, Exception):
                    logger.error(f"Scraping exception for {platform}: {str(result)}")
                    results[platform] = {
                        "error": str(result),
                        "status": "failed"
                    }
                elif result[0]:  # Success
                    results[platform] = result[1]
                    # Cache successful result
                    self._cache_data(platform, usernames[platform], result[1])
                else:  # Failed but not exception
                    results[platform] = {
                        "error": result[2],
                        "status": "failed"
                    }
        
        return results
    
    async def _scrape_platform(
        self,
        platform: str,
        username: str
    ) -> tuple[bool, Optional[Dict], Optional[str]]:
        """Scrape a single platform with timing."""
        scraper = self.scrapers.get(platform)
        if not scraper:
            return (False, None, "Scraper not found")
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            success, data, error = await scraper.scrape(username)
            
            duration_ms = int((asyncio.get_event_loop().time() - start_time) * 1000)
            
            logger.info(f"{platform} scraping complete", extra={
                "props": {
                    "platform": platform,
                    "username": username,
                    "success": success,
                    "duration_ms": duration_ms
                }
            })
            
            # Would log to platform_activity_logs table here
            
            return (success, data, error)
            
        except Exception as e:
            logger.error(f"{platform} scraping failed", extra={
                "props": {
                    "platform": platform,
                    "username": username,
                    "error": str(e)
                }
            })
            return (False, None, str(e))
    
    def _get_cached_data(self, platform: str, username: str) -> Optional[Dict]:
        """Get cached data if available and not expired."""
        cache_key = self._generate_cache_key(platform, username)
        
        cached = self.cache.get(cache_key)
        if not cached:
            return None
        
        # Check expiry
        expires_at = cached.get("expires_at")
        if expires_at and datetime.fromisoformat(expires_at) < datetime.utcnow():
            # Expired - remove from cache
            del self.cache[cache_key]
            return None
        
        return cached.get("data")
    
    def _cache_data(self, platform: str, username: str, data: Dict):
        """Cache scraped data."""
        cache_key = self._generate_cache_key(platform, username)
        
        # Calculate expiry
        cache_hours = ScraperConfig.CACHE_EXPIRY.get(platform, 24)
        expires_at = datetime.utcnow()
        expires_at = expires_at.replace(hour=(expires_at.hour + cache_hours) % 24)
        
        self.cache[cache_key] = {
            "data": data,
            "expires_at": expires_at.isoformat(),
            "cached_at": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Cached {platform} data for {username}")
    
    def _generate_cache_key(self, platform: str, username: str) -> str:
        """Generate deterministic cache key."""
        key_string = f"{platform}:{username}".lower()
        return hashlib.md5(key_string.encode()).hexdigest()
    
    def _can_scrape(self, student_id: str, platform: str) -> bool:
        """
        Check if scraping is allowed based on rate limits.
        
        In production, this would query platform_activity_logs table.
        """
        # Placeholder - would check database
        return True
    
    async def scrape_single_platform(
        self,
        platform: str,
        username: str
    ) -> tuple[bool, Optional[Dict], Optional[str]]:
        """Convenience method to scrape a single platform."""
        results = await self.scrape_all_platforms(
            student_id="unknown",
            usernames={platform: username}
        )
        
        result = results.get(platform, {})
        if result.get("status") == "failed":
            return (False, None, result.get("error"))
        
        return (True, result, None)
