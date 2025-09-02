"""
ML-Bling Sync - FastAPI Application
Main entry point with all configurations and middleware
"""

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import time
import logging
import uuid
from typing import Dict, Any

# Import configurations
from app.core.config import settings
from app.core.security import get_current_user
from app.infra.database import init_db, close_db
from app.infra.websockets import init_websockets
from app.api.routers import (
    auth, users, products, orders, integrations, 
    categories, kits, returns, reservations, 
    financial, catalog, notifications, dashboard
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global request ID for correlation
request_id_context = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("🚀 Starting ML-Bling Sync API...")
    await init_db()
    await init_websockets()
    logger.info("✅ API started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down ML-Bling Sync API...")
    await close_db()
    logger.info("✅ API shutdown complete")

# Create FastAPI app
app = FastAPI(
    title="ML-Bling Sync API",
    description="API para sincronização entre Mercado Livre e Bling ERP",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request ID middleware for correlation
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add unique request ID for correlation"""
    request_id = str(uuid.uuid4())
    request_id_context[request_id] = True
    
    # Add to request state
    request.state.request_id = request_id
    
    # Add to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    # Cleanup
    del request_id_context[request_id]
    
    return response

# Audit logging middleware
@app.middleware("http")
async def audit_logging(request: Request, call_next):
    """Log all requests for audit purposes"""
    start_time = time.time()
    
    # Get user info if authenticated
    user_id = None
    try:
        user = await get_current_user(request)
        user_id = user.id if user else None
    except:
        pass
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log request details
    logger.info(
        "Request processed",
        extra={
            "request_id": getattr(request.state, "request_id", None),
            "method": request.method,
            "url": str(request.url),
            "user_id": user_id,
            "ip": request.client.host if request.client else None,
            "duration": round(duration, 3),
            "status_code": response.status_code,
            "user_agent": request.headers.get("user-agent")
        }
    )
    
    return response

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
            "request_id": getattr(request.state, "request_id", None)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": getattr(request.state, "request_id", None)
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ml-bling-sync-api",
        "version": "1.0.0",
        "timestamp": time.time()
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(products.router, prefix="/api/products", tags=["Products"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(kits.router, prefix="/api/kits", tags=["Kits"])
app.include_router(returns.router, prefix="/api/returns", tags=["Returns"])
app.include_router(reservations.router, prefix="/api/reservations", tags=["Reservations"])
app.include_router(financial.router, prefix="/api/financial", tags=["Financial"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["Catalog"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "ML-Bling Sync API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
