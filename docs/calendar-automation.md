# 首页《绝区零》月历自动更新

系统使用国服官方公告与米哈游网盘原图。每月 1—10 日北京时间约 10:17 检查，成功后更新桌面图、手机图和来源元数据，构建通过后提交到 `main`，再显式触发 GitHub Pages 部署。

历史验证结果见 [2026 年 1—10 月核查报告](calendar-history-2026.md)与 [逐文件记录](calendar-history-2026.json)。

## 本地使用

需要 Python 3.12+、Node.js 24 与仓库锁定的 npm 依赖。在仓库根目录运行：

```powershell
python -m pip install -r scripts/requirements-calendar.txt
npm ci

# 当前北京时间对应的年月，替换后验证构建
python scripts/update_calendar.py --build

# 指定月份
python scripts/update_calendar.py --year 2026 --month 10 --build

# 真实下载与解码验证，保持首页图片及元数据不变
python scripts/update_calendar.py --year 2026 --month 10 --dry-run

# 重新下载已更新月份，检查官方是否替换了源文件
python scripts/update_calendar.py --year 2026 --month 10 --force --build
```

`--year` 与 `--month` 应同时填写。`--timeout` 设置每个请求的超时秒数，默认 40、最大 120。`--build` 会调用 `npm run build`，失败时恢复两张旧图及元数据；更新工作流始终启用它。本地省略此参数时，程序只验证下载和图片。

保留以下固定路径，Astro `Image` 和 `getImage` 继续生成 WebP 与响应式尺寸，页面布局和 CSS 沿用现有实现：

```text
src/assets/images/homepage/hero-calendar-desktop.jpg
src/assets/images/homepage/hero-calendar-mobile.jpg
src/data/calendar.json
```

元数据记录成功更新年月、公告、分享入口、源图及 JPG 的 SHA-256。首页 `alt` 读取其中年月。初始记录保留现有七月图片的月份，年份留空；首次成功更新会补齐来源和校验值。

## 手动运行 Actions

打开仓库 **Actions → Update calendar wallpaper → Run workflow**，选择 `main`：

- `year`、`month` 都留空：使用北京时间当前年月。
- 同时填写 `year=2026`、`month=10`：运行历史月份更新。
- 勾选 `dry_run`：下载并验证，不提交、不部署。
- 勾选 `force`：忽略已成功更新的年月缓存，重新核验源图。

也可以使用 GitHub CLI：

```powershell
gh workflow run update-calendar.yml --ref main -f year=2026 -f month=10
gh run list --workflow update-calendar.yml --limit 5
```

每次运行在 Job Summary 显示状态、来源及图片尺寸和校验值。公告尚未发布时返回 `not-published` 并正常结束，后续检查继续重试。下载、解析、密码或图片验证失败时，任务失败并保留旧图；GitHub 可按账户的 Actions 通知设置发送失败通知。本版本使用 Summary 和 Actions 失败通知，不自动创建 Issue。

## 下载与更新保护

程序分页读取官方 `getContentList` 的全部频道（273），精确匹配标题中的年月，并核对发布时间。1 月公告在全部频道可见，单查新闻频道会遗漏。每次读取公告的真实分享链接与密码。

网盘下载使用正常密码表单、CSRF 和当次匿名会话 Cookie。无私人登录 Cookie，无验证码处理。分享链接必须出现在已核验的目标公告内；下载和跳转限制在已验证的官方主机。

目录内文件必须包含目标月份的月历标记与 PC/手机版本名称。两个版本各选一张，重复候选或缺失任一版本都会停止。电脑版至少 1920×1080、宽高比 1.5—2.1；手机版至少 1080×1920、宽高比 0.4—0.65。

每张下载最多 25 MiB、最多 3200 万像素。程序检查响应长度、目录声明大小、图片格式、完整解码与宽高比。支持 PNG/JPEG；压缩包不下载、不解包。已有 RGB JPEG 保留原字节；PNG 转为质量 95 的 JPG，保留原分辨率与构图。

网络错误与 HTTP 500/502/503/504 的 GET 请求最多重试一次；密码表单只提交一次。重试仍失败时结束当前任务，后续按日重试。

