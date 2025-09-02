"""
WebSocket configuration and connection management for ML-Bling Sync API
"""

from fastapi import WebSocket, WebSocketDisconnect, HTTPException, status
from typing import Dict, List, Set, Optional, Any
import json
import logging
import asyncio
from datetime import datetime
import uuid
from enum import Enum

from app.core.config import settings
from app.core.security import verify_token

# Configure logging
logger = logging.getLogger(__name__)

class ConnectionType(str, Enum):
    """WebSocket connection types"""
    DASHBOARD = "dashboard"
    PRODUCTS = "products"
    ORDERS = "orders"
    INVENTORY = "inventory"
    NOTIFICATIONS = "notifications"

class WebSocketMessage:
    """WebSocket message structure"""
    
    def __init__(self, event: str, data: Any, user_id: Optional[str] = None):
        self.event = event
        self.data = data
        self.user_id = user_id
        self.timestamp = datetime.utcnow()
        self.message_id = str(uuid.uuid4())
    
    def to_dict(self) -> dict:
        """Convert message to dictionary"""
        return {
            "event": self.event,
            "data": self.data,
            "user_id": self.user_id,
            "timestamp": self.timestamp.isoformat(),
            "message_id": self.message_id
        }
    
    def to_json(self) -> str:
        """Convert message to JSON string"""
        return json.dumps(self.to_dict())

class ConnectionManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_types: Dict[str, ConnectionType] = {}
        self.user_connections: Dict[str, Set[str]] = {}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, 
                     connection_type: ConnectionType, user_id: Optional[str] = None):
        """Accept WebSocket connection"""
        try:
            await websocket.accept()
            
            # Store connection
            self.active_connections[connection_id] = websocket
            self.connection_types[connection_id] = connection_type
            
            # Store user connection mapping
            if user_id:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = set()
                self.user_connections[user_id].add(connection_id)
            
            # Store metadata
            self.connection_metadata[connection_id] = {
                "type": connection_type,
                "user_id": user_id,
                "connected_at": datetime.utcnow(),
                "last_activity": datetime.utcnow()
            }
            
            logger.info(f"✅ WebSocket connected: {connection_id} ({connection_type.value})")
            
            # Send welcome message
            welcome_msg = WebSocketMessage(
                event="connection.established",
                data={
                    "connection_id": connection_id,
                    "type": connection_type.value,
                    "timestamp": datetime.utcnow().isoformat()
                },
                user_id=user_id
            )
            await self.send_personal_message(connection_id, welcome_msg)
            
        except Exception as e:
            logger.error(f"❌ WebSocket connection failed: {e}")
            raise
    
    def disconnect(self, connection_id: str):
        """Remove WebSocket connection"""
        try:
            # Remove from active connections
            if connection_id in self.active_connections:
                del self.active_connections[connection_id]
            
            # Remove from connection types
            if connection_id in self.connection_types:
                connection_type = self.connection_types[connection_id]
                del self.connection_types[connection_id]
            
            # Remove from user connections
            if connection_id in self.connection_metadata:
                user_id = self.connection_metadata[connection_id].get("user_id")
                if user_id and user_id in self.user_connections:
                    self.user_connections[user_id].discard(connection_id)
                    if not self.user_connections[user_id]:
                        del self.user_connections[user_id]
                
                del self.connection_metadata[connection_id]
            
            logger.info(f"🔌 WebSocket disconnected: {connection_id}")
            
        except Exception as e:
            logger.error(f"❌ Error disconnecting WebSocket: {e}")
    
    async def send_personal_message(self, connection_id: str, message: WebSocketMessage):
        """Send message to specific connection"""
        try:
            if connection_id in self.active_connections:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(message.to_json())
                
                # Update last activity
                if connection_id in self.connection_metadata:
                    self.connection_metadata[connection_id]["last_activity"] = datetime.utcnow()
                
                logger.debug(f"📤 Sent message to {connection_id}: {message.event}")
            else:
                logger.warning(f"⚠️ Connection {connection_id} not found for personal message")
                
        except Exception as e:
            logger.error(f"❌ Failed to send personal message to {connection_id}: {e}")
            # Remove broken connection
            self.disconnect(connection_id)
    
    async def broadcast_to_type(self, connection_type: ConnectionType, message: WebSocketMessage):
        """Broadcast message to all connections of specific type"""
        try:
            connections_to_remove = []
            
            for connection_id, conn_type in self.connection_types.items():
                if conn_type == connection_type:
                    try:
                        await self.send_personal_message(connection_id, message)
                    except Exception as e:
                        logger.error(f"❌ Failed to broadcast to {connection_id}: {e}")
                        connections_to_remove.append(connection_id)
            
            # Remove broken connections
            for connection_id in connections_to_remove:
                self.disconnect(connection_id)
            
            logger.info(f"📢 Broadcasted {message.event} to {connection_type.value} connections")
            
        except Exception as e:
            logger.error(f"❌ Broadcast failed: {e}")
    
    async def broadcast_to_user(self, user_id: str, message: WebSocketMessage):
        """Broadcast message to all connections of specific user"""
        try:
            if user_id in self.user_connections:
                connections_to_remove = []
                
                for connection_id in self.user_connections[user_id]:
                    try:
                        await self.send_personal_message(connection_id, message)
                    except Exception as e:
                        logger.error(f"❌ Failed to broadcast to user {user_id}: {e}")
                        connections_to_remove.append(connection_id)
                
                # Remove broken connections
                for connection_id in connections_to_remove:
                    self.disconnect(connection_id)
                
                logger.info(f"📢 Broadcasted {message.event} to user {user_id}")
            else:
                logger.debug(f"User {user_id} has no active connections")
                
        except Exception as e:
            logger.error(f"❌ User broadcast failed: {e}")
    
    async def broadcast_to_all(self, message: WebSocketMessage):
        """Broadcast message to all active connections"""
        try:
            connections_to_remove = []
            
            for connection_id in list(self.active_connections.keys()):
                try:
                    await self.send_personal_message(connection_id, message)
                except Exception as e:
                    logger.error(f"❌ Failed to broadcast to {connection_id}: {e}")
                    connections_to_remove.append(connection_id)
            
            # Remove broken connections
            for connection_id in connections_to_remove:
                self.disconnect(connection_id)
            
            logger.info(f"📢 Broadcasted {message.event} to all connections")
            
        except Exception as e:
            logger.error(f"❌ Global broadcast failed: {e}")
    
    def get_connection_info(self) -> dict:
        """Get information about active connections"""
        return {
            "total_connections": len(self.active_connections),
            "connections_by_type": {
                conn_type.value: sum(1 for t in self.connection_types.values() if t == conn_type)
                for conn_type in ConnectionType
            },
            "users_connected": len(self.user_connections),
            "connection_metadata": self.connection_metadata
        }
    
    async def heartbeat(self):
        """Send heartbeat to all connections"""
        try:
            heartbeat_msg = WebSocketMessage(
                event="heartbeat",
                data={"timestamp": datetime.utcnow().isoformat()}
            )
            
            await self.broadcast_to_all(heartbeat_msg)
            logger.debug("💓 Heartbeat sent to all connections")
            
        except Exception as e:
            logger.error(f"❌ Heartbeat failed: {e}")
    
    async def cleanup_inactive_connections(self):
        """Clean up inactive connections"""
        try:
            now = datetime.utcnow()
            connections_to_remove = []
            
            for connection_id, metadata in self.connection_metadata.items():
                last_activity = metadata.get("last_activity")
                if last_activity:
                    inactivity_duration = (now - last_activity).total_seconds()
                    if inactivity_duration > settings.WS_HEARTBEAT_INTERVAL * 3:  # 3x heartbeat interval
                        connections_to_remove.append(connection_id)
            
            for connection_id in connections_to_remove:
                logger.info(f"🧹 Cleaning up inactive connection: {connection_id}")
                self.disconnect(connection_id)
            
            if connections_to_remove:
                logger.info(f"🧹 Cleaned up {len(connections_to_remove)} inactive connections")
                
        except Exception as e:
            logger.error(f"❌ Connection cleanup failed: {e}")

