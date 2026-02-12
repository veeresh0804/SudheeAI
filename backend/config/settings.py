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
    
    # CORS Settings - Parse from environment variable (comma-separated)
    @property
    def ALLOWED_ORIGINS(self) -> list:
        origins_env = os.getenv("ALLOWED_ORIGINS", "")
        if origins_env:
            # Split by comma and strip whitespace
            return [origin.strip() for origin in origins_env.split(",")]
        # Default origins for local development
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080",
            "https://sudhee-ai.vercel.app",
        ]

settings = Settings()
