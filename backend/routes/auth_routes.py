"""
Authentication routes - login, register, logout
"""
from fastapi import APIRouter, HTTPException, Depends, status
from models import RegisterRequest, LoginRequest, LoginResponse
from database import create_user, create_session, get_user_by_username, delete_session
from auth import authenticate_with_mint, get_current_user
from config import MINT_URL

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """
    Register a new user
    """
    # Validate wiki_url format
    if not request.wiki_url.startswith("http"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid wiki URL format"
        )

    # Create user
    success = create_user(
        request.username,
        request.password,
        request.wiki_url,
        request.is_admin
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )

    # Create session
    token = create_session(request.username)

    return LoginResponse(
        token=token,
        username=request.username,
        wiki_url=request.wiki_url,
        is_admin=request.is_admin,
        message="Registration successful"
    )


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with GitLab credentials
    """
    # Authenticate with GitLab first
    mint_session = await authenticate_with_mint(
        request.username,
        request.password,
        MINT_URL
    )

    if not mint_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitLab credentials"
        )

    # Check if user exists in database
    user_data = get_user_by_username(request.username)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please register first."
        )

    # Create session with GitLab session
    token = create_session(request.username, mint_session)

    return LoginResponse(
        token=token,
        username=user_data[0],
        wiki_url=user_data[1],
        is_admin=bool(user_data[2]),
        message="Login successful"
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout and invalidate session
    """
    # Delete session from database
    delete_session(current_user['username'])

    return {"message": "Logout successful"}
