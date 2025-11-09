from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from config import settings
from database import engine, Base
from middleware import SecurityHeadersMiddleware
from rate_limit import limiter
import uvicorn

# Import routes
from routes import auth, users, projects, indicators, financements, documents, stats, audit_logs

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="API REST pour ImpactTracker - Portail de suivi de projets",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security headers middleware
app.add_middleware(SecurityHeadersMiddleware)

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# Include routers
app.include_router(auth.router, prefix=settings.api_v1_prefix)
app.include_router(users.router, prefix=settings.api_v1_prefix)
app.include_router(projects.router, prefix=settings.api_v1_prefix)
app.include_router(indicators.router, prefix=settings.api_v1_prefix)
app.include_router(financements.router, prefix=settings.api_v1_prefix)
app.include_router(documents.router, prefix=settings.api_v1_prefix)
app.include_router(stats.router, prefix=settings.api_v1_prefix)
app.include_router(audit_logs.router, prefix=settings.api_v1_prefix)


@app.get("/")
async def root():
    return {
        "message": "ImpactTracker API",
        "version": "1.0.0",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Create database tables on startup (in production, use migrations)
@app.on_event("startup")
async def startup_event():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )

