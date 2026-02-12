import logging
from typing import List
from fastapi import APIRouter
from models.schemas import ExternalProfileLink, ExternalProfileRequest
from config.settings import settings
from utils.supabase import supabase

router = APIRouter(prefix="/students", tags=["students"])
logger = logging.getLogger("sudhee-ai-intelligence")

@router.get("/external_profiles/{student_id}", response_model=List[ExternalProfileLink])
async def get_student_external_profiles(student_id: str):
    """Fetch all stored external profile links for a student"""
    if not supabase:
        return []
    
    try:
        response = supabase.table("student_external_profiles").select("*").eq("student_id", student_id).execute()
        links = []
        for item in response.data:
            links.append(ExternalProfileLink(
                platform=item["platform"],
                url=item["url"],
                username=item.get("username"),
                last_updated=item["updated_at"]
            ))
        return links
    except Exception as e:
        logger.error(f"Error fetching external profiles: {str(e)}")
        return []

@router.post("/external_profiles")
async def upsert_student_external_profile(request: ExternalProfileRequest):
    """Save or update an external profile link"""
    if not supabase:
        return {"status": "error", "message": "Database not connected"}
    
    try:
        data = {
            "student_id": request.student_id,
            "platform": request.platform.lower(),
            "url": request.url,
            "username": request.username,
            "updated_at": "now()"
        }
        
        supabase.table("student_external_profiles").upsert(data, on_conflict="student_id,platform").execute()
        return {"status": "success", "message": f"{request.platform} profile updated"}
    except Exception as e:
        logger.error(f"Error upserting external profile: {str(e)}")
        return {"status": "error", "message": str(e)}
