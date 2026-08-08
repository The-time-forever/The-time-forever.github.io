import sqlite3
import json

DB = r"C:\Users\Adam\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
c = conn.cursor()

# Focus on the CLAUDE.md session - get all assistant text outputs
sid = 'ses_01fdfe925ffevLUp4O4gK2jZHc'
print(f"=== Session {sid}: Full assistant text ===")
c.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role,
           json_extract(p.data, '$.type') as part_type,
           json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY m.time_created, p.time_created
""", (sid,))
for r in c.fetchall():
    msg_id, role, part_type, text = r
    if text and len(text) > 20:
        print(f"\n--- msg {msg_id} ---")
        print(text[:2000])

# Now the Posts URL session
sid2 = 'ses_01fdf9726ffenQlpyCxOXN5e62'
print(f"\n\n=== Session {sid2}: Full assistant text ===")
c.execute("""
    SELECT m.id, json_extract(m.data, '$.role') as role,
           json_extract(p.data, '$.type') as part_type,
           json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(m.data, '$.role') = 'assistant'
    ORDER BY m.time_created, p.time_created
""", (sid2,))
for r in c.fetchall():
    msg_id, role, part_type, text = r
    if text and len(text) > 20:
        print(f"\n--- msg {msg_id} ---")
        print(text[:2000])

# Get user messages from all project sessions for rules/decisions
proj_sessions = [
    'ses_0e1de74faffeXWsjJGYtSn4243',
    'ses_0c4390667ffee6gDtnjm0Qn5qi',
    'ses_0c439063bffeRLDlJcZRwOum6J',
    'ses_0c439061cffexAaeoHPWX4tShs',
    'ses_0c43905e8ffeln46R6HQchEU0z',
    'ses_0c43905c8ffeiKl3N3a2umC7Vj',
    'ses_0c43905a7ffetwc2jv5tk1ilBJ',
    'ses_01fdfe925ffevLUp4O4gK2jZHc',
    'ses_01fdf9726ffenQlpyCxOXN5e62',
]

print("\n\n=== ALL USER MESSAGES (project sessions) ===")
for sid in proj_sessions:
    c.execute("""
        SELECT m.id,
               json_extract(p.data, '$.text') as text
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'user'
          AND json_extract(p.data, '$.type') = 'text'
        ORDER BY m.time_created
    """, (sid,))
    rows = c.fetchall()
    if rows:
        c.execute("SELECT title FROM session WHERE id = ?", (sid,))
        title = c.fetchone()[0]
        print(f"\n--- {sid}: {title} ---")
        for r in rows:
            text = r[1]
            if text and len(text.strip()) > 5:
                print(f"  USER: {text[:500].replace(chr(10), ' ')}")

conn.close()
