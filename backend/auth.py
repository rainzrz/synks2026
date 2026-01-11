"""
Authentication and authorization functionality
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
import httpx
from bs4 import BeautifulSoup
from config import security, MINT_URL
from database import verify_token


async def authenticate_with_mint(username: str, password: str, mint_url: str = MINT_URL) -> Optional[str]:
    """
    Attempt to authenticate with Mint GitLab using LDAP
    Returns session cookies if successful
    """
    try:
        # Use a session that persists cookies across requests
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            # Step 1: Get the login page to extract CSRF token
            login_url = f"{mint_url}/users/sign_in"

            response = await client.get(login_url)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Find CSRF token (authenticity_token)
            csrf_input = soup.find('input', {'name': 'authenticity_token'})
            if not csrf_input:
                return None

            csrf_token = csrf_input.get('value')

            # Get initial cookies
            initial_cookies = dict(response.cookies)

            # Step 2: Try LDAP login first
            ldap_login_url = f"{mint_url}/users/auth/ldapmain/callback"

            login_data_ldap = {
                'username': username,
                'password': password,
                'authenticity_token': csrf_token,
                'remember_me': '0'
            }

            auth_response = await client.post(
                ldap_login_url,
                data=login_data_ldap,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': login_url
                },
                cookies=initial_cookies
            )

            # Check if LDAP login failed (redirected back to sign_in)
            ldap_failed = '/users/sign_in' in str(auth_response.url)

            if ldap_failed:
                # Try Standard login
                standard_login_url = f"{mint_url}/users/sign_in"

                login_data_standard = {
                    'user[login]': username,
                    'user[password]': password,
                    'authenticity_token': csrf_token,
                    'user[remember_me]': '0'
                }

                auth_response = await client.post(
                    standard_login_url,
                    data=login_data_standard,
                    headers={
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Referer': login_url
                    },
                    cookies=initial_cookies
                )

                # Check if Standard login also failed
                if '/users/sign_in' in str(auth_response.url):
                    return None

            # Collect all cookies from the entire redirect chain
            all_cookies = dict(client.cookies)

            # Try to access a protected page to verify
            test_url = f"{mint_url}/dashboard/projects"
            test_response = await client.get(test_url)

            # Get cookies after test request
            all_cookies = dict(client.cookies)

            # If we're not redirected to login, auth was successful
            if '/users/sign_in' not in str(test_response.url):
                cookie_str = '; '.join([f"{k}={v}" for k, v in all_cookies.items()])
                return cookie_str if cookie_str else "authenticated"

            return None

    except Exception as e:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency for protected routes - validates token and returns user data"""
    token = credentials.credentials
    user = verify_token(token)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

    return user


def require_admin(current_user: dict):
    """Check if user is admin"""
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
