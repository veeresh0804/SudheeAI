import logging
import asyncio
from typing import Dict, Optional
import requests

logger = logging.getLogger("sudhee-ai-intelligence")

async def analyze_coding_dna(github_username: str, repositories: list) -> Dict:
    """
    Async GitHub code analysis to extract 'Coding DNA'.
    Analyzes code quality, architecture patterns, and maturity.
    
    This runs asynchronously to avoid blocking profile loads.
    """
    try:
        if not github_username or not repositories:
            return _get_default_dna_score("No GitHub data available")
        
        logger.info(f"Starting DNA analysis for {github_username}")
        
        # Run analysis in background (non-blocking)
        dna_metrics = await _analyze_repositories_async(repositories)
        
        # Calculate component scores
        abstraction_score = _calculate_abstraction_score(dna_metrics)
        architecture_score = _calculate_architecture_score(dna_metrics)
        code_quality_score = _calculate_code_quality_score(dna_metrics)
        
        # Determine maturity level
        maturity_level = _determine_maturity_level(
            abstraction_score, 
            architecture_score, 
            code_quality_score
        )
        
        result = {
            "abstraction_score": abstraction_score,
            "architecture_score": architecture_score,
            "code_quality_score": code_quality_score,
            "maturity_level": maturity_level,
            "analysis_details": dna_metrics
        }
        
        logger.info("DNA analysis complete", extra={
            "props": {
                "username": github_username,
                "maturity": maturity_level
            }
        })
        
        return result
        
    except Exception as e:
        logger.error(f"Error in DNA analysis: {str(e)}")
        return _get_default_dna_score("Analysis failed")

async def _analyze_repositories_async(repositories: list) -> Dict:
    """
    Async analysis of GitHub repositories.
    In production, this would use GitHub API to fetch actual code.
    """
    # Simulate async processing
    await asyncio.sleep(0.1)  # Non-blocking delay
    
    metrics = {
        "total_repos": len(repositories),
        "languages_used": [],
        "avg_stars": 0,
        "avg_forks": 0,
        "has_tests": False,
        "has_ci_cd": False,
        "code_complexity": 0,
        "modularity_score": 0
    }
    
    # Extract metrics from repo data
    for repo in repositories:
        if isinstance(repo, dict):
            metrics["languages_used"].extend(repo.get("languages", []))
            metrics["avg_stars"] += repo.get("stars", 0)
            metrics["avg_forks"] += repo.get("forks", 0)
            
            # Check for best practices
            if repo.get("has_tests"):
                metrics["has_tests"] = True
            if repo.get("has_ci"):
                metrics["has_ci_cd"] = True
    
    if repositories:
        metrics["avg_stars"] /= len(repositories)
        metrics["avg_forks"] /= len(repositories)
    
    metrics["languages_used"] = list(set(metrics["languages_used"]))
    
    return metrics

def _calculate_abstraction_score(metrics: Dict) -> int:
    """
    Score based on code abstraction and design patterns.
    Higher score = better abstraction and modularity.
    """
    score = 50  # Base score
    
    # Language diversity indicates abstraction awareness
    lang_count = len(metrics.get("languages_used", []))
    score += min(20, lang_count * 4)
    
    # Modularity from repo structure
    modularity = metrics.get("modularity_score", 0)
    score += min(30, modularity)
    
    return min(100, max(0, score))

def _calculate_architecture_score(metrics: Dict) -> int:
    """
    Score based on architectural maturity.
    Considers CI/CD, testing, and project organization.
    """
    score = 40  # Base score
    
    # Testing presence
    if metrics.get("has_tests"):
        score += 25
    
    # CI/CD presence
    if metrics.get("has_ci_cd"):
        score += 20
    
    # Popular repos indicate architectural soundness
    avg_stars = metrics.get("avg_stars", 0)
    score += min(15, avg_stars // 10)
    
    return min(100, max(0, score))

def _calculate_code_quality_score(metrics: Dict) -> int:
    """
    Overall code quality score.
    Based on stars, forks, and community engagement.
    """
    score = 50  # Base score
    
    avg_stars = metrics.get("avg_stars", 0)
    avg_forks = metrics.get("avg_forks", 0)
    
    # Stars indicate quality
    score += min(30, avg_stars // 5)
    
    # Forks indicate reusability
    score += min(20, avg_forks // 2)
    
    return min(100, max(0, score))

def _determine_maturity_level(abstraction: int, architecture: int, quality: int) -> str:
    """
    Determine overall coding maturity level.
    """
    avg_score = (abstraction + architecture + quality) / 3
    
    if avg_score >= 75:
        return "Senior"
    elif avg_score >= 55:
        return "Intermediate"
    elif avg_score >= 35:
        return "Junior"
    else:
        return "Beginner"

def _get_default_dna_score(reason: str) -> Dict:
    """Fallback DNA score when analysis cannot be performed."""
    return {
        "abstraction_score": 0,
        "architecture_score": 0,
        "code_quality_score": 0,
        "maturity_level": "Unknown",
        "analysis_details": {"reason": reason}
    }

# Synchronous wrapper for backward compatibility
def analyze_coding_dna_sync(github_username: str, repositories: list) -> Dict:
    """Synchronous version of DNA analysis (blocks until complete)."""
    return asyncio.run(analyze_coding_dna(github_username, repositories))