# Global connection manager instance
manager = ConnectionManager()

# WebSocket endpoint
async def websocket_endpoint(
    websocket: WebSocket,
    connection_type: ConnectionType,
    token: Optional[str] = None
):
    """WebSocket endpoint for real-time communication"""
    connection_id = str(uuid.uuid4())
    user_id = None
    
    try:
        # Authenticate user if token provided
        if token:
            try:
                payload = verify_token(token)
                user_id = payload.get("sub")
                if not user_id:
                    raise HTTPException(status_code=401, detail="Invalid token")
            except Exception as e:
                logger.warning(f"WebSocket authentication failed: {e}")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        
        # Connect to manager
        await manager.connect(websocket, connection_id, connection_type, user_id)
        
        # Main message loop
        while True:
            try:
                # Receive message
                data = await websocket.receive_text()
                
                # Parse message
                try:
                    message_data = json.loads(data)
                    event = message_data.get("event", "unknown")
                    
                    # Handle different event types
                    if event == "ping":
                        # Respond to ping
                        pong_msg = WebSocketMessage("pong", {"timestamp": datetime.utcnow().isoformat()})
                        await manager.send_personal_message(connection_id, pong_msg)
                    
                    elif event == "subscribe":
                        # Handle subscription to specific channels
                        channels = message_data.get("channels", [])
                        if channels:
                            # Update connection metadata with subscribed channels
                            if connection_id in manager.connection_metadata:
                                manager.connection_metadata[connection_id]["subscribed_channels"] = channels
                            
                            # Send confirmation
                            confirm_msg = WebSocketMessage(
                                "subscribed",
                                {"channels": channels, "timestamp": datetime.utcnow().isoformat()}
                            )
                            await manager.send_personal_message(connection_id, confirm_msg)
                    
                    elif event == "unsubscribe":
                        # Handle unsubscription
                        channels = message_data.get("channels", [])
                        if connection_id in manager.connection_metadata:
                            current_channels = manager.connection_metadata[connection_id].get("subscribed_channels", [])
                            updated_channels = [c for c in current_channels if c not in channels]
                            manager.connection_metadata[connection_id]["subscribed_channels"] = updated_channels
                        
                        # Send confirmation
                        confirm_msg = WebSocketMessage(
                            "unsubscribed",
                            {"channels": channels, "timestamp": datetime.utcnow().isoformat()}
                        )
                        await manager.send_personal_message(connection_id, confirm_msg)
                    
                    else:
                        # Echo unknown events back
                        echo_msg = WebSocketMessage("echo", message_data)
                        await manager.send_personal_message(connection_id, echo_msg)
                    
                    # Update last activity
                    if connection_id in manager.connection_metadata:
                        manager.connection_metadata[connection_id]["last_activity"] = datetime.utcnow()
                    
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from {connection_id}")
                    error_msg = WebSocketMessage("error", {"message": "Invalid JSON format"})
                    await manager.send_personal_message(connection_id, error_msg)
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected: {connection_id}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket error for {connection_id}: {e}")
    finally:
        # Clean up connection
        manager.disconnect(connection_id)

