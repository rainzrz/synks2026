"""
Database initialization and operations
"""
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import List, Optional
from config import DB_NAME, SESSION_EXPIRY_HOURS
import secrets


def init_db():
    """Initialize database tables"""
    conn = sqlite3.connect(DB_NAME)
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


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def create_user(username: str, password: str, wiki_url: str, is_admin: bool = False) -> bool:
    """Create a new user"""
    try:
        conn = sqlite3.connect(DB_NAME)
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
    conn = sqlite3.connect(DB_NAME)
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
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    c.execute('SELECT wiki_url FROM users WHERE username = ?', (username,))
    result = c.fetchone()
    conn.close()

    return result[0] if result else None


def get_all_users() -> List[dict]:
    """Get all users from database"""
    conn = sqlite3.connect(DB_NAME)
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
        conn = sqlite3.connect(DB_NAME)
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
        conn = sqlite3.connect(DB_NAME)
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


def create_session(username: str, mint_session: str = None) -> str:
    """Create a new session for a user"""
    token = secrets.token_urlsafe(32)
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()

    now = datetime.now()
    expires = now + timedelta(hours=SESSION_EXPIRY_HOURS)

    c.execute('''
        INSERT INTO sessions (token, username, mint_session, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (token, username, mint_session, now, expires))

    conn.commit()
    conn.close()
    return token


def verify_token(token: str) -> Optional[dict]:
    """Verify session token and return user data"""
    conn = sqlite3.connect(DB_NAME)
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


def delete_session(username: str):
    """Delete all sessions for a user"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('DELETE FROM sessions WHERE username = ?', (username,))
    conn.commit()
    conn.close()


def get_user_session(username: str) -> Optional[str]:
    """Get the most recent mint session for a user"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT mint_session FROM sessions WHERE username = ? ORDER BY created_at DESC LIMIT 1', (username,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else None


def get_user_by_username(username: str) -> Optional[tuple]:
    """Get user data by username"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('SELECT username, wiki_url, is_admin FROM users WHERE username = ?', (username,))
    result = c.fetchone()
    conn.close()
    return result
