# 首页响应式原型

入口：`homepage-prototype/index.html`

这个目录用于试做新首页，不会影响仓库根目录当前使用的 `index.html`。

## 内容约束

- 页面图片引用仓库已有的 `images/avatar1.png`、`assets/images/homepage/hero-calendar-desktop.jpg`、`assets/images/homepage/hero-calendar-mobile.jpg`，以及原型目录内的 `assets/project-visual-banner.png`。正式首页按 `760px` 断点切换横版与竖版背景。
- 文章标题、日期、标签、链接和简介取自仓库 `_posts/` 中的现有文章。
- 原型为单文件 HTML，样式和交互脚本都写在 `index.html` 中，便于直接调整。

## 当前范围

- 桌面端与移动端共用单份 HTML；`760px` 以下切换为独立的移动端编排。
- 左侧固定身份栏。
- 移动端将身份栏转换为紧凑顶栏，并提供可展开的导航菜单。
- 头像持续旋转。
- 青黑漫画裁切主视觉。
- 桌面主视觉使用 `2560 × 1440` 横版源图并裁掉底部黑色日历带。
- 移动端使用 `1290 × 2796` 竖版源图，裁掉左侧日期栏和顶部多余留白，并完全隐藏交互日历及其收起入口。
- 已移除主视觉标题框和“向下滚动”框，使用位于角色面部之外的透明毛玻璃日历。
- 日历从原先 `11%` 左移到 `clamp(48px, 7%, 96px)`，顶部控制区与主视觉同步定位，避免宽屏下继续向画面中心漂移。
- 日历根据浏览器当前年月动态生成，自动处理每月起始星期与 28、29、30、31 天。
- 日历内部右上角使用无底色的缩小符号进行隐藏；收起后在主视觉底部保留轻量玻璃条和“显示日历”按钮，展开状态通过浏览器本地存储记忆。
- 保留日历整体缩放与淡入淡出动效；毛玻璃效果放在参与缩放的外层组件上并保持预渲染，因此文字、边框与虚化背景会同步出现。
- 日历数字使用无衬线字体和等宽数字特性；独立示例仍保存在 `D:\Document\Design\glass-calendar-example\`。
- Wallpaper Engine 试验资源和相关时钟、频谱、花瓣脚本已经从本原型中移除。
- 真实最新文章索引。
- 移动端文章列表使用固定编号轨道，`02–05` 与标题、日期和摘要形成稳定的双列结构。
- 深浅主题使用“日蚀镜片”控件切换，圆盘遮罩和青色轨道同步旋转，并通过浏览器本地存储记忆选择。
- 已移除关于区域。
- 已将通过验收的响应式设计迁移到正式首页布局 `_layouts/homepage.html`；本目录继续保留为独立试验与设计归档。
- 正式首页额外保留原站的不蒜子 PV / UV 访问统计挂载点和 Giscus 留言板。

## 文章归档页试验

- 预览入口：`homepage-prototype/posts-antigravity.html`
- 视觉原稿：`homepage-prototype/designs/posts-antigravity-desktop-v1.png`
- 验证记录：`homepage-prototype/posts-antigravity-qa.md`
- 页面使用仓库现有文章标题、日期和链接，Canvas 粒子支持鼠标与触摸排斥交互。
- 通过验收的设计已迁移到正式 `posts/index.html`，本页继续作为静态设计原稿保留。

## 待整理计划

- `homepage-prototype/UNFINISHED-REFACTOR-PLAN.md` 已记录 2026-07-23 完成的布局拆分、公共组件抽取与遗留资源清理结果。
