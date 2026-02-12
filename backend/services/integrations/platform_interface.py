from abc import ABC, abstractmethod
from typing import Dict, Optional
from datetime import datetime, timedelta
import asyncio

class PlatformScraper(ABC):
    """
    Abstract base class for all platform scrapers.
    
    All scrapers must implement:
    - fetch(): Retrieve raw data from platform
    - parse(): Extract relevant information
    - normalize(): Convert to standard format
    - cache(): Store results for reuse
    """
    
    def __init__(self, timeout: int = 5):
        """
        Args:
            timeout: Request timeout in seconds (default 5s)
        """
        self.timeout = timeout
        self.platform_name = self.__class__.__name__.replace("Scraper", "").lower()
    
    @abstractmethod
    async def fetch(self, username: str) -> Optional[Dict]:
        """
        Fetch raw data from platform API/webpage.
        
        Must handle:
        - Network errors
        - Timeouts
        - Rate limits
        - Authentication
        
        Returns:
            Raw response data or None on failure
        """
        pass
    
    @abstractmethod
    async def parse(self, raw_data: Dict) -> Dict:
        """
        Parse raw data and extract relevant fields.
        
        Returns:
            Parsed data dictionary
        """
        pass
    
    @abstractmethod
    async def normalize(self, parsed_data: Dict) -> Dict:
        """
        Normalize data to standard format.
        
        Standard format:
        {
            "platform": str,
            "username": str,
            "profile_data": dict,
            "activity_metrics": dict,
            "last_updated": timestamp
        }
        """
        pass
    
    async def scrape(self, username: str) -> tuple[bool, Optional[Dict], Optional[str]]:
        """
        Complete scraping workflow with error handling.
        
        Returns:
            (success, normalized_data, error_message)
        """
        try:
            # Set timeout for entire operation
            async with asyncio.timeout(self.timeout):
                # 1. Fetch
                raw_data = await self.fetch(username)
                if not raw_data:
                    return (False, None, "Failed to fetch data")
                
                # 2. Parse
                parsed_data = await self.parse(raw_data)
                
                # 3. Normalize
                normalized_data = await self.normalize(parsed_data)
                
                return (True, normalized_data, None)
                
        except asyncio.TimeoutError:
            error_msg = f"{self.platform_name} scraping timeout ({self.timeout}s)"
            return (False, None, error_msg)
            
        except Exception as e:
            error_msg = f"{self.platform_name} scraping error: {str(e)}"
            return (False, None, error_msg)
    
    def _create_standard_response(
        self,
        username: str,
        profile_data: Dict,
        activity_metrics: Dict
    ) -> Dict:
        """Helper to create standardized response format."""
        return {
            "platform": self.platform_name,
            "username": username,
            "profile_data": profile_data,
            "activity_metrics": activity_metrics,
            "last_updated": datetime.utcnow().isoformat(),
            "scraper_version": "1.0"
        }

class ScraperConfig:
    """Configuration for platform scrapers."""
    
    # Scraping frequency limits (hours)
    SCRAPE_FREQUENCY = {
        "github": 24,
        "leetcode": 24,
        "linkedin": 48
    }
    
    # Request timeouts (seconds)
    TIMEOUTS = {
        "github": 5,
        "leetcode": 5,
        "linkedin": 7
    }
    
    # Cache expiry (hours)
    CACHE_EXPIRY = {
        "github": 24,
        "leetcode": 24,
        "linkedin": 48
    }
    
    @staticmethod
    def can_scrape(platform: str, last_scraped: Optional[datetime]) -> bool:
        """Check if scraping is allowed based on frequency limits."""
        if not last_scraped:
            return True
        
        frequency_hours = ScraperConfig.SCRAPE_FREQUENCY.get(platform, 24)
        next_allowed = last_scraped + timedelta(hours=frequency_hours)
        
        return datetime.utcnow() >= next_allowed
