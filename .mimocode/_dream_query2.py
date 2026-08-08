import sqlite3
import json

DB = r"C:\Users\Adam\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB)
c = conn.cursor()

# Get all sessions for this project with their content
proj_sessions = [
    'ses_0e1de74faffeXWsjJGYtSn4243',  # 阅读并理解这个项目
    'ses_0c4390667ffee6gDtnjm0Qn5qi',  # 在白天模式下出现了这个问题
    'ses_0c439063bffeRLDlJcZRwOum6J',  # 博客文章css和html界面
    'ses_0c439061cffexAaeoHPWX4tShs',  # 加载速度慢的问题
    'ses_0c43905e8ffeln46R6HQchEU0z',  # 图片上传发布
    'ses_0c43905c8ffeiKl3N3a2umC7Vj',  # 搜索功能
    'ses_0c43905a7ffetwc2jv5tk1ilBJ',  # 修改润色文章
    'ses_01fdfe925ffevLUp4O4gK2jZHc',  # create CLAUDE.md
    'ses_01fdf9726ffenQlpyCxOXN5e62',  # Posts页面具体文章URL设定
]

for sid in proj_sessions:
    # Get session title
    c.execute("SELECT title, time_created FROM session WHERE id = ?", (sid,))
    row = c.fetchone()
    if not row:
        print(f"\n=== Session {sid}: NOT FOUND ===")
        continue
    title, ts = row
    print(f"\n=== Session {sid}: {title} (ts={ts}) ===")

    # Get user messages (first 5) and assistant messages (first 5)
    c.execute("""
        SELECT m.id, json_extract(m.data, '$.role') as role, m.agent_id,
               json_extract(p.data, '$.type') as part_type,
               json_extract(p.data, '$.text') as text,
               substr(json_extract(p.data, '$.state.input'), 1, 200) as tool_input
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND (
            (json_extract(m.data, '$.role') = 'user' AND json_extract(p.data, '$.type') = 'text')
            OR
            (json_extract(m.data, '$.role') = 'assistant' AND json_extract(p.data, '$.type') = 'text')
            OR
            (json_extract(m.data, '$.role') = 'assistant' AND json_extract(p.data, '$.type') = 'tool')
          )
        ORDER BY m.time_created, p.time_created
        LIMIT 40
    """, (sid,))
    rows = c.fetchall()
    for r in rows:
        msg_id, role, agent_id, part_type, text, tool_input = r
        if text:
            preview = text[:300].replace('\n', ' ')
            print(f"  [{role}] {preview}")
        elif tool_input:
            print(f"  [{role}] tool: {tool_input[:200]}")

conn.close()
