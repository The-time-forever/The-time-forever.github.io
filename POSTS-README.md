# 如何添加博客文章

此文件夹 (`_posts`) 用于存放博客文章。Jekyll 会自动读取此文件夹中的 Markdown 文件并生成文章列表。

## 1. 文件命名规则
文件名**必须**遵循以下格式：
`YYYY-MM-DD-文章标题.md`

例如：
- `2025-12-08-hello-world.md`
- `2025-11-18-git-tutorial.md`

## 2. 文章内容格式 (Front Matter)
每个 Markdown 文件的顶部必须包含 YAML 头信息（Front Matter）。

### 普通文章模板
```yaml
---
layout: post
title: "这里写文章标题"
date: 2025-12-08
---

这里写正文内容...
```

### 外部链接文章 (如 CSDN)
如果你希望点击标题直接跳转到外部网站，请添加 `redirect_to` 字段。

```yaml
---
layout: post
title: "我的 CSDN 文章"
date: 2025-12-08
redirect_to: "https://blog.csdn.net/your-link-here"
---
```

## 注意事项
- 文件名中的日期必须与 Front Matter 中的 `date` 一致。
- 此 `README.md` 文件因为不符合命名规则，不会被 Jekyll 识别为文章。