两张图均通过后才进入替换阶段。原图和元数据先备份到被 Git 忽略的 `.calendar-transaction/`；替换或构建异常会立即恢复。进程被强制终止时，下次运行先恢复上次事务。操作系统文件锁防止本地更新进程同时写入；Actions concurrency 防止工作流互相覆盖。

当前年月和文件 SHA-256 都匹配时直接跳过网络请求。强制重新核验后，若两张 JPG 都与现有文件一致，元数据也保持原样，避免因时间戳产生重复提交。

## GitHub Pages 部署链路

`update-calendar.yml` 仅在 `main` 运行，权限为 `contents: write` 和 `actions: write`。当前仓库未配置阻止机器人直推的分支规则。它只暂存两张图片和 `src/data/calendar.json`；执行测试、`npm ci` 与构建后，才提交并推送。遇到并发推送会正常拒绝，不使用强制推送。

默认 `GITHUB_TOKEN` 的代码推送不会触发普通 push 工作流，因此更新成功后调用现有 `deploy.yml` 的 `workflow_dispatch`。调用时传入已提交的 SHA，部署构建明确检出该 SHA。`deploy.yml` 已允许在 `main` 上的 push 和手动触发执行 Pages 发布，PR 继续只构建。

同一 SHA 已有成功或进行中的部署时，更新工作流跳过重复部署。若提交成功后部署触发中断，下次运行即使判定 `already-updated`，也会检查该 SHA 并补发部署。Pages 发布失败可直接重跑部署工作流：

```powershell
gh workflow run deploy.yml --ref main
```

初次安装需要把工作流提交到默认分支，定时任务才会由 GitHub 调度。手动运行验证与定时运行使用同一 job；实际定时触发时间由 GitHub 排队情况决定。

## 人工补充与排障

| 状态或症状 | 处理方法 |
| --- | --- |
| `not-published` | 检查目标年月，等待官方发布，次日继续 |
| HTTP 错误、超时 | 重跑；检查官方公告和网盘是否正常开放 |
| 密码错误 | 对照公告更新密码；可通过环境变量提供公开提取密码 |
| 目录改名、嵌套、重复候选 | 查看官方目录，更新 `select_pair` 的明确规则，再执行 dry-run |
| 来源要求验证码或登录 | 暂停更新，保留现有壁纸，人工核查官方其他公开分享 |
| 图片格式、尺寸或解码错误 | 核查源图；修正规则前保持旧图 |
| 构建失败 | 先修复构建；本地启用 `--build` 会恢复旧图 |
| Git 推送被拒绝 | 拉取最新 `main` 后重跑；若启用分支保护，改造提交步骤为 PR 并走审核 |
| Pages 失败 | 查看 Deploy to GitHub Pages 的任务日志并重跑 |

备用参数示例：

```powershell
$env:CALENDAR_SHARE_PASSWORD = '公告中的公开提取密码'
python scripts/update_calendar.py --year 2026 --month 10 --dry-run `
  --announcement-url https://zzz.mihoyo.com/news/166576 `
  --share-url https://minas.mihoyo.com/d/182a14ec7db34be38f0f/
Remove-Item Env:CALENDAR_SHARE_PASSWORD
```

`--announcement-url` 用于限定官方列表中的公告，`--share-url` 用于选择该公告实际包含的分享入口。官网 API 整体不可用时，先人工取得官方原图，再核验月份和 PC/手机版本；恢复 API 后用正常命令完成带来源记录的更新。修改主机白名单或下载规则前，先重复真实下载实验。

跨年时从新公告读取密码，无需猜测 `zzz2027bz` 等新密码。官方 API 的应用 ID、频道编号或网盘结构变化时，先检查官网和分享页实际网络流程，再修改 `API`、发现逻辑或网盘解析；国际服 Google Drive 路径目前保留为人工评估的备用来源。

## 测试与复核

```powershell
python -m unittest discover -s scripts/tests -v
python scripts/verify_calendar_history.py --year 2026 --through-month 10 `
  --output .astro/calendar-research/replay.json
```

历史复核会重新下载各目标月份并验证两张图，输出逐月结果，最后检查现有两张首页图和元数据的字节校验值未变。请在没有其他更新进程改写图片时运行。

测试与部署的实际执行记录见 [验收记录](calendar-validation.md)。
