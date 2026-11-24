import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")


def get_db_path() -> str:
    """Extract filesystem path from DATABASE_URL."""
    url = DATABASE_URL
    if url.startswith("sqlite:///"):
        path = url[len("sqlite:///"):]
    elif url.startswith("sqlite://"):
        path = url[len("sqlite://"):]
    else:
        path = url

    # On Windows, normalize path
    if os.name == "nt" and path.startswith("/") and len(path) > 2 and path[2] == ":":
        path = path.lstrip("/")

    # Ensure parent directory exists
    dir_name = os.path.dirname(os.path.abspath(path))
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    return os.path.abspath(path)


def get_connection() -> sqlite3.Connection:
    """Return a SQLite connection with dict-like row factory."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize database tables and indexes."""
    conn = get_connection()
    try:
        with conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                    content TEXT NOT NULL,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
            """)
    finally:
        conn.close()


def add_message(session_id: str, role: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> int:
    """Save a user or assistant message to SQLite."""
    conn = get_connection()
    try:
        with conn:
            meta_json = json.dumps(metadata) if metadata is not None else None
            cursor = conn.execute(
                """
                INSERT INTO messages (session_id, role, content, metadata, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (session_id, role, content, meta_json, datetime.now(timezone.utc).isoformat())
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_session_messages(session_id: str) -> List[Dict[str, Any]]:
    """Retrieve all messages for a session in chronological order."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT id, session_id, role, content, metadata, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC
            """,
            (session_id,)
        )
        rows = cursor.fetchall()
        messages = []
        for row in rows:
            meta = None
            if row["metadata"]:
                try:
                    meta = json.loads(row["metadata"])
                except Exception:
                    meta = None
            messages.append({
                "id": row["id"],
                "session_id": row["session_id"],
                "role": row["role"],
                "content": row["content"],
                "metadata": meta,
                "created_at": str(row["created_at"])
            })
        return messages
    finally:
        conn.close()


def get_all_sessions() -> List[Dict[str, Any]]:
    """Get list of active sessions with message counts and timestamps."""
    conn = get_connection()
    try:
        cursor = conn.execute(
            """
            SELECT session_id, 
                   COUNT(id) as message_count, 
                   MAX(created_at) as last_activity,
                   (SELECT content FROM messages m2 WHERE m2.session_id = m1.session_id ORDER BY id ASC LIMIT 1) as first_message
            FROM messages m1
            GROUP BY session_id
            ORDER BY last_activity DESC
            """
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def check_db_health() -> bool:
    """Verify database accessibility."""
    try:
        conn = get_connection()
        try:
            cursor = conn.execute("SELECT 1")
            cursor.fetchone()
            return True
        finally:
            conn.close()
    except Exception:
        return False
