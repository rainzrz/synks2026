from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import httpx
import re
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
import asyncio

app = FastAPI(title="Customer Portal API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Database initialization
def init_db():
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()

    # Users table with wiki_url
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            username TEXT PRIMARY KEY,
            password_hash TEXT NOT NULL,
            wiki_url TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at TIMESTAMP
        )
    ''')

    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            mint_session TEXT,
            created_at TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (username) REFERENCES users (username)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS cache (
            url TEXT PRIMARY KEY,
            content TEXT,
            cached_at TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Models
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

# Helper functions
def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_user(username: str, password: str, wiki_url: str, is_admin: bool = False) -> bool:
    """Create a new user"""
    try:
        conn = sqlite3.connect('portal.db')
        c = conn.cursor()

        password_hash = hash_password(password)
        now = datetime.now()

        c.execute('''
            INSERT INTO users (username, password_hash, wiki_url, is_admin, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, password_hash, wiki_url, is_admin, now))

        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False

def verify_user(username: str, password: str) -> Optional[dict]:
    """Verify user credentials and return user data"""
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()

    c.execute('''
        SELECT username, wiki_url, is_admin
        FROM users
        WHERE username = ? AND password_hash = ?
    ''', (username, hash_password(password)))

    result = c.fetchone()
    conn.close()

    if not result:
        return None

    return {
        "username": result[0],
        "wiki_url": result[1],
        "is_admin": bool(result[2])
    }

def get_user_wiki_url(username: str) -> Optional[str]:
    """Get user's wiki URL"""
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()

    c.execute('SELECT wiki_url FROM users WHERE username = ?', (username,))
    result = c.fetchone()
    conn.close()

    return result[0] if result else None

