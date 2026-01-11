"""
Dashboard routes - fetching and displaying wiki content
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from models import DashboardResponse
from auth import get_current_user
from database import get_user_session
from wiki import fetch_and_parse_wiki, extract_api_url_from_wiki_url
from cache import get_cached_content, cache_content, clear_all_cache

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard", response_model=DashboardResponse)
async def get_dashboard(current_user: dict = Depends(get_current_user)):
    """
    Get parsed dashboard with product links using user's wiki URL
    """
    try:
        # Use the user's wiki_url from their profile
        wiki_url = current_user.get('wiki_url')

        if not wiki_url:
            raise HTTPException(
                status_code=400,
                detail="User does not have a wiki URL configured"
            )

        # Convert to API URL
        api_url = extract_api_url_from_wiki_url(wiki_url)

        # Check cache first
        cached = get_cached_content(api_url)

        if cached:
            # Parse cached content
            import json
            from wiki import parse_markdown_links
            wiki_data = json.loads(cached)
            markdown_text = wiki_data.get('content', '')
            groups = parse_markdown_links(markdown_text)
        else:
            # Fetch and parse
            groups = await fetch_and_parse_wiki(wiki_url, current_user.get('mint_session'))

            # Cache the raw response
            from wiki import fetch_wiki_content
            content = await fetch_wiki_content(api_url, current_user.get('mint_session'))
            cache_content(api_url, content)

        return DashboardResponse(
            groups=groups,
            last_updated=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.get("/dashboard/{username}", response_model=DashboardResponse)
async def get_user_dashboard(username: str, current_user: dict = Depends(get_current_user)):
    """
    Get dashboard for a specific user (admin only or own dashboard)
    """
    # Allow users to view their own dashboard or admin to view any
    if not current_user.get('is_admin') and username != current_user.get('username'):
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view this dashboard"
        )

    # Get the target user's wiki_url and their GitLab session
    from database import get_user_by_username
    user_data = get_user_by_username(username)

    if not user_data:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    wiki_url = user_data[1]
    mint_session = get_user_session(username)

    if not wiki_url:
        raise HTTPException(
            status_code=400,
            detail="User does not have a wiki URL configured"
        )

    try:
        # Convert to API URL
        api_url = extract_api_url_from_wiki_url(wiki_url)

        # Check cache first
        cached = get_cached_content(api_url)

        if cached:
            # Parse cached content
            import json
            from wiki import parse_markdown_links
            wiki_data = json.loads(cached)
            markdown_text = wiki_data.get('content', '')
            groups = parse_markdown_links(markdown_text)
        else:
            # Fetch and parse
            groups = await fetch_and_parse_wiki(wiki_url, mint_session)

            # Cache the raw response
            from wiki import fetch_wiki_content
            content = await fetch_wiki_content(api_url, mint_session)
            cache_content(api_url, content)

        return DashboardResponse(
            groups=groups,
            last_updated=datetime.now().isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


@router.post("/clear-cache")
async def clear_cache(current_user: dict = Depends(get_current_user)):
    """
    Clear the wiki content cache
    """
    clear_all_cache()
    return {"message": "Cache cleared successfully"}
