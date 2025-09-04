"""Structured logging system for comprehensive observability"""

import json
import logging
import sys
import traceback
from datetime import datetime
from typing import Dict, Any, Optional, Union
from enum import Enum
from dataclasses import dataclass, asdict
from contextvars import ContextVar
from functools import wraps
import uuid

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

# Context variables for request tracking
request_id_var: ContextVar[str] = ContextVar('request_id', default=None)
user_id_var: ContextVar[str] = ContextVar('user_id', default=None)
tenant_id_var: ContextVar[str] = ContextVar('tenant_id', default=None)

class LogLevel(str, Enum):
    """Log levels"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class LogCategory(str, Enum):
    """Log categories for better organization"""
    APPLICATION = "application"
    SECURITY = "security"
    PERFORMANCE = "performance"
    BUSINESS = "business"
    INTEGRATION = "integration"
    AUDIT = "audit"
    SYSTEM = "system"
    USER_ACTION = "user_action"
    API = "api"
    DATABASE = "database"
    SYNC = "sync"
    BILLING = "billing"

@dataclass
class LogContext:
    """Context information for structured logs"""
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    session_id: Optional[str] = None
    correlation_id: Optional[str] = None
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    
    @classmethod
    def from_request(cls, request: Request) -> 'LogContext':
        """Create context from FastAPI request"""
        return cls(
            request_id=getattr(request.state, 'request_id', None),
            user_id=getattr(request.state, 'user_id', None),
            tenant_id=getattr(request.state, 'tenant_id', None),
            session_id=request.headers.get('X-Session-ID'),
            correlation_id=request.headers.get('X-Correlation-ID'),
            trace_id=request.headers.get('X-Trace-ID'),
            span_id=request.headers.get('X-Span-ID')
        )
    
    @classmethod
    def current(cls) -> 'LogContext':
        """Get current context from context vars"""
        return cls(
            request_id=request_id_var.get(None),
            user_id=user_id_var.get(None),
            tenant_id=tenant_id_var.get(None)
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in asdict(self).items() if v is not None}

@dataclass
class StructuredLogEntry:
    """Structured log entry"""
    timestamp: str
    level: str
    category: str
    message: str
    logger_name: str
    module: str
    function: str
    line_number: int
    context: Dict[str, Any]
    data: Dict[str, Any]
    error: Optional[Dict[str, Any]] = None
    performance: Optional[Dict[str, Any]] = None
    
    def to_json(self) -> str:
        """Convert to JSON string"""
        return json.dumps(asdict(self), default=str, ensure_ascii=False)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)

class StructuredLogger:
    """Enhanced logger with structured output"""
    
    def __init__(self, name: str, level: LogLevel = LogLevel.INFO):
        self.name = name
        self.logger = logging.getLogger(name)
        self.logger.setLevel(getattr(logging, level.value))
        
        # Remove existing handlers to avoid duplicates
        self.logger.handlers.clear()
        
        # Add structured handler
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        self.logger.addHandler(handler)
        
        # Prevent propagation to avoid duplicate logs
        self.logger.propagate = False
    
    def _create_log_entry(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[Exception] = None,
        performance: Optional[Dict[str, Any]] = None,
        extra_context: Optional[Dict[str, Any]] = None
    ) -> StructuredLogEntry:
        """Create structured log entry"""
        
        # Get caller information
        frame = sys._getframe(2)  # Go back 2 frames to get actual caller
        
        # Build context
        context = LogContext.current().to_dict()
        if extra_context:
            context.update(extra_context)
        
        # Build error information
        error_info = None
        if error:
            error_info = {
                "type": type(error).__name__,
                "message": str(error),
                "traceback": traceback.format_exc() if hasattr(error, '__traceback__') else None
            }
        
        return StructuredLogEntry(
            timestamp=datetime.utcnow().isoformat() + "Z",
            level=level.value,
            category=category.value,
            message=message,
            logger_name=self.name,
            module=frame.f_globals.get('__name__', 'unknown'),
            function=frame.f_code.co_name,
            line_number=frame.f_lineno,
            context=context,
            data=data or {},
            error=error_info,
            performance=performance
        )
    
    def debug(
        self,
        message: str,
        category: LogCategory = LogCategory.APPLICATION,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log debug message"""
        entry = self._create_log_entry(LogLevel.DEBUG, category, message, data, **kwargs)
        self.logger.debug(entry.to_json())
    
    def info(
        self,
        message: str,
        category: LogCategory = LogCategory.APPLICATION,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log info message"""
        entry = self._create_log_entry(LogLevel.INFO, category, message, data, **kwargs)
        self.logger.info(entry.to_json())
    
    def warning(
        self,
        message: str,
        category: LogCategory = LogCategory.APPLICATION,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log warning message"""
        entry = self._create_log_entry(LogLevel.WARNING, category, message, data, **kwargs)
        self.logger.warning(entry.to_json())
    
    def error(
        self,
        message: str,
        category: LogCategory = LogCategory.APPLICATION,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[Exception] = None,
        **kwargs
    ):
        """Log error message"""
        entry = self._create_log_entry(LogLevel.ERROR, category, message, data, error, **kwargs)
        self.logger.error(entry.to_json())
    
    def critical(
        self,
        message: str,
        category: LogCategory = LogCategory.APPLICATION,
        data: Optional[Dict[str, Any]] = None,
        error: Optional[Exception] = None,
        **kwargs
    ):
        """Log critical message"""
        entry = self._create_log_entry(LogLevel.CRITICAL, category, message, data, error, **kwargs)
        self.logger.critical(entry.to_json())
    
    def audit(
        self,
        action: str,
        resource: str,
        resource_id: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        success: bool = True,
        **kwargs
    ):
        """Log audit event"""
        audit_data = {
            "action": action,
            "resource": resource,
            "resource_id": resource_id,
            "success": success,
            **(data or {})
        }
        
        message = f"Audit: {action} on {resource}"
        if resource_id:
            message += f" (ID: {resource_id})"
        
        entry = self._create_log_entry(
            LogLevel.INFO,
            LogCategory.AUDIT,
            message,
            audit_data,
            **kwargs
        )
        self.logger.info(entry.to_json())
    
    def performance(
        self,
        operation: str,
        duration_ms: float,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log performance metrics"""
        perf_data = {
            "operation": operation,
            "duration_ms": duration_ms,
            **(data or {})
        }
        
        performance_info = {
            "duration_ms": duration_ms,
            "operation": operation
        }
        
        level = LogLevel.WARNING if duration_ms > 5000 else LogLevel.INFO
        message = f"Performance: {operation} took {duration_ms:.2f}ms"
        
        entry = self._create_log_entry(
            level,
            LogCategory.PERFORMANCE,
            message,
            perf_data,
            performance=performance_info,
            **kwargs
        )
        self.logger.log(getattr(logging, level.value), entry.to_json())
    
    def business_event(
        self,
        event: str,
        entity_type: str,
        entity_id: str,
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log business event"""
        business_data = {
            "event": event,
            "entity_type": entity_type,
            "entity_id": entity_id,
            **(data or {})
        }
        
        message = f"Business Event: {event} for {entity_type} {entity_id}"
        
        entry = self._create_log_entry(
            LogLevel.INFO,
            LogCategory.BUSINESS,
            message,
            business_data,
            **kwargs
        )
        self.logger.info(entry.to_json())
    
    def security_event(
        self,
        event_type: str,
        severity: str = "medium",
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ):
        """Log security event"""
        security_data = {
            "event_type": event_type,
            "severity": severity,
            **(data or {})
        }
        
        level = LogLevel.CRITICAL if severity == "high" else LogLevel.WARNING
        message = f"Security Event: {event_type} (severity: {severity})"
        
        entry = self._create_log_entry(
            level,
            LogCategory.SECURITY,
            message,
            security_data,
            **kwargs
        )
        self.logger.log(getattr(logging, level.value), entry.to_json())

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured logs"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as structured JSON"""
        # If the message is already JSON (from StructuredLogger), return as-is
        if hasattr(record, 'getMessage'):
            message = record.getMessage()
            try:
                # Try to parse as JSON to validate it's already structured
                json.loads(message)
                return message
            except (json.JSONDecodeError, TypeError):
                pass
        
        # For non-structured logs, create a basic structured format
        entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "category": "application",
            "message": record.getMessage(),
            "logger_name": record.name,
            "module": record.module,
            "function": record.funcName,
            "line_number": record.lineno,
            "context": LogContext.current().to_dict(),
            "data": {}
        }
        
        # Add exception info if present
        if record.exc_info:
            entry["error"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": self.formatException(record.exc_info)
            }
        
        return json.dumps(entry, default=str, ensure_ascii=False)

# Global logger instances
loggers: Dict[str, StructuredLogger] = {}

def get_logger(name: str, level: LogLevel = LogLevel.INFO) -> StructuredLogger:
    """Get or create a structured logger"""
    if name not in loggers:
        loggers[name] = StructuredLogger(name, level)
    return loggers[name]

# Convenience function for getting module logger
def get_module_logger(level: LogLevel = LogLevel.INFO) -> StructuredLogger:
    """Get logger for the calling module"""
    frame = sys._getframe(1)
    module_name = frame.f_globals.get('__name__', 'unknown')
    return get_logger(module_name, level)

# Decorators for automatic logging

def log_function_call(
    logger: Optional[StructuredLogger] = None,
    category: LogCategory = LogCategory.APPLICATION,
    log_args: bool = False,
    log_result: bool = False,
    log_performance: bool = True
):
    """Decorator to automatically log function calls"""
    def decorator(func):
        nonlocal logger
        if logger is None:
            logger = get_logger(func.__module__)
        
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            
            # Log function entry
            log_data = {"function": func.__name__}
            if log_args:
                log_data["args"] = str(args)
                log_data["kwargs"] = kwargs
            
            logger.debug(
                f"Entering function {func.__name__}",
                category=category,
                data=log_data
            )
            
            try:
                result = await func(*args, **kwargs)
                
                # Log successful completion
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                completion_data = {"function": func.__name__, "success": True}
                if log_result:
                    completion_data["result"] = str(result)
                
                if log_performance:
                    logger.performance(
                        f"Function {func.__name__}",
                        duration_ms,
                        data=completion_data
                    )
                else:
                    logger.debug(
                        f"Completed function {func.__name__}",
                        category=category,
                        data=completion_data
                    )
                
                return result
                
            except Exception as e:
                # Log error
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                logger.error(
                    f"Function {func.__name__} failed",
                    category=category,
                    data={
                        "function": func.__name__,
                        "success": False,
                        "duration_ms": duration_ms
                    },
                    error=e
                )
                raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = datetime.utcnow()
            
            # Log function entry
            log_data = {"function": func.__name__}
            if log_args:
                log_data["args"] = str(args)
                log_data["kwargs"] = kwargs
            
            logger.debug(
                f"Entering function {func.__name__}",
                category=category,
                data=log_data
            )
            
            try:
                result = func(*args, **kwargs)
                
                # Log successful completion
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                completion_data = {"function": func.__name__, "success": True}
                if log_result:
                    completion_data["result"] = str(result)
                
                if log_performance:
                    logger.performance(
                        f"Function {func.__name__}",
                        duration_ms,
                        data=completion_data
                    )
                else:
                    logger.debug(
                        f"Completed function {func.__name__}",
                        category=category,
                        data=completion_data
                    )
                
                return result
                
            except Exception as e:
                # Log error
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                logger.error(
                    f"Function {func.__name__} failed",
                    category=category,
                    data={
                        "function": func.__name__,
                        "success": False,
                        "duration_ms": duration_ms
                    },
                    error=e
                )
                raise
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def log_api_call(
    logger: Optional[StructuredLogger] = None,
    log_request: bool = True,
    log_response: bool = False
):
    """Decorator for API endpoint logging"""
    def decorator(func):
        nonlocal logger
        if logger is None:
            logger = get_logger(func.__module__)
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request from args (assuming it's the first argument)
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            start_time = datetime.utcnow()
            
            # Set context from request
            if request:
                context = LogContext.from_request(request)
                request_id_var.set(context.request_id)
                user_id_var.set(context.user_id)
                tenant_id_var.set(context.tenant_id)
            
            # Log API call start
            log_data = {
                "endpoint": func.__name__,
                "method": request.method if request else "unknown",
                "path": str(request.url.path) if request else "unknown"
            }
            
            if log_request and request:
                log_data["query_params"] = dict(request.query_params)
                log_data["headers"] = dict(request.headers)
            
            logger.info(
                f"API call: {log_data['method']} {log_data['path']}",
                category=LogCategory.API,
                data=log_data
            )
            
            try:
                result = await func(*args, **kwargs)
                
                # Log successful response
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                response_data = {
                    "endpoint": func.__name__,
                    "success": True,
                    "status_code": getattr(result, 'status_code', 200)
                }
                
                if log_response:
                    response_data["response"] = str(result)
                
                logger.performance(
                    f"API response: {log_data['method']} {log_data['path']}",
                    duration_ms,
                    data=response_data
                )
                
                return result
                
            except Exception as e:
                # Log error response
                end_time = datetime.utcnow()
                duration_ms = (end_time - start_time).total_seconds() * 1000
                
                logger.error(
                    f"API error: {log_data['method']} {log_data['path']}",
                    category=LogCategory.API,
                    data={
                        "endpoint": func.__name__,
                        "success": False,
                        "duration_ms": duration_ms
                    },
                    error=e
                )
                raise
        
        return wrapper
    return decorator

# Context managers for setting log context

class LogContextManager:
    """Context manager for setting log context"""
    
    def __init__(
        self,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None
    ):
        self.request_id = request_id
        self.user_id = user_id
        self.tenant_id = tenant_id
        self.tokens = []
    
    def __enter__(self):
        if self.request_id:
            self.tokens.append(request_id_var.set(self.request_id))
        if self.user_id:
            self.tokens.append(user_id_var.set(self.user_id))
        if self.tenant_id:
            self.tokens.append(tenant_id_var.set(self.tenant_id))
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        for token in reversed(self.tokens):
            token.var.set(token.old_value)

def set_log_context(
    request_id: Optional[str] = None,
    user_id: Optional[str] = None,
    tenant_id: Optional[str] = None
) -> LogContextManager:
    """Set log context for the current scope"""
    return LogContextManager(request_id, user_id, tenant_id)

# Initialize default logging configuration
def configure_logging(level: LogLevel = LogLevel.INFO):
    """Configure structured logging for the application"""
    # Set root logger level
    logging.getLogger().setLevel(getattr(logging, level.value))
    
    # Configure uvicorn loggers to use structured format
    for logger_name in ['uvicorn', 'uvicorn.access', 'uvicorn.error']:
        logger = logging.getLogger(logger_name)
        logger.handlers.clear()
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        logger.propagate = False
    
    # Configure SQLAlchemy logger
    sqlalchemy_logger = logging.getLogger('sqlalchemy.engine')
    sqlalchemy_logger.handlers.clear()
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    sqlalchemy_logger.addHandler(handler)
    sqlalchemy_logger.propagate = False

# Export commonly used loggers
app_logger = get_logger('app')
api_logger = get_logger('app.api')
security_logger = get_logger('app.security')
performance_logger = get_logger('app.performance')
audit_logger = get_logger('app.audit')
business_logger = get_logger('app.business')
integration_logger = get_logger('app.integration')
sync_logger = get_logger('app.sync')
billing_logger = get_logger('app.billing')