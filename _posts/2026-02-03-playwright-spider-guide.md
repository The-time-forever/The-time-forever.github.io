---
layout: post
title: 用 Playwright 写爬虫：对抗反爬与动态渲染的实战指南
date: 2026-02-03
categories: [技术, Python]
tags: [爬虫, Playwright, 自动化]
---
# 用 Playwright 写爬虫：对抗反爬与动态渲染的实战指南

很多网站的内容早就不再是“请求一个 HTML 就完事”了：页面是前端框架渲染的、数据来自异步接口、列表需要滚动才加载，甚至还会针对无头浏览器、异常指纹、频繁访问做风控。这时用 `requests + bs4` 往往抓不到关键内容；而传统的 Selenium 又常常因为等待、定位、稳定性和调试成本而让人崩溃。

**Playwright** 是微软开源的浏览器自动化框架，它能像真实用户一样驱动 Chromium / Firefox / WebKit 浏览器：执行 JavaScript、等待页面渲染、处理登录与 Cookie、模拟滚动/点击、拦截网络请求、截图与录制 trace 复现问题。对爬虫来说，Playwright 的价值不只是“能打开网页”，而是能让你在动态渲染、复杂交互和一定程度的反爬环境下，依然稳定地拿到数据。

这篇文章会围绕“用 Playwright 做采集”展开，从最小可用脚本开始，逐步讲清楚：如何选择抓 DOM 还是抓接口、如何处理无限滚动与分页、如何保存登录态与复用会话、如何降低被封风险、以及如何把脚本整理成可维护的采集工程。目标是让你读完就能把代码套到自己的目标站点上。

## 环境部署与安装（Python 版本）

下面以 Windows/macOS/Linux 通用的方式介绍部署。建议使用虚拟环境，避免污染系统 Python。

### 1）创建虚拟环境并安装 Playwright

> 要求：Python 3.9+（越新越好）

```bash
# 进入你的项目目录
mkdir pw-crawler && cd pw-crawler

# 创建并激活虚拟环境（Windows PowerShell）
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# python3 -m venv .venv
# source .venv/bin/activate

# 安装 Playwright
pip install -U playwright
```

### 2）安装浏览器内核（必须）

```bash
# 安装所有内核（Chromium / Firefox / WebKit）
playwright install
# 只安装 Chromium（爬虫最常用，更轻量）
playwright install chromium
```

### 3）验证安装是否成功

新建 `smoke_test.py`：

```
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("https://example.com", wait_until="domcontentloaded")
    print(page.title())
    browser.close()
```

运行：

```
python smoke_test.py
```

**正常情况（示例）**：终端会打印出页面标题，然后程序退出。

```
Example Domain
```

### 4）调试与运行模式

```python
# 调试阶段：有头模式（能看到浏览器）+ 慢动作
browser = p.chromium.launch(headless=False, slow_mo=200)
# 正式跑采集：无头模式（服务器/CI 友好）
browser = p.chromium.launch(headless=True)
# 可选：打开 Playwright Inspector（适合调试定位/等待）
page = browser.new_page()
page.goto("https://example.com")
page.pause()
```

## Playwright 爬虫常用使用指南（速查表｜Python）

> 下面示例默认使用 `playwright.sync_api`（同步写法更适合入门与脚本采集）。  
> 若你用异步，把 `sync_playwright()` 换成 `async_playwright()`，并在调用前加 `await` 即可。

---

> 术语约定：  
> - **Browser**：浏览器进程（Chromium/Firefox/WebKit）  
> - **Context**：浏览器上下文（相当于一个“全新用户环境”，隔离 cookie/缓存）  
> - **Page**：一个标签页  
> - **Locator**：元素定位器（不是元素本身，而是“随时能找到元素的一种引用”）

---

### 1）基础对象怎么来：`sync_playwright()` / `browser` / `context` / `page`

- `sync_playwright()`  
  启动 Playwright 的运行环境（同步版入口）。你一般在 `with sync_playwright() as p:` 里拿到 `p`。

- `p.chromium / p.firefox / p.webkit`  
  选择要驱动的浏览器内核。爬虫常用 `chromium`。

- `browser = p.chromium.launch(...)`  
  启动浏览器进程。  
  - `headless=True/False`：无头/有头  
  - `slow_mo=...`：慢放（调试用）  
  - `proxy=...`：代理

- `context = browser.new_context(...)`  
  新建一个“干净的用户环境”。爬虫里非常重要：  
  - 你要做“多账号/多任务隔离”，就用多个 context  
  - 你要复用登录态，就用 `storage_state`（见下）

- `page = context.new_page()` 或 `browser.new_page()`  
  打开一个标签页。  
  推荐用 `context.new_page()`（更可控、更工程化）。

---

### 2）打开网页与页面状态：`page.goto()` / `wait_until`

