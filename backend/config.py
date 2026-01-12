"""
Application configuration and initialization
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

# Initialize FastAPI app
app = FastAPI(title="Customer Portal API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://127.0.0.1:80"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Constants
MINT_URL = "http://mint.systemhaus.com.br:9070"
DB_NAME = 'portal.db'
SESSION_EXPIRY_HOURS = 8
CACHE_EXPIRY_MINUTES = 15
