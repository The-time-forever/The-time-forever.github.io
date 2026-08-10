---
name: unified-blog-writing
description: Draft, revise, or review Markdown posts for this Astro blog in its established Chinese technical-blog style, structure, frontmatter, and formatting. Use when creating or editing files under src/content/posts, especially tutorials, knowledge notes, tool-efficiency guides, or academic-writing guides.
---

# 博客统一写作

Use this skill to keep new and revised posts consistent with the existing blog: practical, beginner-friendly, conversational, and organized around clear explanations plus actionable examples.

## 工作流程

### 1. 先检查上下文

- Read `AGENTS.md` and `src/content.config.ts` before editing.
- Inspect two or three nearby posts in the same category. Prefer one recent article and one representative article with similar subject matter.
- Preserve unrelated user changes and avoid changing site components unless the request requires it.

### 2. 根据仓库实现决定文章形态

Treat the repository implementation as the source of truth. Before choosing a format, inspect `src/content.config.ts`, the relevant layout and components, and recent posts. Do not force every article into a fixed taxonomy; choose the structure that best fits the user's request, the subject, and the rendering capabilities currently implemented in the repository.

Use these as flexible patterns rather than fixed article types:

- **Tutorial pattern**：Start with a concrete problem, then cover prerequisites, installation, usage, workflow, troubleshooting, and a conclusion. Include runnable commands and explain important parameters.
- **Reference pattern**：Organize by concept or chapter. Define terms first, then list properties, formulas, examples, key conclusions, common mistakes, or decision trees. Prefer tables when the reader will use the article as a reference.
- **Explainer pattern**：Start with the reader's question, build a mental model, compare related concepts, and use diagrams or analogies where they reduce confusion.
- **Experience pattern**：Present the result or recommendation first, then explain the reasoning, scenarios, trade-offs, habits, and limitations. Mark personal judgments as experience or recommendation.

Combine patterns when the implementation and topic call for it.

### 3. 建立文章结构

- Open with the reader's situation, question, or pain point.
- Give a one-sentence definition or conclusion early.
- Explain the mental model before presenting a long command list or formula set.
- Use `##` for main sections and `###` for subsections. Number sections when the post is a tutorial, checklist, or chapter-like note.
- End with a compact summary, troubleshooting advice, recommended resources, or a next action. Use a playful personal postscript only when it fits the article.

Use this default outline when no stronger structure is required:

```markdown
---
title: 主题：副标题
date: 2026-08-10
categories: [技术折腾]
tags: ['404', 'HTTP', '教程']
permalink: /posts/2026/08/10/topic-guide/
---

先描述问题或使用场景。

用一句话说明本文解决什么问题。

## 什么是……

## 为什么需要它

## 基础用法

### 第一步：准备环境

### 第二步：执行操作

## 实际使用场景

## 常见问题与避坑

## 小结
```

## Frontmatter 规范

- Keep `title` and `date` on every post. Format dates as `YYYY-MM-DD` in both frontmatter and filenames.
- Use one of the schema categories: `技术折腾`, `学术写作`, `工具效率`, or `知识笔记`.
- Prefer a stable permalink in the form `/posts/YYYY/MM/DD/slug/`; use lowercase kebab-case slugs.
- Add no more than four `tags` when the post has clear searchable topics. Keep tags concise and use Chinese or established English technical names consistently.
- Keep every tag a YAML string. Quote numeric-looking tags, version tags, or tags that could be parsed as numbers, for example `tags: ['404', 'HTTP', '教程']`, so they satisfy the repository's string schema.
- Set `math: true` only when the post contains rendered mathematical notation.
- Set `mermaid: true` only when the post contains Mermaid diagrams.
- Use `featured: true` sparingly and only when the post should be highlighted.
- Keep `redirect_to` for redirect-only legacy entries; do not turn such an entry into a normal article without an explicit request.

The page template supplies the visible article title, so start new article bodies with an opening paragraph and `##` sections. Preserve an existing body-level `#` hierarchy in legacy long-form notes unless the user asks for normalization.

## Markdown 与表达规范

- Write in clear, direct Chinese. Address the reader as “你” when giving guidance and use “我们” when explaining a shared workflow.
- Explain English technical terms as `中文名（English Name）` on first use, then use the shorter established form.
- Use plain-language transitions such as “简单来说”“换句话说”“先看”“这里要特别提醒”“如果你只想先记住……”. Do not fill paragraphs with jargon.
- Use bold for conclusions, warnings, and important distinctions; use inline code for commands, filenames, paths, APIs, and parameter names.
- Use fenced code blocks with a language label. Separate Windows PowerShell, macOS/Linux, and cross-platform commands when their syntax differs.
- Use tables for comparisons, quick references, keyboard shortcuts, status codes, formulas, or option selection. Use lists for steps, checklists, and troubleshooting.
- Use blockquotes for textbook context, compatibility notes, warnings, or concise side remarks. Do not turn every paragraph into a callout.
- Use Mermaid for a process, relationship, or sequence that is easier to understand visually. Explain the diagram in prose immediately afterward.
- Prefer concrete examples over abstract claims. Explain why a command or recommendation matters, not only what to type.
- Keep the tone warm and practical. Personal judgments are acceptable when marked as experience or recommendation; avoid presenting an unverified preference as an objective fact.
- Avoid unnecessary marketing language, repeated conclusions, and long introductions that delay the first useful explanation.

## 常见写作句式

Use these patterns as prompts, not as mandatory filler:

- Problem opening: “你可能遇到过……”“浏览……时突然……”。
- Definition: “用一句话来概括：……”“简单来说，……”。
- Transition: “在理解……之前，先看……”“接下来把……拆开说明”。
- Recommendation: “如果是第一次接触……，建议先……”。
- Warning: “这里要特别提醒一点：……”。
- Summary: “最简单的一句话就是：……”“记住这几件事就够了：……”。

## 发布前检查

- Verify frontmatter against the current `src/content.config.ts`, layouts, and components; do not assume a fixed article taxonomy or invent unsupported fields or categories.
- Verify that `tags` contains at most four quoted or otherwise string-valued entries.
- Check that the title, opening paragraph, section hierarchy, examples, and conclusion agree with one another.
- Check every command for platform, path, privilege, version, and destructive-operation warnings.
- Check Mermaid and math flags against the actual body content.
- Check links, code fences, tables, and inline code for Markdown rendering errors.
- Use HTTPS for external links and avoid adding secrets, tokens, or machine-specific private paths.
- Run `npm run build` after content or schema changes. Manually inspect `/`, `/posts/`, and the changed article route when practical.

### scripts/
Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Codex for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Codex's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Codex should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Codex produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Not every skill requires all three types of resources.**
