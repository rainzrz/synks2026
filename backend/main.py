"""
Main application entry point
"""
from datetime import datetime
from config import app
from database import init_db
from routes import auth_routes, dashboard_routes, admin_routes, status_routes

# Initialize database
init_db()

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
