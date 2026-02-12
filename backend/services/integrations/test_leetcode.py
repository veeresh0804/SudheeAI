import asyncio
import aiohttp
import json
from leetcode_scraper import LeetCodeScraper

async def test_leetcode_scrape(username):
    scraper = LeetCodeScraper()
    print(f"Testing LeetCode scrape for user: {username}")
    
    # Test fetch directly to see raw response
    try:
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
        
        async with aiohttp.ClientSession() as session:
            # Adding common headers to avoid quick blocking
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://leetcode.com/"
            }
            
            print("Sending request to LeetCode GraphQL...")
            async with session.post(
                "https://leetcode.com/graphql",
                json={"query": query, "variables": {"username": username}},
                headers=headers,
                timeout=10
            ) as resp:
                print(f"Response Status: {resp.status}")
                if resp.status == 200:
                    data = await resp.json()
                    print("Data received successfully:")
                    print(json.dumps(data, indent=2)[:500] + "...")
                    
                    if not data.get("data", {}).get("matchedUser"):
                        print("WARNING: userProfile (matchedUser) is null. User might not exist or profile is private.")
                else:
                    text = await resp.text()
                    print(f"Error Response: {text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    import sys
    target_user = sys.argv[1] if len(sys.argv) > 1 else "veeresh0804"
    asyncio.run(test_leetcode_scrape(target_user))
