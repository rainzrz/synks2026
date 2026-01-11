"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel
from typing import List, Optional


class RegisterRequest(BaseModel):
    username: str
    password: str
    wiki_url: str
    is_admin: bool = False


class LoginRequest(BaseModel):
    username: str  # GitLab username
    password: str  # GitLab password


class LoginResponse(BaseModel):
    token: str
    username: str
    wiki_url: str
    is_admin: bool
    message: str


class LinkItem(BaseModel):
    text: str  # Changed from 'name' to 'text' for frontend compatibility
    url: str


class ProductGroup(BaseModel):
    country: str
    product: str
    environment: str
    links: List[LinkItem]


class DashboardResponse(BaseModel):
    groups: List[ProductGroup]
    last_updated: str


class UserInfo(BaseModel):
    username: str
    wiki_url: str
    is_admin: bool
    created_at: str


class UsersListResponse(BaseModel):
    users: List[UserInfo]


class UpdateUserRequest(BaseModel):
    username: str
    new_password: Optional[str] = None
    wiki_url: Optional[str] = None
    is_admin: Optional[bool] = None
