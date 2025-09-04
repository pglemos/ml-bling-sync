"""
Configuration settings for ML-Bling Sync API
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "ML-Bling Sync API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ml_bling_sync"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 30
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://ml-bling-sync.vercel.app",
        "https://staging-ml-bling-sync.vercel.app"
    ]
    
    # Trusted Hosts
    ALLOWED_HOSTS: List[str] = [
        "localhost",
        "127.0.0.1",
        "ml-bling-sync.vercel.app",
        "staging-ml-bling-sync.vercel.app"
    ]
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_PASSWORD: Optional[str] = None
    
    # Stripe Configuration
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_..."
    STRIPE_SECRET_KEY: str = "sk_test_..."
    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
    STRIPE_PRICE_LOOKUP_KEY: Optional[str] = None
    
    # Billing Configuration
    DEFAULT_CURRENCY: str = "usd"
    TRIAL_PERIOD_DAYS: int = 14
    BILLING_PORTAL_RETURN_URL: str = "http://localhost:3000/billing"
    CHECKOUT_SUCCESS_URL: str = "http://localhost:3000/billing/success"
    CHECKOUT_CANCEL_URL: str = "http://localhost:3000/billing/cancel"
    REDIS_DB: int = 0
    
    # External APIs
    MERCADOLIVRE_APP_ID: str = ""
    MERCADOLIVRE_APP_SECRET: str = ""
    MERCADOLIVRE_REDIRECT_URI: str = ""
    
    BLING_API_KEY: str = ""
    BLING_BASE_URL: str = "https://bling.com.br/Api/v2"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # File Upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_EXTENSIONS: List[str] = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_ENABLED: bool = True
    
    # WebSocket
    WS_HEARTBEAT_INTERVAL: int = 30
    WS_MAX_CONNECTIONS: int = 1000
    
    # Sync Settings
    SYNC_BATCH_SIZE: int = 100
    SYNC_TIMEOUT: int = 300  # 5 minutes
    SYNC_RETRY_ATTEMPTS: int = 3
    SYNC_RETRY_DELAY: int = 60  # 1 minute
    
    # Cache
    CACHE_TTL: int = 3600  # 1 hour
    CACHE_MAX_SIZE: int = 1000
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # Celery Settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_SERIALIZER: str = "json"
    CELERY_RESULT_SERIALIZER: str = "json"
    CELERY_ACCEPT_CONTENT: List[str] = ["json"]
    CELERY_TIMEZONE: str = "America/Sao_Paulo"
    CELERY_ENABLE_UTC: bool = True
    CELERY_TASK_SOFT_TIME_LIMIT: int = 300  # 5 minutes
    CELERY_TASK_TIME_LIMIT: int = 600       # 10 minutes
    CELERY_TASK_MAX_RETRIES: int = 3
    CELERY_TASK_DEFAULT_RETRY_DELAY: int = 60  # 1 minute
    CELERY_WORKER_PREFETCH_MULTIPLIER: int = 1
    CELERY_WORKER_MAX_TASKS_PER_CHILD: int = 1000
    CELERY_RESULT_EXPIRES: int = 3600  # 1 hour
    
    # Flower (Celery monitoring)
    FLOWER_PORT: int = 5555
    FLOWER_BASIC_AUTH: str = "admin:admin123"  # Change in production
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Environment-specific overrides
if os.getenv("ENVIRONMENT") == "development":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
    settings.ALLOWED_ORIGINS.append("http://localhost:3000")
    settings.ALLOWED_HOSTS.append("localhost")

elif os.getenv("ENVIRONMENT") == "staging":
    settings.DEBUG = True
    settings.LOG_LEVEL = "DEBUG"
    settings.SENTRY_DSN = os.getenv("SENTRY_DSN")

elif os.getenv("ENVIRONMENT") == "production":
    settings.DEBUG = False
    settings.LOG_LEVEL = "WARNING"
    settings.SENTRY_DSN = os.getenv("SENTRY_DSN")
    settings.SECRET_KEY = os.getenv("SECRET_KEY")
    settings.DATABASE_URL = os.getenv("DATABASE_URL")
    settings.REDIS_URL = os.getenv("REDIS_URL")
