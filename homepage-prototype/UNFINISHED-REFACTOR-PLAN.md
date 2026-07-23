# 仓库前端去冗余与模块化计划

> 审计日期：2026-07-23
>
> 状态：已完成（2026-07-23）
> 原则：先记录现状和边界，再分阶段实施；保持首页、文章列表、文章详情现有视觉与功能，不把原型目录当作正式资源目录。

## 一、当前仓库审计

### 1. 正式入口与布局

| 页面 | 当前入口 | 主要问题 |
| --- | --- | --- |
| 首页 | `index.html` → `_layouts/homepage.html` | 布局约 1671 行，CSS 和交互脚本全部内联；正式页面引用 `homepage-prototype/assets/` |
| 文章列表 | `posts/index.html` | 约 756 行，结构、CSS、筛选、主题、粒子全部在单文件内 |
| 文章详情 | `_layouts/post.html` | 页面专属 CSS 仍内联；主题、粒子、统计和 Giscus 加载逻辑散落 |
| 旧首页 | `_layouts/default.html` | 约 1034 行；全仓库未发现任何 `layout: default` 引用 |
| 旧根入口 | `index.md` | 无 Front Matter，仅含一个标题；当前首页已由 `index.html` 接管 |

### 2. 已确认的重复实现

- 首页、文章列表、文章详情分别实现了首屏主题初始化和主题切换。
- 首页、文章列表、文章详情分别加载或渲染不蒜子访问统计。
- 首页留言与文章评论分别内嵌 Giscus 配置，仓库与主题参数重复。
- 文章列表内联粒子效果，文章详情使用 `assets/js/space-particles.js`，两者视觉目标一致但维护位置不同。
- 首页、文章列表均在模板内维护大段页面级 CSS 和 JavaScript。
- `_layouts/default.html` 保留了一套已废弃的首页、统计与评论实现。
- `images/README.md` 仍要求修改已废弃的 `_layouts/default.html`。

### 3. 资源职责混乱

- 正式首页依赖：
  - `homepage-prototype/assets/hero-bgz1-above-wave.jpg`（已由新版横竖背景替换并删除）
  - `homepage-prototype/assets/project-visual-banner.png`
- `homepage-prototype/` 应只保存设计原稿、演示页和测试资源，不应成为生产静态资源目录。
- `assets/js/mermaid.min.js` 与 `assets/js/mathjax.js` 虽然体积较大，但文章页按内容条件加载，属于功能依赖，不判定为冗余。

### 4. 不应直接删除的内容

- `homepage-prototype/`：保留为设计实验区，正式站点与它解耦。
- `about/`、`intro-animation/`：初次重构时暂缓处理；后续经用户确认均为不再需要的孤立页面/实验，已删除。
- 桌面端和移动端的重复导航：仅在确认没有可用性价值后精简。
- 不蒜子统计元素 ID、Giscus 仓库信息、文章 Front Matter、数学公式和 Mermaid 支持。

## 二、目标结构

```text
_includes/
  theme-init.html          # 首屏无闪烁主题初始化
  site-stats.html          # 不蒜子脚本和 PV/UV 结构
  giscus-comments.html     # 文章评论公共配置

assets/
  css/
    site-tokens.css        # 三类正式页面共享色彩与基础变量
    homepage.css           # 首页页面样式
    posts-archive.css      # 文章列表样式
    blog.css               # 文章阅读骨架
    post.css               # 文章详情专属样式
  js/
    theme-toggle.js        # 统一主题状态、记忆和 Giscus 同步
    particle-field.js      # 文章列表与详情共享粒子实现
    homepage.js            # 首页交互
    posts-archive.js       # 搜索、分类、年份等列表交互
  images/
    homepage/              # 正式首页资源

_layouts/
  homepage.html            # 只保留首页结构与 Liquid
  post.html                # 只保留文章结构与必要条件加载

posts/index.html           # 只保留文章列表结构与 Liquid
```

## 三、执行阶段

### 阶段 A：建立公共基础

1. 新建共享主题变量与首屏主题初始化 include。
2. 统一 `theme` localStorage 键和系统主题回退行为。
3. 抽取不蒜子统计 include，保留 `busuanzi_value_site_pv` 与 `busuanzi_value_site_uv`。
4. 抽取文章 Giscus include；首页留言保留按需打开，但共享同一套主题同步接口。

验收：深浅主题刷新后无跳变；PV/UV DOM ID 不变；评论随主题同步。