def create_session(username: str, mint_session: str = None) -> str:
    token = secrets.token_urlsafe(32)
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()

    now = datetime.now()
    expires = now + timedelta(hours=8)

    c.execute('''
        INSERT INTO sessions (token, username, mint_session, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (token, username, mint_session, now, expires))

    conn.commit()
    conn.close()
    return token

def verify_token(token: str) -> Optional[dict]:
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()

    c.execute('''
        SELECT s.username, s.mint_session, s.expires_at, u.wiki_url, u.is_admin
        FROM sessions s
        JOIN users u ON s.username = u.username
        WHERE s.token = ?
    ''', (token,))

    result = c.fetchone()
    conn.close()

    if not result:
        return None

    username, mint_session, expires_at, wiki_url, is_admin = result
    expires = datetime.fromisoformat(expires_at)

    if datetime.now() > expires:
        return None

    return {
        "username": username,
        "mint_session": mint_session,
        "wiki_url": wiki_url,
        "is_admin": bool(is_admin)
    }

async def authenticate_with_mint(username: str, password: str, mint_url: str) -> Optional[str]:
    """
    Attempt to authenticate with Mint GitLab using LDAP
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

def get_all_users() -> List[dict]:
    """Get all users from database"""
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    c.execute('''
        SELECT username, wiki_url, is_admin, created_at
        FROM users
        ORDER BY username
    ''')
    results = c.fetchall()
    conn.close()

    users = []
    for row in results:
        users.append({
            "username": row[0],
            "wiki_url": row[1],
            "is_admin": bool(row[2]),
            "created_at": row[3]
        })
    return users

def update_user(username: str, new_password: Optional[str] = None,
                wiki_url: Optional[str] = None, is_admin: Optional[bool] = None) -> bool:
    """Update user information"""
    try:
        conn = sqlite3.connect('portal.db')
        c = conn.cursor()

        # Build update query dynamically
        updates = []
        params = []

        if new_password is not None:
            updates.append("password_hash = ?")
            params.append(hash_password(new_password))

        if wiki_url is not None:
            updates.append("wiki_url = ?")
            params.append(wiki_url)

        if is_admin is not None:
            updates.append("is_admin = ?")
            params.append(is_admin)

        if not updates:
            return False

        params.append(username)
        query = f"UPDATE users SET {', '.join(updates)} WHERE username = ?"

        c.execute(query, params)
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        return False

def delete_user(username: str) -> bool:
    """Delete user from database"""
    try:
        conn = sqlite3.connect('portal.db')
        c = conn.cursor()

        # Delete user's sessions first
        c.execute('DELETE FROM sessions WHERE username = ?', (username,))

        # Delete user
        c.execute('DELETE FROM users WHERE username = ?', (username,))

        conn.commit()
        conn.close()
        return True
    except Exception as e:
        return False

def parse_markdown_links(content: str) -> List[ProductGroup]:
    """
    Parse markdown content to extract product links
    Hierarchy: # = Product, ## = Environment
    """
    groups = []
    lines = content.split('\n')

    current_product = None
    current_env = None
    current_links = []


    for i, line in enumerate(lines):
        original_line = line
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Debug first 30 non-empty lines
        if i < 30:

        # Detect product header (# Title)
        if original_line.startswith('# '):
            # Save previous group if exists
            if current_product and current_env and current_links:
                groups.append(ProductGroup(
                    country="",
                    product=current_product,
                    environment=current_env,
                    links=current_links
                ))
                current_links = []
                current_env = None

            # Parse new product header
            current_product = line[2:].strip()  # Remove "# " prefix

        # Detect environment/version header (## Title)
        elif original_line.startswith('## '):
            # Save previous environment group if exists
            if current_product and current_env and current_links:
                groups.append(ProductGroup(
                    country="",
                    product=current_product,
                    environment=current_env,
                    links=current_links
                ))
                current_links = []

            # Set new environment
            current_env = line[3:].strip()  # Remove "## " prefix

        # Detect markdown links in bullet points
        elif (line.startswith('*') or line.startswith('-')) and '[' in line and '](' in line:
            link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
            matches = re.findall(link_pattern, line)

            for text, url in matches:
                link = LinkItem(text=text.strip(), url=url.strip())
                current_links.append(link)

    # Add last group
    if current_product and current_env and current_links:
        groups.append(ProductGroup(
            country="",
            product=current_product,
            environment=current_env,
            links=current_links
        ))

    return groups

async def fetch_wiki_content(wiki_url: str, session_cookie: str = None) -> str:
    """
    Fetch wiki page content with authentication
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        cookies_dict = {}
        if session_cookie:
            # Parse cookie string into dict
            if ';' in session_cookie:
                for cookie in session_cookie.split(';'):
                    cookie = cookie.strip()
                    if '=' in cookie:
                        key, value = cookie.split('=', 1)
                        cookies_dict[key.strip()] = value.strip()
            else:
                cookies_dict['_gitlab_session'] = session_cookie
        
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(
                wiki_url, 
                cookies=cookies_dict, 
                headers=headers
            )
            
            
            if response.status_code == 200:
                # Check if we got redirected to login page
                if 'sign_in' in str(response.url) or 'You need to sign in' in response.text:
                    raise HTTPException(
                        status_code=401, 
                        detail="Session expired. Please login again."
                    )
                
                return response.text
            else:
                raise HTTPException(
                    status_code=response.status_code, 
                    detail=f"Failed to fetch wiki: HTTP {response.status_code}"
                )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wiki: {str(e)}")

def get_cached_content(url: str, max_age_minutes: int = 15) -> Optional[str]:
    """
    Get cached content if not expired
    """
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    
    c.execute('SELECT content, cached_at FROM cache WHERE url = ?', (url,))
    result = c.fetchone()
    conn.close()
    
    if not result:
        return None
    
    content, cached_at = result
    cached_time = datetime.fromisoformat(cached_at)
    
    if datetime.now() - cached_time > timedelta(minutes=max_age_minutes):
        return None
    
    return content

def cache_content(url: str, content: str):
    """
    Cache wiki content
    """
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    
    c.execute('''
        INSERT OR REPLACE INTO cache (url, content, cached_at)
        VALUES (?, ?, ?)
    ''', (url, content, datetime.now()))
    
    conn.commit()
    conn.close()

# Dependency for protected routes
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = verify_token(token)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    return user

# Routes
@app.post("/api/register", response_model=LoginResponse)
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

@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with GitLab credentials
    """
    # Authenticate with GitLab first
    mint_session = await authenticate_with_mint(
        request.username,
        request.password,
        "http://mint.systemhaus.com.br:9070"
    )

    if not mint_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid GitLab credentials"
        )


    # Check if user exists in database
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    c.execute('SELECT username, wiki_url, is_admin FROM users WHERE username = ?', (request.username,))
    user_data = c.fetchone()
    conn.close()

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

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: dict = Depends(get_current_user)
):
    """
    Get parsed dashboard with product links using user's wiki URL
    """
    try:
        # Use the user's wiki_url from their profile
        wiki_url = current_user.get('wiki_url')

        if not wiki_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User does not have a wiki URL configured"
            )


        # Extract project ID and wiki page name from URL
        # URL format: http://mint.systemhaus.com.br:9070/document-group/customer_-a.buhler/-/wikis/Customer_Links
        parts = wiki_url.split('/')
        if len(parts) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid wiki URL format: {wiki_url}"
            )

        project_path = '/'.join(parts[3:5])  # document-group/customer_-a.buhler
        wiki_page = parts[-1]  # Customer_Links

        # Build GitLab API URL
        # First, URL encode the project path
        import urllib.parse
        project_path_encoded = urllib.parse.quote(project_path, safe='')

        base_url = f"{parts[0]}//{parts[2]}"  # http://mint.systemhaus.com.br:9070
        api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"


        # Check cache first
        cached = get_cached_content(api_url)

        if cached:
            content = cached
        else:
            # Fetch from API
            content = await fetch_wiki_content(api_url, current_user.get('mint_session'))
            cache_content(api_url, content)

        # Parse JSON response from GitLab API
        import json
        try:
            wiki_data = json.loads(content)
            markdown_text = wiki_data.get('content', '')
        except json.JSONDecodeError as e:
            markdown_text = content

        # Parse links
        groups = parse_markdown_links(markdown_text)
        for i, group in enumerate(groups, 1):

        return DashboardResponse(
            groups=groups,
            last_updated=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.post("/api/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout and invalidate session
    """
    # Delete session from database
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE username = ?', (current_user['username'],))
    conn.commit()
    conn.close()
    
    return {"message": "Logout successful"}

@app.post("/api/clear-cache")
async def clear_cache(current_user: dict = Depends(get_current_user)):
    """
    Clear the wiki content cache
    """
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    c.execute('DELETE FROM cache')
    conn.commit()
    conn.close()

    return {"message": "Cache cleared successfully"}

@app.get("/api/users", response_model=UsersListResponse)
async def list_users(current_user: dict = Depends(get_current_user)):
    """
    List all users (admin only)
    """
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can list users"
        )

    users = get_all_users()
    return UsersListResponse(users=users)

@app.put("/api/users/{username}")
async def update_user_endpoint(
    username: str,
    request: UpdateUserRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user information (admin only)
    """
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update users"
        )

    success = update_user(
        username=username,
        new_password=request.new_password,
        wiki_url=request.wiki_url,
        is_admin=request.is_admin
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user"
        )

    return {"message": "User updated successfully"}

@app.delete("/api/users/{username}")
async def delete_user_endpoint(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete user (admin only)
    """
    if not current_user.get('is_admin'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete users"
        )

    # Prevent admin from deleting themselves
    if username == current_user.get('username'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    success = delete_user(username)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to delete user"
        )

    return {"message": "User deleted successfully"}

@app.get("/api/dashboard/{username}", response_model=DashboardResponse)
async def get_user_dashboard(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get dashboard for a specific user (admin only or own dashboard)
    """
    # Allow users to view their own dashboard or admin to view any
    if not current_user.get('is_admin') and username != current_user.get('username'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this dashboard"
        )

    # Get the target user's wiki_url and their GitLab session
    conn = sqlite3.connect('portal.db')
    c = conn.cursor()
    c.execute('SELECT wiki_url FROM users WHERE username = ?', (username,))
    result = c.fetchone()

    if not result:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    wiki_url = result[0]

    # Get the target user's session (to get their GitLab cookies)
    # If admin is viewing, use the target user's session, not the admin's
    c.execute('SELECT mint_session FROM sessions WHERE username = ? ORDER BY created_at DESC LIMIT 1', (username,))
    session_result = c.fetchone()
    conn.close()

    mint_session = session_result[0] if session_result else None

    if not wiki_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a wiki URL configured"
        )

    try:

        # Extract project ID and wiki page name from URL to use GitLab API
        # URL format: http://mint.../document-group/customer_luizfuga/-/wikis/Customer_Links
        parts = wiki_url.split('/')
        if len(parts) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid wiki URL format: {wiki_url}"
            )

        project_path = '/'.join(parts[3:5])  # document-group/customer_luizfuga
        wiki_page = parts[-1]  # Customer_Links

        import urllib.parse
        project_path_encoded = urllib.parse.quote(project_path, safe='')

        base_url = f"{parts[0]}//{parts[2]}"
        api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"


        # Check cache first
        cached = get_cached_content(api_url)

        if cached:
            content = cached
        else:
            content = await fetch_wiki_content(api_url, mint_session)
            cache_content(api_url, content)

        # Parse JSON response from GitLab API
        import json
        try:
            wiki_data = json.loads(content)
            markdown_text = wiki_data.get('content', '')
            if markdown_text:
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse wiki content from GitLab API"
            )

        # Parse links
        groups = parse_markdown_links(markdown_text)

        return DashboardResponse(
            groups=groups,
            last_updated=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# ==========================================
# STATUS MONITORING ENDPOINTS
# ==========================================

async def get_all_links_from_gitlab_wikis() -> List[dict]:
    """Get all links from all users' GitLab wikis"""
    all_links = []
    users = get_all_users()

    for user in users:
        try:
            username = user['username']
            wiki_url = user['wiki_url']

            # Get session for this user
            conn = sqlite3.connect('portal.db')
            c = conn.cursor()
            c.execute('SELECT mint_session FROM sessions WHERE username = ? ORDER BY created_at DESC LIMIT 1', (username,))
            session_result = c.fetchone()
            conn.close()

            mint_session = session_result[0] if session_result else None

            # Extract API URL
            parts = wiki_url.split('/')
            if len(parts) < 6:
                continue

            project_path = '/'.join(parts[3:5])
            wiki_page = parts[-1]

            import urllib.parse
            project_path_encoded = urllib.parse.quote(project_path, safe='')
            base_url = f"{parts[0]}//{parts[2]}"
            api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"

            # Fetch wiki content
            content = await fetch_wiki_content(api_url, mint_session)

            # Parse JSON
            import json
            wiki_data = json.loads(content)
            markdown_text = wiki_data.get('content', '')

            # Parse links
            groups = parse_markdown_links(markdown_text)

            for group in groups:
                for link in group.links:
                    link_data = {
                        'id': f"{username}_{link.url}",
                        'name': link.text,
                        'url': link.url,
                        'username': username,
                        'product': group.product,
                        'environment': group.environment
                    }
                    all_links.append(link_data)
        except Exception as e:
            continue

    return all_links


async def get_user_links_from_gitlab_wiki(username: str) -> List[dict]:
    """Get links from a specific user's GitLab wiki"""
    try:
        # Get user's wiki URL
        conn = sqlite3.connect('portal.db')
        c = conn.cursor()
        c.execute('SELECT wiki_url FROM users WHERE username = ?', (username,))
        result = c.fetchone()

        if not result:
            conn.close()
            return []

        wiki_url = result[0]

        # Get session
        c.execute('SELECT mint_session FROM sessions WHERE username = ? ORDER BY created_at DESC LIMIT 1', (username,))
        session_result = c.fetchone()
        conn.close()

        mint_session = session_result[0] if session_result else None

        # Extract API URL
        parts = wiki_url.split('/')
        if len(parts) < 6:
            return []

        project_path = '/'.join(parts[3:5])
        wiki_page = parts[-1]

        import urllib.parse
        project_path_encoded = urllib.parse.quote(project_path, safe='')
        base_url = f"{parts[0]}//{parts[2]}"
        api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"

        # Fetch wiki content
        content = await fetch_wiki_content(api_url, mint_session)

        # Parse JSON
        import json
        wiki_data = json.loads(content)
        markdown_text = wiki_data.get('content', '')

        # Parse links
        groups = parse_markdown_links(markdown_text)

        links = []
        for group in groups:
            for link in group.links:
                link_data = {
                    'id': f"{username}_{link.url}",
                    'name': link.text,
                    'url': link.url,
                    'product': group.product,
                    'environment': group.environment
                }
                links.append(link_data)

        return links
    except Exception as e:
        return []


@app.get("/api/status/links")
async def get_all_link_statuses(current_user: dict = Depends(get_current_user)):
    """Get status for all links (admin only)"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        # Import status check function
        from simple_status_check import check_link_status

        # Get all links
        links = await get_all_links_from_gitlab_wikis()


        # Check status for all links in parallel
        async def check_single_link(link):
            try:
                status_info = await check_link_status(link['url'])
                result = {
                    "id": link['id'],
                    "name": link['name'],
                    "url": link['url'],
                    "product": link.get('product', 'Uncategorized'),
                    "environment": link.get('environment', 'Default'),
                    "status": status_info['status'],
                    "responseTime": status_info['response_time'],
                    "uptime": 100 if status_info['status'] == 'online' else 0,
                    "lastChecked": datetime.now().isoformat()
                }
                return result
            except Exception as e:
                return {
                    "id": link['id'],
                    "name": link['name'],
                    "url": link['url'],
                    "product": link.get('product', 'Uncategorized'),
                    "environment": link.get('environment', 'Default'),
                    "status": "unknown",
                    "responseTime": 0,
                    "uptime": 0,
                    "lastChecked": datetime.now().isoformat()
                }

        # Run all checks in parallel
        link_list = await asyncio.gather(*[check_single_link(link) for link in links])

        return {"links": list(link_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/status/links/{username}")
async def get_user_link_statuses(
    username: str,
    current_user: dict = Depends(get_current_user)
):
    """Get status for a specific user's links"""
    # Check authorization
    if current_user['username'] != username and not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        # Import status check function
        from simple_status_check import check_link_status

        # Get user's links
        user_links = await get_user_links_from_gitlab_wiki(username)


        # Check status for all links in parallel
        async def check_single_link(link):
            try:
                status_info = await check_link_status(link['url'])
                result = {
                    "id": link['id'],
                    "name": link['name'],
                    "url": link['url'],
                    "product": link.get('product', 'Uncategorized'),
                    "environment": link.get('environment', 'Default'),
                    "status": status_info['status'],
                    "responseTime": status_info['response_time'],
                    "uptime": 100 if status_info['status'] == 'online' else 0,
                    "lastChecked": datetime.now().isoformat()
                }
                return result
            except Exception as e:
                return {
                    "id": link['id'],
                    "name": link['name'],
                    "url": link['url'],
                    "product": link.get('product', 'Uncategorized'),
                    "environment": link.get('environment', 'Default'),
                    "status": "unknown",
                    "responseTime": 0,
                    "uptime": 0,
                    "lastChecked": datetime.now().isoformat()
                }

        # Run all checks in parallel
        link_list = await asyncio.gather(*[check_single_link(link) for link in user_links])

        return {"links": list(link_list)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/status/ping/{link_id}")
async def ping_link(
    link_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Ping a specific link to check its status"""
    try:
        # Import status check function
        from simple_status_check import check_link_status

        # Extract URL from link_id (format: username_url)
        parts = link_id.split('_', 1)
        if len(parts) != 2:
            raise HTTPException(status_code=400, detail="Invalid link ID format")

        link_url = parts[1]

        # Check status
        status_info = await check_link_status(link_url)

        return {
            "id": link_id,
            "status": status_info['status'],
            "responseTime": status_info['response_time'],
            "lastChecked": datetime.now().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)