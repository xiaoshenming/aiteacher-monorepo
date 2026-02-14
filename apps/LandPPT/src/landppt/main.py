"""
Main FastAPI application entry point
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse
import uvicorn
import asyncio
import logging
import os
import sys
from .api.openai_compat import router as openai_router
from .api.landppt_api import router as landppt_router
from .api.database_api import router as database_router
from .api.global_master_template_api import router as template_api_router
from .api.config_api import router as config_router
from .api.image_api import router as image_router
from .api.usage_api import router as usage_router

from .web import router as web_router
from .auth import auth_router, create_auth_middleware
from .database.database import init_db
from .database.create_default_template import ensure_default_templates_exist_first_time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Disable SQLAlchemy verbose logging completely
logging.getLogger('sqlalchemy').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.engine.Engine').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
logging.getLogger('sqlalchemy.dialects').setLevel(logging.WARNING)

# Create FastAPI app
app = FastAPI(
    title="LandPPT API",
    description="AI-powered PPT generation platform with OpenAI-compatible API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        # Check if database file exists before initialization
        import os
        db_file_path = "landppt.db"  # 默认数据库文件路径
        db_exists = os.path.exists(db_file_path)

        logger.info("Initializing database...")
        await init_db()
        logger.info("Database initialized successfully")

        # Run pending migrations
        from .database.migrations import migration_manager
        logger.info("Running database migrations...")
        await migration_manager.migrate_up()
        logger.info("Database migrations completed")

        # Only import templates if database file didn't exist before (first time setup)
        if not db_exists:
            logger.info("First time setup detected - importing templates from examples...")
            template_ids = await ensure_default_templates_exist_first_time()
            logger.info(f"Template initialization completed. {len(template_ids)} templates available.")
        else:
            logger.info("Database already exists - skipping template import")

    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up database connections on shutdown"""
    try:
        logger.info("Shutting down application...")
        logger.info("Application shutdown complete")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:10003",
        "http://127.0.0.1:10003",
        "http://localhost:10006",
        "http://127.0.0.1:10006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add middleware to allow iframe embedding from aiteacher frontend
@app.middleware("http")
async def add_embed_headers(request, call_next):
    response = await call_next(request)
    # Allow embedding in iframe from aiteacher frontend
    response.headers["X-Frame-Options"] = "ALLOWALL"
    response.headers["Content-Security-Policy"] = "frame-ancestors *"
    return response

# Add authentication middleware
auth_middleware = create_auth_middleware()
app.middleware("http")(auth_middleware)

# Include routers
app.include_router(auth_router, prefix="", tags=["Authentication"])
app.include_router(config_router, prefix="", tags=["Configuration Management"])
app.include_router(image_router, prefix="", tags=["Image Service"])
app.include_router(usage_router, prefix="", tags=["AI Usage Statistics"])

# Web router must come before landppt_router to ensure specific endpoints take precedence
app.include_router(web_router, prefix="", tags=["Web Interface"])
app.include_router(openai_router, prefix="/v1", tags=["OpenAI Compatible"])
app.include_router(landppt_router, prefix="/api", tags=["LandPPT API"])
app.include_router(template_api_router, tags=["Global Master Templates"])
app.include_router(database_router, tags=["Database Management"])

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "web", "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount temp directory for image cache
temp_dir = os.path.join(os.getcwd(), "temp")
if os.path.exists(temp_dir):
    app.mount("/temp", StaticFiles(directory=temp_dir), name="temp")
    logger.info(f"Mounted temp directory: {temp_dir}")
else:
    logger.warning(f"Temp directory not found: {temp_dir}")

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint - redirect to dashboard"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/dashboard", status_code=302)

@app.get("/favicon.ico")
async def favicon():
    """Serve favicon"""
    favicon_path = os.path.join(os.path.dirname(__file__), "web", "static", "images", "favicon.svg")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path, media_type="image/svg+xml")
    else:
        raise HTTPException(status_code=404, detail="Favicon not found")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "LandPPT API"}

if __name__ == "__main__":
    uvicorn.run(
        "src.landppt.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
