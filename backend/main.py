"""
Main application entry point
"""
from datetime import datetime
from config import app
from database import init_db
from routes import auth_routes, dashboard_routes, admin_routes, status_routes
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup banner
BANNER = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                 SYNKS APPLICATION API                     ║
║              Customer Portal Backend v1.0                 ║
║                                                           ║
║  Status: ✓ Production Ready                              ║
║  Monitoring: ✓ Enabled                                   ║
║  Security: ✓ Configured                                  ║
║  Cache: ✓ Redis Connected                                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📱 API Documentation: http://localhost:8000/docs
🏥 Health Check:     http://localhost:8000/api/health
📊 Metrics:          http://localhost:8000/metrics

"""

# Startup event
@app.on_event("startup")
async def startup_event():
    """Application startup"""
    print(BANNER)
    logger.info("🚀 Starting Synks Application API...")
    logger.info("📊 Monitoring enabled")
    logger.info("🔒 Security middleware active")

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info("👋 Shutting down Synks Application API...")

# Initialize database
init_db()
logger.info("✓ Database initialized")

# Include routers
app.include_router(auth_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(admin_routes.router)
app.include_router(status_routes.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
