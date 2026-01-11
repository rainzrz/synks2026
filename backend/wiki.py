"""
Wiki content fetching and parsing functionality
"""
from fastapi import HTTPException
import httpx
import re
import json
import urllib.parse
from typing import List
from models import ProductGroup, LinkItem


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
            pass  # No debug logging

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


def extract_api_url_from_wiki_url(wiki_url: str) -> str:
    """
    Convert wiki page URL to GitLab API URL
    Input: http://mint.../document-group/customer_name/-/wikis/Customer_Links
    Output: http://mint.../api/v4/projects/document-group%2Fcustomer_name/wikis/Customer_Links
    """
    parts = wiki_url.split('/')
    if len(parts) < 6:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid wiki URL format: {wiki_url}"
        )

    project_path = '/'.join(parts[3:5])  # document-group/customer_name
    wiki_page = parts[-1]  # Customer_Links

    project_path_encoded = urllib.parse.quote(project_path, safe='')

    base_url = f"{parts[0]}//{parts[2]}"  # http://mint.systemhaus.com.br:9070
    api_url = f"{base_url}/api/v4/projects/{project_path_encoded}/wikis/{wiki_page}"

    return api_url


async def fetch_and_parse_wiki(wiki_url: str, mint_session: str = None) -> List[ProductGroup]:
    """
    Fetch wiki content and parse it into product groups
    """
    # Convert to API URL
    api_url = extract_api_url_from_wiki_url(wiki_url)

    # Fetch content
    content = await fetch_wiki_content(api_url, mint_session)

    # Parse JSON response from GitLab API
    try:
        wiki_data = json.loads(content)
        markdown_text = wiki_data.get('content', '')
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to parse wiki content from GitLab API"
        )

    # Parse links
    groups = parse_markdown_links(markdown_text)

    return groups
