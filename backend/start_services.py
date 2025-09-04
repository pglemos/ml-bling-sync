#!/usr/bin/env python3
"""
Start All Services

Script to start all backend services for development.
"""

import os
import sys
import subprocess
import signal
import time
from pathlib import Path
from typing import List, Dict
import threading

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

class ServiceManager:
    """Manage multiple services"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.running = True
        
    def start_service(self, name: str, command: List[str], cwd: str = None) -> bool:
        """Start a service"""
        try:
            print(f"🚀 Starting {name}...")
            
            process = subprocess.Popen(
                command,
                cwd=cwd or str(backend_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.processes[name] = process
            
            # Start output monitoring thread
            threading.Thread(
                target=self._monitor_output,
                args=(name, process),
                daemon=True
            ).start()
            
            print(f"✅ {name} started (PID: {process.pid})")
            return True
            
        except Exception as e:
            print(f"❌ Failed to start {name}: {e}")
            return False
    
    def _monitor_output(self, name: str, process: subprocess.Popen):
        """Monitor service output"""
        try:
            for line in iter(process.stdout.readline, ''):
                if line and self.running:
                    print(f"[{name}] {line.rstrip()}")
        except Exception:
            pass
    
    def stop_all(self):
        """Stop all services"""
        print("\n🛑 Stopping all services...")
        self.running = False
        
        for name, process in self.processes.items():
            try:
                print(f"Stopping {name}...")
                process.terminate()
                
                # Wait for graceful shutdown
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    print(f"Force killing {name}...")
                    process.kill()
                    process.wait()
                    
                print(f"✅ {name} stopped")
                
            except Exception as e:
                print(f"❌ Error stopping {name}: {e}")
        
        print("✅ All services stopped")
    
    def wait_for_services(self):
        """Wait for all services to complete"""
        try:
            while self.running and any(p.poll() is None for p in self.processes.values()):
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        finally:
            self.stop_all()

def check_dependencies():
    """Check if required dependencies are available"""
    print("🔍 Checking dependencies...")
    
    # Check Redis
    try:
        import redis
        r = redis.Redis(host='localhost', port=6379, db=0)
        r.ping()
        print("✅ Redis is running")
    except Exception as e:
        print(f"❌ Redis not available: {e}")
        print("Please start Redis server first")
        return False
    
    # Check PostgreSQL (optional check)
    try:
        from app.core.config import settings
        import psycopg2
        conn = psycopg2.connect(settings.DATABASE_URL)
        conn.close()
        print("✅ PostgreSQL is accessible")
    except Exception as e:
        print(f"⚠️  PostgreSQL check failed: {e}")
        print("Make sure your database is running and configured")
    
    return True

def main():
    """Main function"""
    print("🎯 ML-Bling Sync - Service Manager")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Create service manager
    manager = ServiceManager()
    
    # Setup signal handlers
    def signal_handler(signum, frame):
        print("\n⚡ Received interrupt signal")
        manager.stop_all()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start services
    services = [
        {
            "name": "FastAPI Server",
            "command": ["python", "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]
        },
        {
            "name": "Celery Worker",
            "command": ["python", "worker.py"]
        },
        {
            "name": "Celery Beat",
            "command": ["python", "beat.py"]
        },
        {
            "name": "Flower Monitor",
            "command": ["python", "flower.py"]
        }
    ]
    
    # Start all services
    success_count = 0
    for service in services:
        if manager.start_service(service["name"], service["command"]):
            success_count += 1
            time.sleep(2)  # Wait between service starts
    
    if success_count == 0:
        print("❌ No services started successfully")
        sys.exit(1)
    
    print(f"\n🎉 Started {success_count}/{len(services)} services successfully!")
    print("\n📊 Service URLs:")
    print("  • FastAPI Docs: http://localhost:8000/docs")
    print("  • FastAPI Health: http://localhost:8000/health")
    print("  • Flower Monitor: http://localhost:5555")
    print("\n💡 Press Ctrl+C to stop all services")
    print("=" * 40)
    
    # Wait for services
    manager.wait_for_services()

if __name__ == "__main__":
    main()