# 2026 年 1—10 月官方月历下载核查

核查日期：2026-10-16。20 张文件均由国服公告提供的米哈游网盘链接下载；使用新建匿名会话、公告公开密码与标准分享下载流程。每张文件都检查了目录标注字节数、完整图片解码、尺寸和 SHA-256。

## 逐月结果

下表的发布日期采用官方 API 的 `dtStartTime`（北京时间）。10 月记录为 10 月 2 日，公告创建时间为 10 月 1 日；8 月记录为 8 月 2 日。程序按实际发布日期读取，标题用于确定资源年月。所有公告标题均为 `《绝区零》2026年M月月历壁纸`。

| 月份 | 官方发布日期 | 公告 | 原始分享链接 | 电脑版文件 | 手机版文件 | 下载结果 |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-01 | 2026-01-01 17:00:00 | [官方公告](https://zzz.mihoyo.com/news/161895) | [网盘](https://minas.mihoyo.com/d/9bc8fbeeb4f64562bc08/) | 1月月历壁纸_PC版.png | 1月月历壁纸_手机版.png | 2/2 成功 |
| 2026-02 | 2026-02-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/162469) | [网盘](https://minas.mihoyo.com/d/e0ef9064b6b94bb897f7/) | 2月月历壁纸_PC版.png | 2月月历壁纸_手机版.png | 2/2 成功 |
| 2026-03 | 2026-03-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/162984) | [网盘](https://minas.mihoyo.com/d/43287cf704aa4648be14/) | 3月月历壁纸_PC版.jpg | 3月月历壁纸_手机版.jpg | 2/2 成功 |
| 2026-04 | 2026-04-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/163366) | [网盘](https://minas.mihoyo.com/d/1ef6ccac23fd4fb9b096/) | 4月月历壁纸_PC版.png | 4月月历壁纸_手机版.png | 2/2 成功 |
| 2026-05 | 2026-05-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/163820) | [网盘](https://minas.mihoyo.com/d/c014aceea95e4b348e28/) | 5月月历壁纸_PC版.png | 5月月历壁纸_手机版.png | 2/2 成功 |
| 2026-06 | 2026-06-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/164439) | [网盘](https://minas.mihoyo.com/d/b9fba8cedfd94bbbb987/) | 6月月历壁纸_PC版.png | 6月月历壁纸_手机版.png | 2/2 成功 |
| 2026-07 | 2026-07-01 12:00:00 | [官方公告](https://zzz.mihoyo.com/news/165104) | [网盘](https://minas.mihoyo.com/d/612e569d59c14472a2d4/) | 7月月历壁纸_PC版.jpg | 7月月历壁纸_手机版.jpg | 2/2 成功 |
| 2026-08 | 2026-08-02 12:00:00 | [官方公告](https://zzz.mihoyo.com/news/165489) | [网盘](https://minas.mihoyo.com/d/bbef691d98a44fbe963b/) | 8月月历壁纸_PC版.jpg | 8月月历壁纸_手机版.jpg | 2/2 成功 |
| 2026-09 | 2026-09-01 12:30:00 | [官方公告](https://zzz.mihoyo.com/news/165954) | [网盘](https://minas.mihoyo.com/d/18cf62a3dcef41caa129/) | 9月月历壁纸_PC版.jpg | 9月月历壁纸_手机版.jpg | 2/2 成功 |
| 2026-10 | 2026-10-02 12:00:00 | [官方公告](https://zzz.mihoyo.com/news/166576) | [网盘](https://minas.mihoyo.com/d/182a14ec7db34be38f0f/) | 10月月历壁纸_PC版.png | 10月月历壁纸_手机版.png | 2/2 成功 |

所有月份的电脑版为 **2560×1440**，手机版为 **1290×2796**。1、2、4、5、6、10 月原图为 PNG；3、7、8、9 月原图为 JPEG。所有月份都需要公告提供的公开提取密码 `zzz2026bz`；核查期间均无需账户登录、验证码或人工操作。

完整的文件大小、分辨率、格式、SHA-256、公告创建时间及下载入口见 [机器可读记录](calendar-history-2026.json)。历史图片保存在本地忽略目录 `.astro/calendar-research/`，未加入 Git。

## 已验证的下载链路

1. 官网 JavaScript `https://zzz.mihoyo.com/_nuxt/d6e69e2.js` 中声明国服内容 API 和频道编号。
2. 请求 `https://api-takumi-static.mihoyo.com/content_v2_user/app/706fd13a87294881/getContentList`，参数为 `iChanId=273&iPageSize=100&iPage=1&sLangKey=zh-cn`；按页向过去查找。273 为全部频道。仅使用 278 新闻频道会漏掉 2026 年 1 月公告。
3. 使用标题精确匹配目标年、月，同时检查 `dtStartTime`，读取 `sContent` 的真实分享链接及密码。
4. GET 公告的 `/d/<share-token>/`，获取 CSRF 隐藏字段与当前匿名会话 Cookie。
5. POST 同一表单，发送 `csrfmiddlewaretoken`、`token`、`password`，Referer 为分享页。
6. GET `/api/v2.1/share-links/<share-token>/dirents/?path=%2F` 获得目录。这是分享页官方 `commons.c80d4f22.js` 中 `listSharedDir` 使用的接口。
7. 分享页 `sharedDirView.4bd55c97.js` 为每个文件生成 `/d/<share-token>/files/?p=<encoded-file-path>&dl=1`。GET 此入口会跳转到 `https://minas.mihoyo.com/seafhttp/files/<临时下载标识>/<文件名>` 并返回原图。

最终资源地址中的临时下载标识由服务端按请求生成。JSON 保留地址结构及真实文件名；完整临时地址仅留在本地研究记录中。生产程序每次重新取得下载地址，不复用过期地址，也不保存会话 Cookie 或 CSRF。

## 其他官方渠道

- 国际服官网 `zenless.hoyoverse.com` 的前端声明了 `https://sg-public-api-static.hoyoverse.com/content_v2_user/app/3e9196a4b9274bd7`。本次读取该接口并核对 2026 年 1—3 月公告。
- [国际服 1 月公告](https://zenless.hoyoverse.com/m/en-us/news/161810)提供 `https://hoyo.link/ezvnRQTN6`；[国际服 10 月公告](https://zenless.hoyoverse.com/m/zh-tw/news/166535)提供繁体版本链接。
- 10 月英文官方分享 `https://hoyo.link/pG361KHXb` 经 HTTP 实测跳转至公开 Google Drive 文件夹 `https://drive.google.com/drive/folders/1YZKqEWdMJtG23y4_U9ZL4OSRpAHVopQx`，文件夹 HTML 可匿名读取。该渠道本次验证到文件夹访问；生产程序采用已完成 20 张原图下载验证的国服渠道。
- 官方公告内的 `fastcdn.mihoyo.com` 展示图含缩略尺寸。生产程序仅采用网盘原图；搜索摘要和第三方转载均未作为下载凭据。

## 变化时的行为

生产程序限制为已验证的国服 API 和 Minas 主机；目录改名、目录嵌套、分享失效、验证码或新下载主机都会停止更新并在 Actions Summary 中报告。未来年份优先读取该年公告自身的密码，无硬编码年份密码。