- `page.goto(url, wait_until=...)`  
  访问 URL，并等待到某个“页面状态”再返回。常见：
  - `domcontentloaded`：DOM 构建完成（爬虫最常用）
  - `load`：页面 `load` 事件触发（更慢）
  - `networkidle`：网络基本空闲（有的网站永远不会 idle，不建议默认）

- `page.url` / `page.title()` / `page.content()`  
  - `page.url`：当前地址  
  - `page.title()`：标题  
  - `page.content()`：当前页面 HTML（渲染后的 DOM 字符串）

---

### 3）核心：`locator()` 是什么？为什么它是爬虫/自动化的关键

- `page.locator(selector)`  
  创建一个 **Locator**（定位器），意思是：  
  > “按这个 selector 去找元素（可能是 0 个、1 个、很多个），并且在你真正执行动作时再去匹配、自动等待元素可用。”

  Locator 的特点：
  - 不是一次性取到“静态元素”，而是“可重复定位”
  - 点击/取文本时会自动等元素出现、可见、可交互（比手写 sleep 稳）

- `locator.first / locator.nth(i) / locator.last`  
  当匹配到多个元素时取第一个/第 i 个/最后一个。

- `locator.count()`  
  返回匹配数量（用于判断列表是否加载出来、是否翻页成功）。

---

### 4）抓数据：文本 / 属性 / HTML

- `locator.inner_text()`  
  取 **可见文本**（更贴近你在浏览器看到的内容）。

- `locator.text_content()`  
  取 **节点文本内容**（可能包含不可见部分、格式差异更大）。

- `locator.get_attribute(name)`  
  取属性值（例如 `href`、`src`、`data-*`）。

- `locator.inner_html()` / `locator.evaluate(...)`  
  - `inner_html()`：取元素内部 HTML  
  - `evaluate`：在浏览器里执行 JS 来取更复杂的数据（爬虫里很常用，但要慎用，尽量先用上面的简洁 API）。

---

### 5）交互（爬虫也常用）：点击 / 输入 / 键盘鼠标

- `locator.click()` / `page.click(...)`  
  点击元素。推荐 `locator.click()`（更稳、更易组合等待）。

- `locator.fill(text)`  
  填输入框（清空后输入）。

- `locator.type(text, delay=...)`  
  模拟逐字输入（更像人类，偶尔对反爬/前端校验更友好）。

- `page.keyboard.press("Enter")`  
  键盘按键。常用：回车提交、ESC 关闭弹窗等。

- `page.mouse.wheel(dx, dy)`  
  滚动（列表懒加载常用）。

---

### 6）等待（避免 sleep）：等元素 / 等 URL / 等响应

- `locator.wait_for()`  
  等这个元素满足条件（默认等到出现在 DOM 并可用）。  
  爬虫里：列表懒加载、点击后等待详情区域出现，都用它。

- `page.wait_for_url(pattern)`  
  等地址变成某种形式（翻页/跳转后确认到位）。

- `page.wait_for_response(predicate)`  
  等某个网络响应（抓接口 JSON 时非常关键）。  
  你可以按 URL 关键字、状态码筛选。

- `page.wait_for_timeout(ms)`  
  强制等待（最后兜底，不建议常用）。

---

### 7）网络相关：监听 / 拦截（抓接口、提速）

- `page.on("request", handler)` / `page.on("response", handler)`  
  监听请求与响应。常用于：
  - 调试：找出目标接口 URL
  - 采集：拿到某个接口返回的 JSON

- `page.route(pattern, handler)`  
  拦截网络请求并决定放行/终止/改写。常用于：
  - 屏蔽图片/字体/视频提速
  - 对某些接口做 mock（测试常见，爬虫偶尔也用）

---

### 8）会话与登录态：`storage_state`

- `context.storage_state(path=...)`  
  把当前 context 的 cookie/localStorage 等状态保存到文件。

- `browser.new_context(storage_state=...)`  
  新建 context 时直接加载登录态（爬虫里特别常用：避免每次都登录）。

---

### 9）调试与排错：截图 / 保存 HTML / Trace

- `page.screenshot(...)`  
  保存截图（失败时第一证据）。

- `page.content()`  
  保存渲染后的 HTML（对照选择器很有用）。

- `context.tracing.start(...)` / `context.tracing.stop(...)`  
  录制 trace（可回放脚本每一步发生了什么，定位 flaky/反爬拦截非常强）。

---

### 10）常见“关系图”（帮新手建立心智模型）

- 你写爬虫基本就是这条链：
  - `p`（Playwright 引擎）→ `browser`（浏览器）→ `context`（隔离会话）→ `page`（标签页）→ `locator`（定位元素）→ 读取/交互/等待

> 官方文档链接：[Playwright Docs](https://playwright.dev/docs/intro)

> 动画演示链接（个人制作）：https://playwrightdemo.onrender.com
