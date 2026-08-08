import sqlite3

DB = r"C:\Users\Adam\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
c = conn.cursor()

# Verify: user explicitly said "don't auto-start processes"
sid = 'ses_0c439061cffexAaeoHPWX4tShs'
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%不要%'
    ORDER BY m.time_created
""", (sid,))
print("=== '不要' in loading session ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: user said "栏宽不要收缩了"
sid2 = 'ses_0c439063bffeRLDlJcZRwOum6J'
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%栏宽%'
    ORDER BY m.time_created
""", (sid2,))
print("\n=== '栏宽' in theme session ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: user said "新开一个分支" for features
for kw in ['分支', 'branch']:
    c.execute("""
        SELECT json_extract(p.data, '$.text') as text, m.session_id
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'user'
          AND json_extract(p.data, '$.type') = 'text'
          AND json_extract(p.data, '$.text') LIKE ?
        ORDER BY m.time_created DESC
        LIMIT 5
    """, (f"%{kw}%",))
    rows = c.fetchall()
    if rows:
        print(f"\n=== User messages containing '{kw}' ===")
        for r in rows:
            print(f"  [{r[1]}] {r[0][:200]}")

# Verify: "该不会还在运行吧，你不要自己启动进程啊"
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%启动进程%'
    ORDER BY m.time_created
""")
print("\n=== '启动进程' ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: "先讨论一下" / "先不必急于实现"
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND (json_extract(p.data, '$.text') LIKE '%先讨论%'
           OR json_extract(p.data, '$.text') LIKE '%先不必%')
    ORDER BY m.time_created
""")
print("\n=== '先讨论'/'先不必' ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: "不要做的太像一个开发文档"
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%开发文档%'
    ORDER BY m.time_created
""")
print("\n=== '开发文档' ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: "不要你自己启动进程啊" from loading session
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE json_extract(m.data, '$.role') = 'user'
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%该不会还在运行%'
    ORDER BY m.time_created
""")
print("\n=== '该不会还在运行' ===")
for r in c.fetchall():
    print(f"  {r[0][:300]}")

# Verify: Mermaid lazy-loading
c.execute("""
    SELECT json_extract(p.data, '$.text') as text
    FROM message m
    JOIN part p ON p.message_id = m.id
    WHERE m.session_id = ?
      AND json_extract(p.data, '$.type') = 'text'
      AND json_extract(p.data, '$.text') LIKE '%mermaid%'
    ORDER BY m.time_created
""", (sid,))
print("\n=== mermaid mentions in loading session ===")
for r in c.fetchall():
    if r[0]:
        print(f"  {r[0][:400]}")

conn.close()
