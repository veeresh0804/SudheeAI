import os
import time
import logging
import json_logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from config.settings import settings
from routers import system, intelligence, students, recruiter

# Initialize structured logging
json_logging.init_fastapi(enable_json=True)

# Initialize logger
logger = logging.getLogger("sudhee-ai-intelligence")
logger.setLevel(logging.INFO)
if not logger.handlers:
    logger.addHandler(logging.StreamHandler())

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url=None
)

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Hardening
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    logger.info("Request processed", extra={
        "props": {
            "method": request.method,
            "url": str(request.url),
            "status_code": response.status_code,
            "duration_ms": int(duration * 1000)
        }
    })
    return response

# Include Routers
app.include_router(system.router)
app.include_router(intelligence.router)
app.include_router(students.router)
app.include_router(recruiter.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True if os.getenv("ENVIRONMENT") != "production" else False
    )
