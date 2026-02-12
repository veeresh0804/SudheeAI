import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "SudheeAI Intelligence API"
    PORT: int = int(os.getenv("PORT", 10000))
    HOST: str = "0.0.0.0"
    
    # Supabase Settings
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
    
    # AI Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # CORS Settings
    # In production, this should be restricted to your frontend domain
    ALLOWED_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://localhost:3000",
        "*" # Temporarily open for initial deploy, should be tightened
    ]

settings = Settings()