# Event broadcasting functions
async def broadcast_product_update(product_id: str, product_data: dict, user_id: Optional[str] = None):
    """Broadcast product update event"""
    message = WebSocketMessage(
        event="product.updated",
        data={
            "product_id": product_id,
            "product": product_data,
            "timestamp": datetime.utcnow().isoformat()
        },
        user_id=user_id
    )
    
    await manager.broadcast_to_type(ConnectionType.PRODUCTS, message)
    if user_id:
        await manager.broadcast_to_user(user_id, message)

async def broadcast_order_update(order_id: str, order_data: dict, user_id: Optional[str] = None):
    """Broadcast order update event"""
    message = WebSocketMessage(
        event="order.updated",
        data={
            "order_id": order_id,
            "order": order_data,
            "timestamp": datetime.utcnow().isoformat()
        },
        user_id=user_id
    )
    
    await manager.broadcast_to_type(ConnectionType.ORDERS, message)
    if user_id:
        await manager.broadcast_to_user(user_id, message)

async def broadcast_inventory_update(product_id: str, inventory_data: dict, user_id: Optional[str] = None):
    """Broadcast inventory update event"""
    message = WebSocketMessage(
        event="inventory.updated",
        data={
            "product_id": product_id,
            "inventory": inventory_data,
            "timestamp": datetime.utcnow().isoformat()
        },
        user_id=user_id
    )
    
    await manager.broadcast_to_type(ConnectionType.INVENTORY, message)
    if user_id:
        await manager.broadcast_to_user(user_id, message)

async def broadcast_notification(notification_data: dict, user_id: Optional[str] = None):
    """Broadcast notification event"""
    message = WebSocketMessage(
        event="notification.new",
        data={
            "notification": notification_data,
            "timestamp": datetime.utcnow().isoformat()
        },
        user_id=user_id
    )
    
    await manager.broadcast_to_type(ConnectionType.NOTIFICATIONS, message)
    if user_id:
        await manager.broadcast_to_user(user_id, message)

async def broadcast_dashboard_update(dashboard_data: dict, user_id: Optional[str] = None):
    """Broadcast dashboard update event"""
    message = WebSocketMessage(
        event="dashboard.updated",
        data={
            "dashboard": dashboard_data,
            "timestamp": datetime.utcnow().isoformat()
        },
        user_id=user_id
    )
    
    await manager.broadcast_to_type(ConnectionType.DASHBOARD, message)
    if user_id:
        await manager.broadcast_to_user(user_id, message)

# Background tasks
async def websocket_maintenance():
    """Background task for WebSocket maintenance"""
    while True:
        try:
            # Send heartbeat
            await manager.heartbeat()
            
            # Clean up inactive connections
            await manager.cleanup_inactive_connections()
            
            # Wait before next maintenance cycle
            await asyncio.sleep(settings.WS_HEARTBEAT_INTERVAL)
            
        except Exception as e:
            logger.error(f"WebSocket maintenance error: {e}")
            await asyncio.sleep(60)  # Wait 1 minute on error

async def init_websockets():
    """Initialize WebSocket system"""
    try:
        # Start maintenance task
        asyncio.create_task(websocket_maintenance())
        logger.info("✅ WebSocket system initialized successfully")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize WebSocket system: {e}")
        raise
