"""
Cache management functionality
"""
import sqlite3
from datetime import datetime, timedelta
from typing import Optional
from config import DB_NAME, CACHE_EXPIRY_MINUTES


def get_cached_content(url: str, max_age_minutes: int = CACHE_EXPIRY_MINUTES) -> Optional[str]:
    """
    Get cached content if not expired
    """
    conn = sqlite3.connect(DB_NAME)
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
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('''
        INSERT OR REPLACE INTO cache (url, content, cached_at)
        VALUES (?, ?, ?)
    ''', (url, content, datetime.now()))

    conn.commit()
    conn.close()


def clear_all_cache():
    """Clear entire cache"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('DELETE FROM cache')
    conn.commit()
    conn.close()