### 阶段 B：拆分正式页面

1. `_layouts/homepage.html` 的 CSS 移至 `assets/css/homepage.css`，交互移至 `assets/js/homepage.js`。
2. `posts/index.html` 的 CSS 移至 `assets/css/posts-archive.css`，交互移至 `assets/js/posts-archive.js`。
3. `_layouts/post.html` 的页面专属内联 CSS 移至 `assets/css/post.css`。
4. 文章列表和文章详情共用 `assets/js/particle-field.js`。

验收：三个正式入口不再包含大段页面级 `<style>` 或业务脚本；搜索、筛选、日历、留言、主题和粒子行为保持一致。

### 阶段 C：资源与旧实现清理

1. 将两张正式首页图片迁移到 `assets/images/homepage/`，同时更新正式页与原型页引用。
2. 删除无引用的 `_layouts/default.html`。
3. 删除无效根入口 `index.md`。
4. 删除被新模块替代且已无引用的旧脚本。
5. 更新 `images/README.md`，明确正式首页、文章列表、文章详情的修改入口。

验收：`rg` 不再发现正式页面引用 `homepage-prototype/assets/`；不存在 `layout: default` 或旧脚本引用；文档与代码一致。

### 阶段 D：回归与冗余复查

1. 运行 Jekyll 构建。
2. 检查首页、文章列表、文章详情的桌面与移动端。
3. 检查浅色、深色、刷新记忆、侧栏导航、列表搜索和分类。
4. 检查不蒜子统计、首页留言、文章 Giscus、数学公式与 Mermaid 条件加载。
5. 重新统计内联样式、脚本和无引用文件，记录仍保留内容的理由。

## 四、删除与兼容约束

- 所有删除项必须先通过全仓库引用检查；Git 历史可恢复。
- 不修改文章 URL、Front Matter 或文章正文。
- 不移除访问统计的元素 ID。
- 不将演示页的功能反向依赖到正式页面。
- 不以“大文件”为理由删除 MathJax、Mermaid 等已被条件引用的供应商资源。
- 每完成一个阶段即构建验证，发生回归时只回退该阶段。

## 五、完成判定

- 正式页面不再依赖 `homepage-prototype/`。
- 首页、文章列表、文章详情的 CSS 与 JavaScript 均从模板结构中拆出。
- 主题、粒子、统计和评论配置只保留一个明确的公共实现或公共入口。
- 无引用旧首页和无效根入口已清理。
- 桌面端、移动端、浅色、深色均通过视觉和交互回归。

## 六、执行结果

- `_layouts/homepage.html`：约 1671 行降至 194 行。
- `posts/index.html`：约 756 行降至 127 行。
- `_layouts/post.html`：约 532 行降至 106 行。
- 新增公共 includes：主题初始化、不蒜子加载、站点统计、Giscus、MathJax 配置。
- 新增页面模块：`homepage.css/js`、`posts-archive.css/js`、`post.css`。
- 文章列表与详情已统一使用 `particle-field.js`；主题统一由 `theme-toggle.js` 管理。
- Mermaid 配置与转换逻辑已移至 `mermaid-renderer.js`，并继续按文章内容条件加载。
- 正式首页图片已复制到 `assets/images/homepage/`，正式页面不再依赖原型目录。
- 已删除无引用的 `_layouts/default.html`、根目录 `index.md`、旧 intro CSS/JS。
- 已删除 `images/` 下 16 个零引用的旧轮播、壁纸、头像和备份文件；保留当前头像、favicon 与原型裁切源 `bgz1.jpg`。
- Jekyll 构建通过；桌面与 390px 移动端的首页、文章列表、文章详情通过视觉回归。
- Git 指南文章的 23 个 Mermaid 图均由新模块成功渲染，浏览器控制台无错误。
- 2026-07-23：首页背景更新为规范命名的横版 `hero-calendar-desktop.jpg` 与竖版 `hero-calendar-mobile.jpg`；桌面裁掉底部日历带，移动端裁掉左侧日期栏。
- 2026-07-23：删除无正式入口引用的 `about/` 与 `intro-animation/`；移动端改为纵向完整显示竖图，仅裁左侧日期栏。
- 2026-07-23：日历模块新增背景视觉密度检测；月份大数字偏左时，日历及收起按钮自动镜像到右侧，反之亦然。
- 2026-07-23：删除零引用的 `mobile-images/`（12 个旧资源，约 32 MiB）；保留文章仍在使用的 `post-images/`。
