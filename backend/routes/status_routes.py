"""
Status monitoring routes
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import List
import asyncio
from auth import get_current_user, require_admin
from database import get_all_users, get_user_session, get_user_by_username
from wiki import fetch_and_parse_wiki

router = APIRouter(prefix="/api/status", tags=["status"])


async def get_all_links_from_gitlab_wikis() -> List[dict]:
    """Get all links from all users' GitLab wikis"""
    all_links = []
    users = get_all_users()

    for user in users:
        try:
            username = user['username']
            wiki_url = user['wiki_url']
            mint_session = get_user_session(username)

            # Fetch and parse wiki
            groups = await fetch_and_parse_wiki(wiki_url, mint_session)

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
        user_data = get_user_by_username(username)

        if not user_data:
            return []

        wiki_url = user_data[1]
        mint_session = get_user_session(username)

        # Fetch and parse wiki
        groups = await fetch_and_parse_wiki(wiki_url, mint_session)

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


@router.get("/links")
async def get_all_link_statuses(current_user: dict = Depends(get_current_user)):
    """Get status for all links (admin only)"""
    require_admin(current_user)

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


@router.get("/links/{username}")
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


@router.post("/ping/{link_id}")
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
