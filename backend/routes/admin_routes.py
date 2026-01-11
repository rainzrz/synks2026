"""
Admin routes - user management
"""
from fastapi import APIRouter, HTTPException, Depends
from models import UsersListResponse, UpdateUserRequest
from auth import get_current_user, require_admin
from database import get_all_users, update_user, delete_user

router = APIRouter(prefix="/api", tags=["admin"])


@router.get("/users", response_model=UsersListResponse)
async def list_users(current_user: dict = Depends(get_current_user)):
    """
    List all users (admin only)
    """
    require_admin(current_user)
    users = get_all_users()
    return UsersListResponse(users=users)


@router.put("/users/{username}")
async def update_user_endpoint(
    username: str,
    request: UpdateUserRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user information (admin only)
    """
    require_admin(current_user)

    success = update_user(
        username=username,
        new_password=request.new_password,
        wiki_url=request.wiki_url,
        is_admin=request.is_admin
    )

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Failed to update user"
        )

    return {"message": "User updated successfully"}


@router.delete("/users/{username}")
async def delete_user_endpoint(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete user (admin only)
    """
    require_admin(current_user)

    # Prevent admin from deleting themselves
    if username == current_user.get('username'):
        raise HTTPException(
            status_code=400,
            detail="Cannot delete your own account"
        )

    success = delete_user(username)

    if not success:
        raise HTTPException(
            status_code=400,
            detail="Failed to delete user"
        )

    return {"message": "User deleted successfully"}
