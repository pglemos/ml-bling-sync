"""Alerting and monitoring system for proactive issue detection"""

import asyncio
import json
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional, Callable, Union
from enum import Enum
from dataclasses import dataclass, asdict
from abc import ABC, abstractmethod
import httpx
import logging

from app.core.redis import get_redis
from app.core.config import settings
from app.core.structured_logging import get_logger, LogCategory

logger = get_logger(__name__)

class AlertSeverity(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    """Alert status"""
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"

class AlertCategory(str, Enum):
    """Alert categories"""
    SYSTEM = "system"
    PERFORMANCE = "performance"
    SECURITY = "security"
    BUSINESS = "business"
    INTEGRATION = "integration"
    HEALTH = "health"
    BILLING = "billing"
    SYNC = "sync"

@dataclass
class Alert:
    """Alert data structure"""
    id: str
    title: str
    description: str
    severity: AlertSeverity
    category: AlertCategory
    status: AlertStatus
    created_at: datetime
    updated_at: datetime
    source: str
    tags: List[str]
    metadata: Dict[str, Any]
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    suppressed_until: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        data = asdict(self)
        # Convert datetime objects to ISO strings
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat() if value else None
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Alert':
        """Create from dictionary"""
        # Convert ISO strings back to datetime objects
        datetime_fields = ['created_at', 'updated_at', 'acknowledged_at', 'resolved_at', 'suppressed_until']
        for field in datetime_fields:
            if data.get(field):
                data[field] = datetime.fromisoformat(data[field].replace('Z', '+00:00'))
        
        return cls(**data)

@dataclass
class AlertRule:
    """Alert rule configuration"""
    id: str
    name: str
    description: str
    category: AlertCategory
    severity: AlertSeverity
    condition: str  # Python expression or SQL query
    threshold: Union[int, float]
    comparison: str  # 'gt', 'lt', 'eq', 'gte', 'lte'
    window_minutes: int  # Time window for evaluation
    cooldown_minutes: int  # Minimum time between alerts
    enabled: bool
    tags: List[str]
    notification_channels: List[str]
    metadata: Dict[str, Any]
    
    def evaluate(self, value: Union[int, float]) -> bool:
        """Evaluate if the rule condition is met"""
        comparisons = {
            'gt': lambda x, y: x > y,
            'gte': lambda x, y: x >= y,
            'lt': lambda x, y: x < y,
            'lte': lambda x, y: x <= y,
            'eq': lambda x, y: x == y,
            'ne': lambda x, y: x != y
        }
        
        comparison_func = comparisons.get(self.comparison)
        if not comparison_func:
            raise ValueError(f"Invalid comparison operator: {self.comparison}")
        
        return comparison_func(value, self.threshold)

class NotificationChannel(ABC):
    """Abstract base class for notification channels"""
    
    @abstractmethod
    async def send(self, alert: Alert) -> bool:
        """Send alert notification"""
        pass

class EmailNotificationChannel(NotificationChannel):
    """Email notification channel"""
    
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        username: str,
        password: str,
        from_email: str,
        to_emails: List[str],
        use_tls: bool = True
    ):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
        self.from_email = from_email
        self.to_emails = to_emails
        self.use_tls = use_tls
    
    async def send(self, alert: Alert) -> bool:
        """Send email notification"""
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(self.to_emails)
            msg['Subject'] = f"[{alert.severity.upper()}] {alert.title}"
            
            # Create email body
            body = self._create_email_body(alert)
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            
            logger.info(
                "Email alert sent successfully",
                category=LogCategory.SYSTEM,
                data={
                    "alert_id": alert.id,
                    "recipients": self.to_emails,
                    "severity": alert.severity
                }
            )
            return True
            
        except Exception as e:
            logger.error(
                "Failed to send email alert",
                category=LogCategory.SYSTEM,
                data={
                    "alert_id": alert.id,
                    "recipients": self.to_emails
                },
                error=e
            )
            return False
    
    def _create_email_body(self, alert: Alert) -> str:
        """Create HTML email body"""
        severity_colors = {
            AlertSeverity.LOW: "#28a745",
            AlertSeverity.MEDIUM: "#ffc107",
            AlertSeverity.HIGH: "#fd7e14",
            AlertSeverity.CRITICAL: "#dc3545"
        }
        
        color = severity_colors.get(alert.severity, "#6c757d")
        
        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
                <div style="background-color: {color}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
                    <h2 style="margin: 0;">{alert.severity.upper()} Alert</h2>
                </div>
                <div style="border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
                    <h3 style="color: #333; margin-top: 0;">{alert.title}</h3>
                    <p style="color: #666; line-height: 1.5;">{alert.description}</p>
                    
                    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Alert ID:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">{alert.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Category:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">{alert.category.value}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Source:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">{alert.source}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Created:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">{alert.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Tags:</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">{', '.join(alert.tags)}</td>
                        </tr>
                    </table>
                    
                    {self._format_metadata(alert.metadata)}
                </div>
            </div>
        </body>
        </html>
        """
    
    def _format_metadata(self, metadata: Dict[str, Any]) -> str:
        """Format metadata as HTML table"""
        if not metadata:
            return ""
        
        rows = ""
        for key, value in metadata.items():
            rows += f"""
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">{key}:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">{value}</td>
            </tr>
            """
        
        return f"""
        <h4 style="color: #333; margin-top: 20px;">Additional Information:</h4>
        <table style="width: 100%; border-collapse: collapse;">
            {rows}
        </table>
        """

class WebhookNotificationChannel(NotificationChannel):
    """Webhook notification channel (Slack, Discord, etc.)"""
    
    def __init__(self, webhook_url: str, headers: Optional[Dict[str, str]] = None):
        self.webhook_url = webhook_url
        self.headers = headers or {}
    
    async def send(self, alert: Alert) -> bool:
        """Send webhook notification"""
        try:
            payload = self._create_payload(alert)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers=self.headers,
                    timeout=30
                )
                response.raise_for_status()
            
            logger.info(
                "Webhook alert sent successfully",
                category=LogCategory.SYSTEM,
                data={
                    "alert_id": alert.id,
                    "webhook_url": self.webhook_url,
                    "status_code": response.status_code
                }
            )
            return True
            
        except Exception as e:
            logger.error(
                "Failed to send webhook alert",
                category=LogCategory.SYSTEM,
                data={
                    "alert_id": alert.id,
                    "webhook_url": self.webhook_url
                },
                error=e
            )
            return False
    
    def _create_payload(self, alert: Alert) -> Dict[str, Any]:
        """Create webhook payload"""
        # Generic webhook format - can be customized for specific services
        return {
            "alert_id": alert.id,
            "title": alert.title,
            "description": alert.description,
            "severity": alert.severity.value,
            "category": alert.category.value,
            "status": alert.status.value,
            "source": alert.source,
            "created_at": alert.created_at.isoformat(),
            "tags": alert.tags,
            "metadata": alert.metadata
        }

class SlackNotificationChannel(WebhookNotificationChannel):
    """Slack-specific notification channel"""
    
    def _create_payload(self, alert: Alert) -> Dict[str, Any]:
        """Create Slack-specific payload"""
        severity_colors = {
            AlertSeverity.LOW: "good",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "warning",
            AlertSeverity.CRITICAL: "danger"
        }
        
        severity_emojis = {
            AlertSeverity.LOW: ":white_check_mark:",
            AlertSeverity.MEDIUM: ":warning:",
            AlertSeverity.HIGH: ":exclamation:",
            AlertSeverity.CRITICAL: ":rotating_light:"
        }
        
        color = severity_colors.get(alert.severity, "#808080")
        emoji = severity_emojis.get(alert.severity, ":question:")
        
        fields = [
            {
                "title": "Category",
                "value": alert.category.value,
                "short": True
            },
            {
                "title": "Source",
                "value": alert.source,
                "short": True
            },
            {
                "title": "Created",
                "value": alert.created_at.strftime('%Y-%m-%d %H:%M:%S UTC'),
                "short": True
            }
        ]
        
        # Add metadata fields
        for key, value in alert.metadata.items():
            fields.append({
                "title": key.replace('_', ' ').title(),
                "value": str(value),
                "short": True
            })
        
        return {
            "text": f"{emoji} {alert.severity.upper()} Alert",
            "attachments": [
                {
                    "color": color,
                    "title": alert.title,
                    "text": alert.description,
                    "fields": fields,
                    "footer": "ML Bling Sync Monitoring",
                    "ts": int(alert.created_at.timestamp())
                }
            ]
        }

class AlertManager:
    """Central alert management system"""
    
    def __init__(self):
        self.redis = get_redis()
        self.notification_channels: Dict[str, NotificationChannel] = {}
        self.alert_rules: Dict[str, AlertRule] = {}
        self.active_alerts: Dict[str, Alert] = {}
        self._load_alert_rules()
    
    def register_notification_channel(self, name: str, channel: NotificationChannel):
        """Register a notification channel"""
        self.notification_channels[name] = channel
        logger.info(
            "Notification channel registered",
            category=LogCategory.SYSTEM,
            data={"channel_name": name, "channel_type": type(channel).__name__}
        )
    
    def add_alert_rule(self, rule: AlertRule):
        """Add an alert rule"""
        self.alert_rules[rule.id] = rule
        logger.info(
            "Alert rule added",
            category=LogCategory.SYSTEM,
            data={"rule_id": rule.id, "rule_name": rule.name}
        )
    
    async def create_alert(
        self,
        title: str,
        description: str,
        severity: AlertSeverity,
        category: AlertCategory,
        source: str,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        rule_id: Optional[str] = None
    ) -> Alert:
        """Create a new alert"""
        import uuid
        
        alert = Alert(
            id=str(uuid.uuid4()),
            title=title,
            description=description,
            severity=severity,
            category=category,
            status=AlertStatus.ACTIVE,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            source=source,
            tags=tags or [],
            metadata=metadata or {}
        )
        
        # Store alert in Redis
        await self._store_alert(alert)
        
        # Add to active alerts
        self.active_alerts[alert.id] = alert
        
        # Send notifications
        if rule_id and rule_id in self.alert_rules:
            rule = self.alert_rules[rule_id]
            await self._send_notifications(alert, rule.notification_channels)
        else:
            # Send to default channels based on severity
            await self._send_notifications(alert, self._get_default_channels(severity))
        
        logger.info(
            "Alert created",
            category=LogCategory.SYSTEM,
            data={
                "alert_id": alert.id,
                "title": alert.title,
                "severity": alert.severity,
                "category": alert.category
            }
        )
        
        return alert
    
    async def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """Acknowledge an alert"""
        alert = await self._get_alert(alert_id)
        if not alert:
            return False
        
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.utcnow()
        alert.updated_at = datetime.utcnow()
        
        await self._store_alert(alert)
        
        logger.info(
            "Alert acknowledged",
            category=LogCategory.SYSTEM,
            data={
                "alert_id": alert_id,
                "acknowledged_by": acknowledged_by
            }
        )
        
        return True
    
    async def resolve_alert(self, alert_id: str, resolved_by: Optional[str] = None) -> bool:
        """Resolve an alert"""
        alert = await self._get_alert(alert_id)
        if not alert:
            return False
        
        alert.status = AlertStatus.RESOLVED
        alert.resolved_at = datetime.utcnow()
        alert.updated_at = datetime.utcnow()
        
        await self._store_alert(alert)
        
        # Remove from active alerts
        if alert_id in self.active_alerts:
            del self.active_alerts[alert_id]
        
        logger.info(
            "Alert resolved",
            category=LogCategory.SYSTEM,
            data={
                "alert_id": alert_id,
                "resolved_by": resolved_by
            }
        )
        
        return True
    
    async def suppress_alert(self, alert_id: str, duration_minutes: int) -> bool:
        """Suppress an alert for a specified duration"""
        alert = await self._get_alert(alert_id)
        if not alert:
            return False
        
        alert.status = AlertStatus.SUPPRESSED
        alert.suppressed_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        alert.updated_at = datetime.utcnow()
        
        await self._store_alert(alert)
        
        logger.info(
            "Alert suppressed",
            category=LogCategory.SYSTEM,
            data={
                "alert_id": alert_id,
                "duration_minutes": duration_minutes
            }
        )
        
        return True
    
    async def evaluate_rules(self, metrics: Dict[str, Union[int, float]]):
        """Evaluate alert rules against current metrics"""
        for rule_id, rule in self.alert_rules.items():
            if not rule.enabled:
                continue
            
            # Check if we're in cooldown period
            if await self._is_in_cooldown(rule_id, rule.cooldown_minutes):
                continue
            
            # Get metric value for this rule
            metric_value = metrics.get(rule.condition)
            if metric_value is None:
                continue
            
            # Evaluate rule condition
            if rule.evaluate(metric_value):
                # Create alert
                await self.create_alert(
                    title=f"Rule triggered: {rule.name}",
                    description=f"Metric '{rule.condition}' value {metric_value} {rule.comparison} {rule.threshold}",
                    severity=rule.severity,
                    category=rule.category,
                    source="alert_rule",
                    tags=rule.tags + [f"rule:{rule_id}"],
                    metadata={
                        "rule_id": rule_id,
                        "rule_name": rule.name,
                        "metric_name": rule.condition,
                        "metric_value": metric_value,
                        "threshold": rule.threshold,
                        "comparison": rule.comparison
                    },
                    rule_id=rule_id
                )
                
                # Set cooldown
                await self._set_cooldown(rule_id, rule.cooldown_minutes)
    
    async def get_active_alerts(self) -> List[Alert]:
        """Get all active alerts"""
        alerts = []
        for alert_id in await self.redis.smembers("active_alerts"):
            alert = await self._get_alert(alert_id)
            if alert and alert.status == AlertStatus.ACTIVE:
                alerts.append(alert)
        return alerts
    
    async def get_alert_history(
        self,
        limit: int = 100,
        category: Optional[AlertCategory] = None,
        severity: Optional[AlertSeverity] = None
    ) -> List[Alert]:
        """Get alert history with optional filtering"""
        # This would typically query a database or time-series store
        # For now, we'll return from Redis with basic filtering
        alerts = []
        alert_keys = await self.redis.keys("alert:*")
        
        for key in alert_keys[-limit:]:
            alert_data = await self.redis.hgetall(key)
            if alert_data:
                alert = Alert.from_dict(alert_data)
                
                # Apply filters
                if category and alert.category != category:
                    continue
                if severity and alert.severity != severity:
                    continue
                
                alerts.append(alert)
        
        return sorted(alerts, key=lambda x: x.created_at, reverse=True)
    
    async def _store_alert(self, alert: Alert):
        """Store alert in Redis"""
        key = f"alert:{alert.id}"
        await self.redis.hset(key, mapping=alert.to_dict())
        await self.redis.expire(key, 86400 * 30)  # Keep for 30 days
        
        if alert.status == AlertStatus.ACTIVE:
            await self.redis.sadd("active_alerts", alert.id)
        else:
            await self.redis.srem("active_alerts", alert.id)
    
    async def _get_alert(self, alert_id: str) -> Optional[Alert]:
        """Get alert from Redis"""
        key = f"alert:{alert_id}"
        alert_data = await self.redis.hgetall(key)
        if alert_data:
            return Alert.from_dict(alert_data)
        return None
    
    async def _send_notifications(self, alert: Alert, channel_names: List[str]):
        """Send notifications to specified channels"""
        tasks = []
        for channel_name in channel_names:
            if channel_name in self.notification_channels:
                channel = self.notification_channels[channel_name]
                tasks.append(channel.send(alert))
        
        if tasks:
            results = await asyncio.gather(*tasks, return_exceptions=True)
            success_count = sum(1 for r in results if r is True)
            
            logger.info(
                "Alert notifications sent",
                category=LogCategory.SYSTEM,
                data={
                    "alert_id": alert.id,
                    "channels_attempted": len(tasks),
                    "channels_successful": success_count
                }
            )
    
    def _get_default_channels(self, severity: AlertSeverity) -> List[str]:
        """Get default notification channels based on severity"""
        if severity == AlertSeverity.CRITICAL:
            return ["email", "slack", "webhook"]
        elif severity == AlertSeverity.HIGH:
            return ["email", "slack"]
        elif severity == AlertSeverity.MEDIUM:
            return ["slack"]
        else:
            return ["slack"]
    
    async def _is_in_cooldown(self, rule_id: str, cooldown_minutes: int) -> bool:
        """Check if rule is in cooldown period"""
        key = f"rule_cooldown:{rule_id}"
        last_triggered = await self.redis.get(key)
        if last_triggered:
            last_time = datetime.fromisoformat(last_triggered)
            return datetime.utcnow() < last_time + timedelta(minutes=cooldown_minutes)
        return False
    
    async def _set_cooldown(self, rule_id: str, cooldown_minutes: int):
        """Set cooldown for rule"""
        key = f"rule_cooldown:{rule_id}"
        await self.redis.setex(
            key,
            cooldown_minutes * 60,
            datetime.utcnow().isoformat()
        )
    
    def _load_alert_rules(self):
        """Load predefined alert rules"""
        # Define common alert rules
        rules = [
            AlertRule(
                id="high_cpu_usage",
                name="High CPU Usage",
                description="CPU usage is above 90%",
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.HIGH,
                condition="cpu_percent",
                threshold=90,
                comparison="gt",
                window_minutes=5,
                cooldown_minutes=15,
                enabled=True,
                tags=["system", "performance"],
                notification_channels=["email", "slack"],
                metadata={}
            ),
            AlertRule(
                id="high_memory_usage",
                name="High Memory Usage",
                description="Memory usage is above 85%",
                category=AlertCategory.SYSTEM,
                severity=AlertSeverity.HIGH,
                condition="memory_percent",
                threshold=85,
                comparison="gt",
                window_minutes=5,
                cooldown_minutes=15,
                enabled=True,
                tags=["system", "performance"],
                notification_channels=["email", "slack"],
                metadata={}
            ),
            AlertRule(
                id="high_error_rate",
                name="High Error Rate",
                description="API error rate is above 5%",
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.HIGH,
                condition="error_rate_percent",
                threshold=5,
                comparison="gt",
                window_minutes=10,
                cooldown_minutes=30,
                enabled=True,
                tags=["api", "errors"],
                notification_channels=["email", "slack"],
                metadata={}
            ),
            AlertRule(
                id="slow_response_time",
                name="Slow Response Time",
                description="Average response time is above 2 seconds",
                category=AlertCategory.PERFORMANCE,
                severity=AlertSeverity.MEDIUM,
                condition="avg_response_time_ms",
                threshold=2000,
                comparison="gt",
                window_minutes=15,
                cooldown_minutes=30,
                enabled=True,
                tags=["api", "performance"],
                notification_channels=["slack"],
                metadata={}
            ),
            AlertRule(
                id="failed_sync_jobs",
                name="Failed Sync Jobs",
                description="Number of failed sync jobs is above 5",
                category=AlertCategory.BUSINESS,
                severity=AlertSeverity.HIGH,
                condition="failed_sync_jobs",
                threshold=5,
                comparison="gt",
                window_minutes=30,
                cooldown_minutes=60,
                enabled=True,
                tags=["sync", "business"],
                notification_channels=["email", "slack"],
                metadata={}
            )
        ]
        
        for rule in rules:
            self.add_alert_rule(rule)

# Global alert manager instance
alert_manager = AlertManager()

# Convenience functions
async def create_alert(
    title: str,
    description: str,
    severity: AlertSeverity,
    category: AlertCategory,
    source: str = "manual",
    **kwargs
) -> Alert:
    """Create an alert"""
    return await alert_manager.create_alert(
        title, description, severity, category, source, **kwargs
    )

async def create_system_alert(title: str, description: str, severity: AlertSeverity = AlertSeverity.MEDIUM, **kwargs):
    """Create a system alert"""
    return await create_alert(title, description, severity, AlertCategory.SYSTEM, "system", **kwargs)

async def create_security_alert(title: str, description: str, severity: AlertSeverity = AlertSeverity.HIGH, **kwargs):
    """Create a security alert"""
    return await create_alert(title, description, severity, AlertCategory.SECURITY, "security", **kwargs)

async def create_performance_alert(title: str, description: str, severity: AlertSeverity = AlertSeverity.MEDIUM, **kwargs):
    """Create a performance alert"""
    return await create_alert(title, description, severity, AlertCategory.PERFORMANCE, "performance", **kwargs)

async def create_business_alert(title: str, description: str, severity: AlertSeverity = AlertSeverity.MEDIUM, **kwargs):
    """Create a business alert"""
    return await create_alert(title, description, severity, AlertCategory.BUSINESS, "business", **kwargs)