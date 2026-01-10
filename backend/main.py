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
    c.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            username TEXT NOT NULL,
            mint_session TEXT,
            created_at TIMESTAMP,
            expires_at TIMESTAMP
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
class LoginRequest(BaseModel):
    username: str
    password: str
    mint_url: str = "http://mint.systemhaus.com.br:9070"

class LoginResponse(BaseModel):
    token: str
    username: str
    message: str

class LinkItem(BaseModel):
    name: str
    url: str

class ProductGroup(BaseModel):
    country: str
    product: str
    environment: str
    links: List[LinkItem]

class DashboardResponse(BaseModel):
    groups: List[ProductGroup]
    last_updated: str

# Helper functions
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
        SELECT username, mint_session, expires_at 
        FROM sessions 
        WHERE token = ?
    ''', (token,))
    
    result = c.fetchone()
    conn.close()
    
    if not result:
        return None
    
    username, mint_session, expires_at = result
    expires = datetime.fromisoformat(expires_at)
    
    if datetime.now() > expires:
        return None
    
    return {
        "username": username,
        "mint_session": mint_session
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
            print(f"🔐 Fetching login page: {login_url}")
            
            response = await client.get(login_url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find CSRF token (authenticity_token)
            csrf_input = soup.find('input', {'name': 'authenticity_token'})
            if not csrf_input:
                print("❌ CSRF token not found")
                return None
            
            csrf_token = csrf_input.get('value')
            print(f"✅ Found CSRF token: {csrf_token[:20]}...")
            
            # Get initial cookies
            initial_cookies = dict(response.cookies)
            print(f"🍪 Initial cookies: {list(initial_cookies.keys())}")
            
            # Step 2: Submit login form (LDAP)
            ldap_login_url = f"{mint_url}/users/auth/ldapmain/callback"
            
            login_data = {
                'username': username,
                'password': password,
                'authenticity_token': csrf_token,
                'remember_me': '0'
            }
            
            print(f"🔑 Attempting LDAP login for user: {username}")
            auth_response = await client.post(
                ldap_login_url,
                data=login_data,
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': login_url
                },
                cookies=initial_cookies
            )
            
            print(f"📬 Login response status: {auth_response.status_code}")
            print(f"📍 Final URL after login: {auth_response.url}")
            
            # Collect all cookies from the entire redirect chain
            all_cookies = dict(client.cookies)
            print(f"🍪 All cookies after login: {list(all_cookies.keys())}")
            
            # Check if we have a session cookie
            if '_gitlab_session' in all_cookies:
                print(f"✅ Login successful! Found session cookie")
                cookie_str = '; '.join([f"{k}={v}" for k, v in all_cookies.items()])
                return cookie_str
            
            # Try to access a protected page to verify
            test_url = f"{mint_url}/dashboard/projects"
            test_response = await client.get(test_url)
            
            print(f"🧪 Test page status: {test_response.status_code}")
            print(f"🧪 Test page URL: {test_response.url}")
            
            # Get cookies after test request
            all_cookies = dict(client.cookies)
            print(f"🍪 Cookies after test: {list(all_cookies.keys())}")
            
            # If we're not redirected to login, auth was successful
            if '/users/sign_in' not in str(test_response.url):
                print("✅ Auth verified - not redirected to login")
                cookie_str = '; '.join([f"{k}={v}" for k, v in all_cookies.items()])
                return cookie_str if cookie_str else "authenticated"
            
            print("❌ Login failed - still redirecting to sign in")
            return None
            
    except Exception as e:
        print(f"❌ Auth error: {e}")
        import traceback
        traceback.print_exc()
        return None

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

    print("\n🔍 Parsing content...")

    for i, line in enumerate(lines):
        original_line = line
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Debug first 30 non-empty lines
        if i < 30:
            print(f"Line {i}: {original_line[:100]}")

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
                print(f"✅ Added group: {current_product} - {current_env} with {len(current_links)} links")
                current_links = []
                current_env = None

            # Parse new product header
            current_product = line[2:].strip()  # Remove "# " prefix
            print(f"🏷️ Product: {current_product}")

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
                print(f"✅ Added group: {current_product} - {current_env} with {len(current_links)} links")
                current_links = []

            # Set new environment
            current_env = line[3:].strip()  # Remove "## " prefix
            print(f"🔧 Environment: {current_env}")

        # Detect markdown links in bullet points
        elif (line.startswith('*') or line.startswith('-')) and '[' in line and '](' in line:
            link_pattern = r'\[([^\]]+)\]\(([^\)]+)\)'
            matches = re.findall(link_pattern, line)

            for name, url in matches:
                link = LinkItem(name=name.strip(), url=url.strip())
                current_links.append(link)
                print(f"🔗 Found link: {name} -> {url}")

    # Add last group
    if current_product and current_env and current_links:
        groups.append(ProductGroup(
            country="",
            product=current_product,
            environment=current_env,
            links=current_links
        ))
        print(f"✅ Added final group: {current_product} - {current_env} with {len(current_links)} links")

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
        
        print(f"🌐 Fetching wiki with cookies: {list(cookies_dict.keys())}")
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(
                wiki_url, 
                cookies=cookies_dict, 
                headers=headers
            )
            
            print(f"📄 Wiki response status: {response.status_code}")
            print(f"📍 Final URL: {response.url}")
            
            if response.status_code == 200:
                # Check if we got redirected to login page
                if 'sign_in' in str(response.url) or 'You need to sign in' in response.text:
                    print("⚠️ Got redirected to login - session invalid!")
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
        print(f"❌ Error fetching wiki: {e}")
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
@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user with Mint credentials
    """
    # Attempt authentication with Mint
    mint_session = await authenticate_with_mint(
        request.username,
        request.password,
        request.mint_url
    )
    
    if not mint_session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Create local session
    token = create_session(request.username, mint_session)
    
    return LoginResponse(
        token=token,
        username=request.username,
        message="Login successful"
    )

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    wiki_url: str = "http://mint.systemhaus.com.br:9070/document-group/customer_-a.buhler/-/wikis/Customer_Links",
    current_user: dict = Depends(get_current_user)
):
    """
    Get parsed dashboard with product links
    """
    print(f"\n🔍 Dashboard request for user: {current_user.get('username')}")
    print(f"📄 Wiki URL: {wiki_url}")
    
    # Extract project ID and wiki page name from URL
    # URL format: http://mint.systemhaus.com.br:9070/document-group/customer_-a.buhler/-/wikis/Customer_Links
    parts = wiki_url.split('/')
    project_path = '/'.join(parts[3:5])  # document-group/customer_-a.buhler
    wiki_page = parts[-1]  # Customer_Links
    
    # Build GitLab API URL
    # First, URL encode the project path
    import urllib.parse
    project_path_encoded = urllib.parse.quote(project_path, safe='')
    
    base_url = f"{parts[0]}//{parts[2]}"  # http://mint.systemhaus.com.br:9070
    api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"
    
    print(f"🔧 API URL: {api_url}")
    
    # Check cache first
    cached = get_cached_content(api_url)
    
    if cached:
        print("✅ Using cached content")
        content = cached
    else:
        print("🌐 Fetching fresh content from GitLab API...")
        # Fetch from API
        content = await fetch_wiki_content(api_url, current_user.get('mint_session'))
        print(f"📦 Received {len(content)} bytes from API")
        cache_content(api_url, content)
    
    # Parse JSON response from GitLab API
    import json
    try:
        wiki_data = json.loads(content)
        markdown_text = wiki_data.get('content', '')
        print(f"✅ Extracted markdown content ({len(markdown_text)} chars)")
        
        # Save for debugging
        with open('debug_markdown.txt', 'w', encoding='utf-8') as f:
            f.write(markdown_text)
        print("💾 Saved markdown to debug_markdown.txt")
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
        markdown_text = content
    
    # Parse links
    groups = parse_markdown_links(markdown_text)
    print(f"🔗 Found {len(groups)} product groups")
    for i, group in enumerate(groups, 1):
        print(f"   Group {i}: {group.country} - {len(group.links)} links")
    
    return DashboardResponse(
        groups=groups,
        last_updated=datetime.now().isoformat()
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
    
    print("🗑️ Cache cleared!")
    return {"message": "Cache cleared successfully"}

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint
    """
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)