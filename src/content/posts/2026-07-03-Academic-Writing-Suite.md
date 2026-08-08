---
layout: post
title: "Academic Writing Suite：一个面向学术写作的技能包"
date: 2026-07-03
permalink: /posts/2026/07/03/academic-writing-suite/
---

## 一句话总结

**Academic Writing Suite** 是我做的一个技能包，专门用来辅助学术论文写作。它会先判断你的需求属于哪一类写作任务，再自动路由到对应的子技能去处理——不用自己去分辨该用哪个工具，把需求说清楚就行。

- 项目地址：[github.com/The-time-forever/academic-writing-suite](https://github.com/The-time-forever/academic-writing-suite)
- SkillHub 页面：[skillhub.cn/skills/academic-writing-suite](https://skillhub.cn/skills/academic-writing-suite)

## 能做什么

整个技能包目前覆盖七类学术写作功能：

- **参考文献**：格式化、校验、转换、导出常见引用格式和文献管理工具的数据。
- **摘要**：撰写或润色摘要，以及关键词列表。
- **引言（Introduction）**：按 research-gap / CARS 结构润色引言部分。
- **方法（Method）**：让方法部分表述更清晰、可复现、步骤完整。
- **结果（Results）**：追求精确表述，并与"解读"部分严格区分开。
- **讨论（Discussion）**：包括结果解读、文献对比、局限性说明、意义阐述。
- **结论/收尾（Closing）**：撰写或润色结论、建议、未来研究方向等收尾内容。

## 目录结构

```
academic-writing-suite/
  SKILL.md                  # 根路由文件
  abstract-writer/          # 摘要撰写
  closing-writer/           # 结论 / 收尾部分
  discussion-polisher/      # 讨论部分润色
  introduction-polisher/    # 引言部分润色
  method-polisher/          # 方法部分润色
  reference-formatter/      # 参考文献格式化
  results-polisher/         # 结果部分润色
```

根目录的 `SKILL.md` 负责判断用户的写作需求属于哪一类，并把请求路由到最相关的子技能；每个子技能都有自己独立的指令和参考资料。

## 路由是怎么工作的

技能内部维护了一张需求 → 子技能的对照表：

| 用户需求 | 加载的子技能 |
| --- | --- |
| 格式化 / 转换 / 检测 / 导出参考文献（APA、MLA、Chicago、IEEE、GB/T 7714、Vancouver、BibTeX、RIS、EndNote、Zotero、NoteExpress） | `reference-formatter/SKILL.md` |
| 撰写、改写或润色摘要 / 关键词列表 | `abstract-writer/SKILL.md` |
| 撰写或润色结论 / 讨论 / 收尾部分 | `closing-writer/SKILL.md` |
| 润色或重组引言部分 | `introduction-polisher/SKILL.md` |
| 润色或重组方法部分 | `method-polisher/SKILL.md` |
| 润色或重组结果 / 发现部分 | `results-polisher/SKILL.md` |
| 润色或重组讨论部分 | `discussion-polisher/SKILL.md` |

### 遇到模糊需求怎么处理

- **"帮我改改我的论文"** —— 先反问用户具体是哪个部分或哪类需求，再路由。
- **"润色一下我的讨论/结论部分"** —— 论文的收尾部分标题可能是 Discussion、Conclusion，也可能两者合一，因此按以下逻辑处理：
  - 想解读结果、对比文献、评估局限性 → 走 `discussion-polisher`
  - 想收束全文、说明意义、给出未来建议 → 走 `closing-writer`
  - 如果这部分内容两种功能都有 → 两个都加载，先跑 discussion-polisher 的逻辑，再用 closing-writer 处理收尾的推论部分
- **一次性处理整篇论文** —— 如果用户上传完整论文并要求整体改进，逐节处理：Introduction → Method → Results → Discussion/Closing → Abstract。可以先问用户想从哪部分开始，如果对方说"全部都改"，就按 IMRAD 顺序依次处理。

### 文件读取优先级

处理上传文件时，按下列顺序选用可用的方式：

1. 内容已经在上下文里 → 直接处理
2. 有文件读取工具 → 用工具读取
3. 有代码执行环境 → `.docx` 用 `python-docx`，`.pdf` 用 `pdfplumber`，`.txt` 直接 `open()`
4. 以上都没有 → 请用户直接把相关内容粘贴过来

## 典型使用场景

- 清理和转换格式混乱的参考文献条目
- 生成 APA / MLA / Chicago / IEEE / GB/T 7714 / Vancouver / BibTeX / RIS / EndNote / Zotero / NoteExpress 等格式的引用
- 投稿前对论文各部分进行润色
- 强化研究空白（research gap）、方法描述、结果汇报和讨论逻辑
- 生成摘要、关键词、结论和未来研究方向建议

## 默认语言

技能默认输出**英文**，如果用户要求其他语言，会按要求切换。

## 致谢与参考

这个技能包的灵感来自我在西安交通大学上过的《英语学术论文写作》课程，当时的学习令我印象深刻。

参考资料：

[1] Ruiying Yang. *Fundamentals of Academic Writing*. Xi'an: Xi'an Jiaotong University Press, 2016.
