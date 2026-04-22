import sqlite3
 
DB_NAME = "users.db"
 
# ✅ Reusable DB connection
def get_db():
    conn = sqlite3.connect(
        DB_NAME,
        timeout=5,
        check_same_thread=False
    )
    conn.execute("PRAGMA journal_mode=WAL")
    return conn
 
 
# ✅ Auto-migration helper
def migrate():
    conn = get_db()
    cursor = conn.cursor()
 
    # --- rooms table check ---
    cursor.execute("PRAGMA table_info(rooms)")
    room_columns = [col[1] for col in cursor.fetchall()]
 
    if "name" not in room_columns:
        print("🔧 Adding missing column: name")
        cursor.execute("ALTER TABLE rooms ADD COLUMN name TEXT")
 
    # --- users table check (NEW ✅) ---
    cursor.execute("PRAGMA table_info(users)")
    user_columns = [col[1] for col in cursor.fetchall()]
 
    if "email" not in user_columns:
        print("🔧 Adding missing column: email")
        cursor.execute("ALTER TABLE users ADD COLUMN email TEXT")
 
    conn.commit()
    conn.close()
 
 
# ✅ Initialize database
def init_db():
    conn = get_db()
    cursor = conn.cursor()
 
    # 👤 USERS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT,
    password TEXT
)
    """)
 
    # 🏠 ROOMS (UPDATED ✅)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        created_by TEXT,
        name TEXT,
        expires_at TEXT
    )
    """)
 
    # 🎥 REPLAY
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS replay (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT,
        event TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
 
    # 💾 SESSIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        room_id TEXT PRIMARY KEY,
        code TEXT,
        whiteboard TEXT
    )
    """)
 
    # 👥 USER ROOMS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    room_id TEXT,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(username, room_id)
)
    """)
 
    conn.commit()
    conn.close()
 
    # 🔥 RUN MIGRATION AFTER INIT
    migrate()