"""
Database configuration and connection management for ML-Bling Sync API
"""

from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import SQLAlchemyError
import logging
from typing import Generator
import asyncio
from contextlib import asynccontextmanager

from app.core.config import settings
from app.domain.models import Base

# Configure logging
logger = logging.getLogger(__name__)

# Database engine
engine = None
SessionLocal = None

def init_database():
    """Initialize database connection"""
    global engine, SessionLocal
    
    try:
        # Create database engine with connection pooling
        engine = create_engine(
            settings.DATABASE_URL,
            poolclass=QueuePool,
            pool_size=settings.DATABASE_POOL_SIZE,
            max_overflow=settings.DATABASE_MAX_OVERFLOW,
            pool_pre_ping=True,
            pool_recycle=3600,  # Recycle connections every hour
            echo=settings.DEBUG
        )
        
        # Create session factory
        SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=engine
        )
        
        logger.info("✅ Database connection initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        raise

def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    if SessionLocal is None:
        init_database()
    
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Run migrations if using Alembic
        await run_migrations()
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize database tables: {e}")
        raise

async def close_db():
    """Close database connections"""
    try:
        if engine:
            engine.dispose()
            logger.info("✅ Database connections closed successfully")
    except Exception as e:
        logger.error(f"❌ Error closing database connections: {e}")

async def run_migrations():
    """Run database migrations using Alembic"""
    try:
        from alembic import command
        from alembic.config import Config
        
        # Create Alembic configuration
        alembic_cfg = Config("alembic.ini")
        
        # Run upgrade to head
        command.upgrade(alembic_cfg, "head")
        logger.info("✅ Database migrations completed successfully")
        
    except ImportError:
        logger.warning("⚠️ Alembic not available, skipping migrations")
    except Exception as e:
        logger.error(f"❌ Failed to run migrations: {e}")
        # Don't raise here as migrations are optional for development

def get_db_session() -> Session:
    """Get a database session (for non-async contexts)"""
    if SessionLocal is None:
        init_database()
    
    return SessionLocal()

@asynccontextmanager
async def get_db_async():
    """Get database session as async context manager"""
    db = get_db_session()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

# Database health check
def check_database_health() -> bool:
    """Check if database is healthy"""
    try:
        if engine is None:
            return False
        
        # Test connection
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
        
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

# Database statistics
def get_database_stats() -> dict:
    """Get database connection pool statistics"""
    if engine is None:
        return {}
    
    try:
        pool = engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": pool.invalid()
        }
    except Exception as e:
        logger.error(f"Failed to get database stats: {e}")
        return {}

# Transaction management
class DatabaseTransaction:
    """Database transaction context manager"""
    
    def __init__(self, db: Session):
        self.db = db
        self.committed = False
    
    def __enter__(self):
        return self.db
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None and not self.committed:
            self.db.commit()
            self.committed = True
        elif exc_type is not None:
            self.db.rollback()
        self.db.close()
    
    def commit(self):
        """Commit the transaction"""
        self.db.commit()
        self.committed = True
    
    def rollback(self):
        """Rollback the transaction"""
        self.db.rollback()

# Database utilities
def execute_raw_sql(sql: str, params: dict = None) -> list:
    """Execute raw SQL query"""
    try:
        with get_db_session() as db:
            result = db.execute(sql, params or {})
            return [dict(row) for row in result]
    except Exception as e:
        logger.error(f"Raw SQL execution failed: {e}")
        raise

def bulk_insert(model_class, data_list: list):
    """Bulk insert data into database"""
    try:
        with get_db_session() as db:
            db.bulk_insert_mappings(model_class, data_list)
            db.commit()
            logger.info(f"✅ Bulk inserted {len(data_list)} records into {model_class.__name__}")
    except Exception as e:
        logger.error(f"❌ Bulk insert failed: {e}")
        raise

def bulk_update(model_class, data_list: list, update_fields: list):
    """Bulk update data in database"""
    try:
        with get_db_session() as db:
            db.bulk_update_mappings(model_class, data_list, update_fields)
            db.commit()
            logger.info(f"✅ Bulk updated {len(data_list)} records in {model_class.__name__}")
    except Exception as e:
        logger.error(f"❌ Bulk update failed: {e}")
        raise

# Connection pool monitoring
async def monitor_connection_pool():
    """Monitor database connection pool health"""
    while True:
        try:
            if engine:
                stats = get_database_stats()
                logger.debug(f"Database pool stats: {stats}")
                
                # Alert if pool is getting full
                if stats.get("checked_out", 0) > settings.DATABASE_POOL_SIZE * 0.8:
                    logger.warning("⚠️ Database connection pool is getting full")
                
                # Alert if there are invalid connections
                if stats.get("invalid", 0) > 0:
                    logger.warning(f"⚠️ {stats['invalid']} invalid database connections detected")
            
            # Wait before next check
            await asyncio.sleep(60)  # Check every minute
            
        except Exception as e:
            logger.error(f"Connection pool monitoring error: {e}")
            await asyncio.sleep(60)

# Database initialization on import
if __name__ == "__main__":
    init_database()
