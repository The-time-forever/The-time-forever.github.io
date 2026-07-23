# 图片资源说明

正式站点的图片按页面职责存放：

- `images/`：头像、favicon 和文章正文长期使用的通用图片。
- `assets/images/homepage/`：正式首页的 Hero 与专题视觉资源。
- `homepage-prototype/assets/`：仅供设计原稿与演示页使用，不应被正式布局引用。

## 常用修改入口

- 首页结构：`_layouts/homepage.html`
- 首页样式：`assets/css/homepage.css`
- 首页交互：`assets/js/homepage.js`
- 文章列表：`posts/index.html`、`assets/css/posts-archive.css`、`assets/js/posts-archive.js`
- 文章详情：`_layouts/post.html`、`assets/css/blog.css`、`assets/css/post.css`

替换首页图片时，请保持文件用途和宽高比稳定，或同步调整
`assets/css/homepage.css` 中对应容器的 `object-fit`、`object-position`。
