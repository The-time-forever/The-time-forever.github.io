import sqlite3
import json

DB = r"C:\Users\Adam\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
c = conn.cursor()

# 1. List all tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("=== TABLES ===")
print([r[0] for r in c.fetchall()])

# 2. Recent sessions (last 20)
c.execute("SELECT id, project_id, directory, title, time_created FROM session ORDER BY time_created DESC LIMIT 20")
print("\n=== RECENT SESSIONS (last 20) ===")
for r in c.fetchall():
    print(r)

# 3. Schema info for key tables
for table in ["session", "message", "part", "task", "task_event", "actor_registry"]:
    c.execute(f"PRAGMA table_info({table})")
    cols = c.fetchall()
    if cols:
        print(f"\n=== SCHEMA: {table} ===")
        for col in cols:
            print(f"  {col[1]} ({col[2]})")

# 4. Count sessions and messages
c.execute("SELECT COUNT(*) FROM session")
print(f"\nTotal sessions: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM message")
print(f"Total messages: {c.fetchone()[0]}")
c.execute("SELECT COUNT(*) FROM part")
print(f"Total parts: {c.fetchone()[0]}")

# 5. Find sessions in this project's directory
proj_dir = r"D:\Document\The-time-forever.github.io"
c.execute("SELECT id, title, time_created FROM session WHERE directory LIKE ?", (f"%{proj_dir}%",))
print(f"\n=== SESSIONS for {proj_dir} ===")
for r in c.fetchall():
    print(r)

# 6. Recent user messages with keywords
keywords = ["always", "never", "remember", "rule", "decision", "重要", "记住"]
for kw in keywords:
    c.execute("""
        SELECT m.id, m.session_id, substr(json_extract(p.data, '$.text'), 1, 300) as preview
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(p.data, '$.type') = 'text'
          AND json_extract(p.data, '$.text') LIKE ?
        ORDER BY m.time_created DESC
        LIMIT 3
    """, (f"%{kw}%",))
    rows = c.fetchall()
    if rows:
        print(f"\n=== User messages containing '{kw}' ===")
        for r in rows:
            print(r)

conn.close()
