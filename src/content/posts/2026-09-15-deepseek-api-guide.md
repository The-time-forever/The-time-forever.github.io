---
title: "DeepSeek API 接入指南：Claude Code与Codex"
date: 2026-09-15
author: Adam
description: "Claude Code 与 Codex 接入 DeepSeek API 的完整专题指南，覆盖安装、配置、推理档位，以及 Git 和 Node.js 环境准备。"
permalink: /posts/2026/09/15/deepseek-api-guide/
categories: [技术折腾]
tags: [DeepSeek, Claude Code, Codex, API]
tabs: true
---

本文汇总了 Claude Code 与 Codex 接入 DeepSeek API 的完整流程。

<div class="tab-group" data-tabs data-os-root data-os="windows">

<div class="os-switch" data-os-switch>
<span class="os-switch-label">系统</span>
<button class="os-switch-btn" type="button" data-os-target="windows" aria-pressed="true">Windows</button>
<button class="os-switch-btn" type="button" data-os-target="macos" aria-pressed="false">macOS</button>
</div>

<div class="tab-list" role="tablist" aria-label="DeepSeek API 接入指南">
<button class="tab-btn" id="tab-btn-prereq" type="button" role="tab" aria-selected="true" aria-controls="tab-panel-prereq" data-tab="prereq">前置准备</button>
<button class="tab-btn" id="tab-btn-config" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="tab-panel-config" data-tab="config">配置</button>
</div>

<div class="tab-panel" id="tab-panel-prereq" role="tabpanel" aria-labelledby="tab-btn-prereq">

<div class="tab-group" data-tabs>

<div class="tab-list" role="tablist" aria-label="前置准备">
<button class="tab-btn" id="tab-btn-prereq-git" type="button" role="tab" aria-selected="true" aria-controls="tab-panel-prereq-git" data-tab="prereq-git">Git</button>
<button class="tab-btn" id="tab-btn-prereq-node" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="tab-panel-prereq-node" data-tab="prereq-node">Node.js</button>
<button class="tab-btn" id="tab-btn-prereq-claude" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="tab-panel-prereq-claude" data-tab="prereq-claude">Claude Code</button>
<button class="tab-btn" id="tab-btn-prereq-codex" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="tab-panel-prereq-codex" data-tab="prereq-codex">Codex</button>
</div>

<div class="tab-panel" id="tab-panel-prereq-git" role="tabpanel" aria-labelledby="tab-btn-prereq-git">

<div class="os-windows">

<blockquote><p>Git 是开发环境中最常用的版本控制工具。Windows 上安装 Claude Code、Codex CLI，以及日常使用 GitHub 时，通常都会用到 Git。</p></blockquote>

<h2 id="一-推荐方式-使用-git-官方安装包">一、推荐方式：使用 Git 官方安装包</h2>
<p>打开 Git 官方 Windows 下载页面：<a href="https://git-scm.com/download/win" target="_blank" rel="noopener noreferrer">Git for Windows 官方下载</a>。进入页面后，通常会自动下载 64 位 Windows 安装包，文件名类似：</p>

```
Git-2.xx.x-64-bit.exe
```

<p>下载完成后双击安装。</p>

<h2 id="二-安装时怎么选择">二、安装时怎么选择</h2>
<p>大部分选项保持默认、一路点击 <strong>Next</strong> 就可以。下面几个页面值得特别注意。</p>

<h3 id="1-默认编辑器">1. 默认编辑器</h3>
<p>当安装程序出现 <strong>Choosing the default editor used by Git</strong> 时，如果平时使用 VS Code，建议选择：</p>

```
Use Visual Studio Code as Git's default editor
```

<p>这样以后 Git 需要打开提交信息、合并说明等文本时，会优先调用 VS Code。</p>

<h3 id="2-默认分支名称">2. 默认分支名称</h3>
<p>在 <strong>Adjusting the name of the initial branch in new repositories</strong> 页面，建议选择：</p>

```
Override the default branch name for new repositories
```

<p>并填写：</p>

```
main
```

<p>这样以后执行 <code>git init</code> 创建的新仓库，默认分支就是目前更常见的 <code>main</code>。</p>

<h3 id="3-path-环境变量">3. PATH 环境变量</h3>
<p>在 <strong>Adjusting your PATH environment</strong> 页面，推荐保持默认：</p>

```
Git from the command line and also from 3rd-party software
```

<p>这意味着 Git 不仅可以在 Git Bash 中使用，也可以直接在 PowerShell、CMD、Windows Terminal、VS Code 等软件里调用。</p>

<h3 id="4-ssh-工具">4. SSH 工具</h3>
<p>在 <strong>Choosing the SSH executable</strong> 页面，推荐：</p>

```
Use bundled OpenSSH
```

<p>Git 会使用自带的 OpenSSH，配置 GitHub SSH Key 时比较省事。</p>

<h3 id="5-https-后端">5. HTTPS 后端</h3>
<p>在 <strong>Choosing HTTPS transport backend</strong> 页面，推荐保持默认：</p>

```
Use the OpenSSL library
```

<h3 id="6-换行符设置">6. 换行符设置</h3>
<p>在 <strong>Configuring the line ending conversions</strong> 页面，Windows 用户一般保持默认：</p>

```
Checkout Windows-style, commit Unix-style line endings
```

<p>其余选项如果没有特殊需求，可以继续保持默认直到安装完成。</p>

<h2 id="三-确认-git-是否安装成功">三、确认 Git 是否安装成功</h2>
<p>安装完成后，重新打开一个终端。可以使用：</p>
<ul><li>PowerShell</li><li>CMD</li><li>Windows Terminal</li><li>Git Bash</li><li>VS Code 内置终端</li></ul>
<p>输入：</p>

```bash
git --version
```

<p>如果看到类似：</p>

```
git version 2.51.0.windows.1
```

<p>说明 Git 已经安装成功。</p>
<blockquote><p>如果提示 <code>git</code> 不是内部或外部命令，先完全关闭当前终端并重新打开。因为安装程序修改 PATH 后，已经打开的终端通常不会立即读取新的环境变量。</p></blockquote>

<h2 id="四-配置-git-用户信息">四、配置 Git 用户信息</h2>
<p>第一次安装 Git 后，建议立即配置用户名和邮箱。</p>
<h3 id="配置用户名-git-windows">配置用户名</h3>

```bash
git config --global user.name "你的名字或 GitHub 用户名"
```

<p>例如：</p>

```bash
git config --global user.name "Adam"
```

<h3 id="配置邮箱-git-windows">配置邮箱</h3>

```bash
git config --global user.email "你的邮箱"
```

<p>例如：</p>

```bash
git config --global user.email "example@gmail.com"
```

<p>这里的用户名和邮箱会写入之后创建的 Git Commit 中。</p>
<h3 id="查看当前全局配置">查看当前全局配置</h3>

```bash
git config --global --list
```

<p>正常情况下可以看到类似：</p>

```
user.name=Adam
user.email=example@gmail.com
```

<h2 id="五-更快的方法-使用-winget-安装">五、更快的方法：使用 winget 安装</h2>
<p>如果系统是较新的 Windows 10 / Windows 11，并且已经安装 <code>winget</code>，也可以直接打开 PowerShell 执行：</p>

```powershell
winget install --id Git.Git -e
```

<p>安装结束后，关闭并重新打开终端，然后执行：</p>

```bash
git --version
```

<p>确认是否安装成功。</p>



<h2 id="常用命令速查-git-windows">常用命令速查</h2>

```bash
# 查看 Git 版本
git --version

# 设置全局用户名
git config --global user.name "你的名字"

# 设置全局邮箱
git config --global user.email "你的邮箱"

# 查看全局配置
git config --global --list

# 查看 Git 帮助
git --help
```

</div>

<div class="os-macos">

<blockquote><p>macOS 通常可以很方便地安装 Git。最常见的方式有三种：<strong>Xcode Command Line Tools、Homebrew、Git 官方安装包</strong>。如果你只是需要 Git 来使用 GitHub、Claude Code、Codex 或日常开发，优先推荐前两种。</p></blockquote>

<h2 id="一-先打开终端-terminal">一、先打开终端 Terminal</h2>
<p>在 Mac 上可以通过以下方式打开终端：</p>
<ul><li>按 <code>Command + Space</code> 打开 Spotlight</li><li>输入 <code>Terminal</code></li><li>回车打开</li></ul>
<p>也可以进入：</p>

```
访达 → 应用程序 → 实用工具 → 终端
```

<p>后面的 Git 安装与配置命令都可以在 Terminal 中执行。</p>

<h2 id="二-先检查-mac-是否已经安装-git">二、先检查 Mac 是否已经安装 Git</h2>
<p>在终端输入：</p>

```bash
git --version
```

<p>如果已经安装，会看到类似：</p>

```
git version 2.x.x
```

<p>这说明 Git 已经可以使用，不需要重复安装。如果系统提示需要安装开发者工具，或者找不到 Git，可以继续下面的安装步骤。</p>

<h2 id="三-方法一-通过-xcode-command-line-tools-安装">三、方法一：通过 Xcode Command Line Tools 安装</h2>
<p>这是 macOS 上最省事的安装方式之一。在终端执行：</p>

```bash
xcode-select --install
```

<p>系统会弹出安装窗口，点击 <strong>安装</strong> 并等待完成即可。安装完成后重新执行：</p>

```bash
git --version
```

<p>如果能够输出版本号，说明 Git 已经安装成功。</p>
<blockquote><p>对于只需要 Git、SSH、编译工具和基础开发环境的用户，安装 Command Line Tools 即可，不需要下载完整的 Xcode。</p></blockquote>

<h2 id="四-方法二-使用-homebrew-安装-git">四、方法二：使用 Homebrew 安装 Git</h2>
<p>如果你平时会在 Mac 上开发，推荐安装 Homebrew 后用它管理 Git 和其他命令行工具。</p>
<h3 id="1-检查是否已经安装-homebrew">1. 检查是否已经安装 Homebrew</h3>

```bash
brew --version
```

<p>如果能看到版本号，说明 Homebrew 已经存在，可以直接安装 Git。</p>
<h3 id="2-使用-homebrew-安装-git">2. 使用 Homebrew 安装 Git</h3>

```bash
brew install git
```

<p>安装完成后执行：</p>

```bash
git --version
```

<p>即可检查版本。</p>
<h3 id="3-apple-silicon-mac-的-homebrew-path">3. Apple Silicon Mac 的 Homebrew PATH</h3>
<p>对于 M1、M2、M3、M4 等 Apple Silicon Mac，Homebrew 通常安装在：</p>

```
/opt/homebrew
```

<p>如果安装完 Homebrew 后提示 <code>brew: command not found</code>，通常需要把 Homebrew 加入 shell 环境。常见命令为：</p>

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

<p>然后再次执行：</p>

```bash
brew --version
```

<p>确认是否生效。</p>
<blockquote><p>如果你以后还会安装 Node.js、Python、wget、ffmpeg 等开发工具，Homebrew 会非常方便。</p></blockquote>

<h2 id="五-方法三-git-官方安装包">五、方法三：Git 官方安装包</h2>
<p>也可以使用 Git 官方提供的 macOS 安装方式。打开 <a href="https://git-scm.com/download/mac" target="_blank" rel="noopener noreferrer">Git 官方下载页面</a>，根据页面提示选择适合 macOS 的安装方式即可。对于大多数开发者来说，Xcode Command Line Tools 或 Homebrew 通常更方便，因此一般不需要专门下载安装包。</p>

<h2 id="六-查看当前使用的是哪个-git">六、查看当前使用的是哪个 Git</h2>
<p>如果 Mac 中同时存在系统 Git 和 Homebrew Git，可以执行：</p>

```bash
which git
```

<p>可能看到：</p>

```
/usr/bin/git
```

<p>这通常是系统提供的 Git。Apple Silicon Mac 通过 Homebrew 安装后，则可能看到：</p>

```
/opt/homebrew/bin/git
```

<p>还可以结合：</p>

```bash
git --version
```

<p>判断当前实际使用的版本。</p>

<h2 id="七-配置-git-用户名和邮箱">七、配置 Git 用户名和邮箱</h2>
<p>Git 安装完成后，建议立即配置提交身份。</p>
<h3 id="配置用户名-git-macos">配置用户名</h3>

```bash
git config --global user.name "你的名字或 GitHub 用户名"
```

<p>例如：</p>

```bash
git config --global user.name "Adam"
```

<h3 id="配置邮箱-git-macos">配置邮箱</h3>

```bash
git config --global user.email "你的邮箱"
```

<p>例如：</p>

```bash
git config --global user.email "example@gmail.com"
```

<p>这些信息会写入之后创建的 Git Commit 中。</p>
<h3 id="查看全局配置">查看全局配置</h3>

```bash
git config --global --list
```

<p>正常情况下会看到类似：</p>

```
user.name=Adam
user.email=example@gmail.com
```

<h2 id="八-设置默认分支为-main">八、设置默认分支为 main</h2>
<p>建议将新仓库的默认分支统一设置为 <code>main</code>：</p>

```bash
git config --global init.defaultBranch main
```

<p>之后执行：</p>

```bash
git init
```

<p>新仓库会默认使用 <code>main</code> 分支。</p>

<h2 id="九-设置默认编辑器">九、设置默认编辑器</h2>
<p>如果平时使用 VS Code，可以让 Git 默认调用 VS Code：</p>

```bash
git config --global core.editor "code --wait"
```

<p>如果终端提示：</p>

```
code: command not found
```

<p>需要先在 VS Code 中安装 <code>code</code> 命令。打开 VS Code，按：</p>

```
Command + Shift + P
```

<p>搜索并执行：</p>

```
Shell Command: Install 'code' command in PATH
```

<p>之后重新打开终端即可。</p>


<h2 id="常用命令速查-git-macos">常用命令速查</h2>

```bash
# 查看 Git 版本
git --version

# 查看 Git 路径
which git

# 查看全局配置
git config --global --list

# 初始化仓库
git init

# 查看仓库状态
git status

# 克隆仓库
git clone <仓库地址>

# 添加文件
git add .

# 创建提交
git commit -m "提交说明"

# 拉取远程更新
git pull

# 推送到远程仓库
git push
```

</div>

</div>

<div class="tab-panel" id="tab-panel-prereq-node" role="tabpanel" aria-labelledby="tab-btn-prereq-node" hidden>

<div class="os-windows">

<blockquote><p>Node.js 是很多前端与开发工具的运行环境。Astro、Vite、React、npm、pnpm，以及不少 AI 编程工具都会依赖它。Windows 用户一般直接安装官方 LTS 版本即可。</p></blockquote>

<h2 id="一-应该下载哪个版本">一、应该下载哪个版本？</h2>
<p>截至 <strong>2026-09-15</strong>，Node.js 官方下载页推荐的 LTS 版本是：</p>

```
Node.js v24.21.0 LTS
```

<p>当前版本则是 <code>v26.8.2 Current</code>。对于日常开发、学习前端、运行 Astro / Vite / npm 等场景，优先选择 <strong>LTS</strong>，兼容性通常更稳。<a href="https://nodejs.org/en/download" target="_blank" rel="noopener noreferrer">Node.js 官方下载页面</a></p>
<blockquote><p>Node.js 版本会持续更新，不必执着于本文中的具体小版本号。以后重新安装时，只要在官网下载页面选择最新的 <strong>LTS</strong> 即可。</p></blockquote>

<h2 id="二-确认-windows-架构">二、确认 Windows 架构</h2>
<p>绝大多数 Intel / AMD Windows 10、Windows 11 电脑选择：</p>

```
Windows
x64
Installer (.msi)
```

<p>如果使用 Snapdragon X 等 Windows on ARM 设备，则选择 <code>ARM64</code>。如果不确定，可以在 Windows 中打开：</p>

```
设置 → 系统 → 系统信息 → 系统类型
```

<p>看到 <code>基于 x64 的处理器</code>，就下载 x64 版本。</p>

<h2 id="三-使用官方安装包安装-node-js">三、使用官方安装包安装 Node.js</h2>
<p>下载 <code>.msi</code> 安装包后双击运行。安装过程通常保持默认设置，一路点击 <strong>Next</strong> 即可。</p>
<h3 id="需要保留的组件">需要保留的组件</h3>
<p>安装页面中建议确保以下组件处于启用状态：</p>

```
Node.js runtime
npm package manager
Add to PATH
```

<p>其中：</p>
<ul><li><strong>Node.js runtime</strong>：Node.js 本体</li><li><strong>npm package manager</strong>：Node.js 默认的包管理器</li><li><strong>Add to PATH</strong>：让 PowerShell、CMD、Windows Terminal、VS Code 都能直接调用 <code>node</code> 和 <code>npm</code></li></ul>
<h3 id="automatically-install-the-necessary-tools-要不要勾">Automatically install the necessary tools 要不要勾？</h3>
<p>如果安装器出现类似：</p>

```
Automatically install the necessary tools
```

<p>普通用户一般<strong>不需要勾选</strong>。这个选项主要用于安装 Python、Visual Studio Build Tools 等原生编译环境。只有某些 npm 包需要本地编译时才可能用到。对于 Astro、Vite、React 等普通前端学习环境，先不装也没问题。安装结束后点击 <strong>Finish</strong>。</p>

<h2 id="四-验证-node-js-是否安装成功">四、验证 Node.js 是否安装成功</h2>
<p>安装完成后，建议关闭之前已经打开的 PowerShell、CMD、Windows Terminal 或 VS Code 终端，再重新打开。输入：</p>

```powershell
node -v
```

<p>如果安装的是本文对应的 LTS 版本，可能看到：</p>

```
v24.21.0
```

<p>然后检查 npm：</p>

```powershell
npm -v
```

<p>只要能正常显示版本号，就说明 Node.js 和 npm 都已经安装成功。</p>
<h3 id="查看-node-js-安装路径">查看 Node.js 安装路径</h3>

```powershell
where.exe node
```

<p>通常会显示：</p>

```
C:\Program Files\nodejs\node.exe
```

<p>也可以检查 npm：</p>

```powershell
where.exe npm
```

<h2 id="五-测试-node-js">五、测试 Node.js</h2>
<p>在终端输入：</p>

```powershell
node
```

<p>会进入 Node.js 的交互环境。输入：</p>

```javascript
console.log("Hello Node.js")
```

<p>如果返回：</p>

```
Hello Node.js
```

<p>说明 Node.js 可以正常运行。退出交互环境可以输入：</p>

```
.exit
```

<p>或者连续按两次 <code>Ctrl + C</code>。</p>

<h2 id="六-npm-是什么">六、npm 是什么？</h2>
<p>npm 会随着 Node.js 一起安装，因此不需要单独下载安装。它主要负责：</p>
<ul><li>安装 JavaScript / TypeScript 项目依赖</li><li>安装命令行开发工具</li><li>创建 Astro、Vite、React 等项目</li><li>管理项目中的 <code>package.json</code></li></ul>
<p>检查 npm：</p>

```powershell
npm --version
```

<p>查看当前 npm 软件源：</p>

```powershell
npm config get registry
```

<p>默认官方源通常是：</p>

```
https://registry.npmjs.org/
```

<h2 id="七-快速测试-npm">七、快速测试 npm</h2>
<p>例如可以运行：</p>

```powershell
npm view astro version
```

<p>如果能返回 Astro 的版本号，说明 npm 已经能够正常访问软件源。也可以创建一个 Astro 项目：</p>

```powershell
npm create astro@latest
```

<blockquote><p>第一次使用 <code>npm create</code> 时，npm 可能询问是否临时安装对应的创建工具。确认来源无误后按提示继续即可。</p></blockquote>

<h2 id="八-使用-winget-一条命令安装">八、使用 winget 一条命令安装</h2>
<p>如果使用 Windows 11，或者系统中已经有 <code>winget</code>，可以直接打开 PowerShell：</p>

```powershell
winget install --id OpenJS.NodeJS.LTS -e
```

<p>安装完成后重新打开终端，然后验证：</p>

```powershell
node -v
npm -v
```

<p>如果两个命令都能显示版本号，就安装成功了。</p>
<blockquote><p>如果只是想快速安装，winget 最方便；如果希望自己确认安装路径、组件和选项，使用官网 <code>.msi</code> 安装包更直观。</p></blockquote>

<h2 id="常用命令速查-node-windows">常用命令速查</h2>

```powershell
# 查看 Node.js 版本
node -v

# 查看 npm 版本
npm -v

# 查看 Node.js 安装位置
where.exe node

# 查看 npm 安装位置
where.exe npm

# 查看 npm 官方源
npm config get registry

# 查看某个 npm 包的最新版本
npm view astro version

# 创建 Astro 项目
npm create astro@latest

# 使用 winget 安装 Node.js LTS
winget install --id OpenJS.NodeJS.LTS -e
```

</div>

<div class="os-macos">

<blockquote><p>在 macOS 上安装 Node.js，推荐优先使用 <strong>nvm</strong> 管理版本。这样后续使用 Astro、Vite、Claude Code、Codex、OpenCode 等工具时，可以根据项目需要自由切换 Node.js 版本。</p></blockquote>

<h2 id="一-推荐方式-使用-nvm-安装-node-js">一、推荐方式：使用 nvm 安装 Node.js</h2>
<h3 id="1-打开-terminal">1. 打开 Terminal</h3>
<p>可以通过以下方式打开 macOS 终端：</p>
<ul><li>按 <code>Command + Space</code></li><li>输入 <code>Terminal</code></li><li>回车打开</li></ul>
<h3 id="2-安装-nvm">2. 安装 nvm</h3>
<p>在 Terminal 中执行：</p>

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.7/install.sh | bash
```

<p>安装完成后，关闭 Terminal，再重新打开。然后检查：</p>

```bash
nvm --version
```

<p>如果能正常显示版本号，说明 nvm 安装成功。</p>
<blockquote><p>如果提示 <code>nvm: command not found</code>，通常是终端还没有重新加载 shell 配置。先关闭并重新打开 Terminal；如果仍然无效，再检查 <code>~/.zshrc</code> 中是否存在 nvm 初始化配置。</p></blockquote>

<h2 id="二-安装-node-js-lts">二、安装 Node.js LTS</h2>
<p>推荐安装长期支持版本 LTS：</p>

```bash
nvm install --lts
```

<p>安装完成后，将 LTS 设置为默认版本：</p>

```bash
nvm alias default 'lts/*'
```

<p>查看当前 Node.js 版本：</p>

```bash
node -v
```

<p>查看 npm 版本：</p>

```bash
npm -v
```

<p>Node.js 安装时会自动附带 npm，因此通常不需要单独安装 npm。</p>
<blockquote><p>长期使用时，建议让 nvm 自动安装"当前最新 LTS"，而不是固定某个版本号。这样以后重新安装时不会因为版本过期而产生BUG。</p></blockquote>

<h2 id="三-常用-nvm-命令">三、常用 nvm 命令</h2>
<p>查看已安装的 Node.js 版本：</p>

```bash
nvm list
```

<p>安装某个主版本：</p>

```bash
nvm install 22
nvm install 24
```

<p>切换 Node.js 版本：</p>

```bash
nvm use 22
```

<p>或者：</p>

```bash
nvm use 24
```

<p>查看当前正在使用的 Node.js：</p>

```bash
node -v
```

<p>查看当前 Node.js 路径：</p>

```bash
which node
```

<p>使用 nvm 时，Node.js 通常会位于用户目录下的 <code>.nvm</code> 中，而不是系统级目录。</p>

<h2 id="四-方法二-使用-node-js-官方安装包">四、方法二：使用 Node.js 官方安装包</h2>
<p>如果不需要管理多个 Node.js 版本，也可以直接使用官方 <code>.pkg</code> 安装包。打开 <a href="https://nodejs.org/en/download" target="_blank" rel="noopener noreferrer">Node.js 官方下载页面</a>，推荐选择 <strong>LTS</strong> 版本。</p>
<h3 id="apple-silicon-mac">Apple Silicon Mac</h3>
<p>如果是M系列芯片，请选择 <strong>ARM64</strong> 版本。</p>
<h3 id="intel-mac">Intel Mac</h3>
<p>较老的 Intel Mac 请选择 <strong>x64</strong> 版本。下载 <code>.pkg</code> 文件后双击安装，一般按照：</p>

```
Continue
→ Install
→ 输入 macOS 密码或使用 Touch ID
→ Close
```

<p>安装完成后重新打开 Terminal：</p>

```bash
node -v
npm -v
```

<p>即可确认安装状态。</p>

<h2 id="五-方法三-使用-homebrew">五、方法三：使用 Homebrew</h2>
<p>如果已经安装 Homebrew，也可以直接：</p>

```bash
brew install node
```

<p>安装后检查：</p>

```bash
node -v
npm -v
```

<h2 id="六-测试-node-js">六、测试 Node.js</h2>
<p>在终端中输入：</p>

```bash
node
```

<p>进入 Node.js 交互环境后输入：</p>

```javascript
console.log("Hello Node.js")
```

<p>如果看到：</p>

```
Hello Node.js
```

<p>说明 Node.js 可以正常运行。退出 Node.js：</p>

```
Ctrl + D
```

<p>或者输入：</p>

```javascript
.exit
```

<h2 id="七-测试-npm">七、测试 npm</h2>
<p>查看 npm 版本：</p>

```bash
npm -v
```

<p>查看 npm 当前 registry：</p>

```bash
npm config get registry
```

<p>默认通常是：</p>

```
https://registry.npmjs.org
```

<h2 id="常用命令速查-node-macos">常用命令速查</h2>

```bash
# 查看 nvm 版本
nvm --version

# 安装最新 LTS
nvm install --lts

# 设置默认 LTS
nvm alias default 'lts/*'

# 查看已安装版本
nvm list

# 查看 Node.js 版本
node -v

# 查看 npm 版本
npm -v

# 查看 Node.js 实际路径
which node

# 创建 Astro 项目
npm create astro@latest
```

</div>

</div>

<div class="tab-panel" id="tab-panel-prereq-claude" role="tabpanel" aria-labelledby="tab-btn-prereq-claude" hidden>

<figure>
<img src="/post-images/2026-09-15-deepseek-api-guide/claude-code-interface.png" alt="Claude Code 官方界面">
<figcaption>图片来源：<a href="https://www.anthropic.com/claude-code" target="_blank" rel="noopener noreferrer">Anthropic Claude Code</a></figcaption>
</figure>

<h2 id="cc-install-1">1. Claude Code 是什么</h2>
<p>Claude Code 是 Anthropic 推出的终端 / IDE AI 编程工具。安装后在项目目录里跑 <code>claude</code>，就能让 AI 读代码、改文件、跑命令、提交 Git。</p>

<h2 id="cc-install-2">2. 原生安装方式</h2>
<p>官方推荐原生安装：单一可执行文件、不依赖 Node.js、自动更新更稳定。</p>

<div class="os-macos">
<h3 id="cc-install-2-1">macOS</h3>
<p>打开终端，执行：</p>

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

<p>脚本会按系统和 CPU 架构下载对应二进制，通常装到 <code>~/.local/bin</code>。</p>
</div>

<div class="os-windows">
<h3 id="cc-install-2-2">Windows PowerShell</h3>
<blockquote><p><strong>前置依赖</strong>：完成 Git 和 Node.js 的下载</p></blockquote>
<p>执行：</p>

```powershell
irm https://claude.ai/install.ps1 | iex
```

</div>

<h2 id="cc-install-3">3. 其他安装方式</h2>

<div class="os-macos">
<h3 id="cc-install-3-1">Homebrew</h3>

```bash
brew install --cask claude-code
```

<ul>
<li><code>claude-code</code>：稳定通道，通常晚一周左右</li>
<li><code>claude-code@latest</code>：最新通道</li>
</ul>
<p>Homebrew 不会自动更新，需要时手动：</p>

```bash
brew upgrade claude-code
# 或
brew upgrade claude-code@latest
```

</div>

<div class="os-windows">
<h3 id="cc-install-3-2">WinGet（Windows）</h3>

```powershell
winget install Anthropic.ClaudeCode
```

<p>WinGet 也不会自动更新：</p>

```powershell
winget upgrade Anthropic.ClaudeCode
```

<p>不要同时保留脚本安装和 WinGet 两份，避免 PATH 里出现两个 <code>claude</code>。</p>
</div>

<h3 id="cc-install-3-3">npm（任意平台）</h3>
<p>已有 Node.js 18+ 时可用：</p>

```bash
npm install -g @anthropic-ai/claude-code
```

<h2 id="cc-install-4">4. 验证安装</h2>
<p>装完后<strong>新开一个终端</strong>，执行：</p>

```bash
claude --version
```

<p>正常会打印类似：</p>

```
2.1.211 (Claude Code)
```

<h2 id="cc-install-5">5. 第一次启动</h2>
<p>进入你的项目目录：</p>

```bash
cd /path/to/your-project
claude
```

<p>首次启动会要求登录。</p>

<h2 id="cc-install-6">6. 卸载</h2>
<p>跟安装方式对应，不同渠道的卸载方法：</p>
<p><strong>原生脚本</strong>（curl / irm 装的）：删除二进制 + 清理配置</p>

<div class="os-macos">
<p>macOS（通常装在 <code>~/.local/bin/claude</code>）：</p>

```bash
rm -f ~/.local/bin/claude
rm -rf ~/.claude ~/.config/claude ~/.cache/claude
```

<p><strong>Homebrew</strong>：</p>

```bash
brew uninstall --cask claude-code
# 或
brew uninstall --cask claude-code@latest
```

</div>

<div class="os-windows">
<p>Windows（通常装在 <code>%LOCALAPPDATA%\Programs\claude-code</code>）：</p>

```powershell
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Programs\claude-code"
Remove-Item -Recurse -Force "$env:USERPROFILE\.claude"
```

<p><strong>WinGet</strong>：</p>

```powershell
winget uninstall Anthropic.ClaudeCode
```

</div>

<p><strong>npm</strong>（任意平台）：</p>

```bash
npm uninstall -g @anthropic-ai/claude-code
```

<p>不要同时保留多种安装方式的副本，避免 PATH 里出现两个 <code>claude</code> 二进制。</p>

<div class="os-macos">
<p>如果 PATH 冲突，先 <code>which claude</code> 查一下到底指向哪里，只保留一个，其他删掉。</p>
</div>

<div class="os-windows">
<p>如果 PATH 冲突，先 <code>where.exe claude</code> 查一下到底指向哪里，只保留一个，其他删掉。</p>
</div>

<h2 id="cc-install-ref">参考链接</h2>
<ul>
<li><a href="https://code.claude.com/docs/en/getting-started" target="_blank" rel="noopener noreferrer">Claude Code 官方安装</a></li>
<li><a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener noreferrer">快速开始</a></li>
<li><a href="https://code.claude.com/docs/en/desktop-quickstart" target="_blank" rel="noopener noreferrer">桌面应用</a></li>
<li><a href="https://code.claude.com/docs/zh-CN/quickstart" target="_blank" rel="noopener noreferrer">中文安装指南</a></li>
<li><a href="https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code" target="_blank" rel="noopener noreferrer">DeepSeek Claude Code 接入</a></li>
</ul>
<blockquote><p>最后更新：2026-09-14，基于 Anthropic 官方文档整理。安装命令以 <a href="https://code.claude.com/docs/en/getting-started" target="_blank" rel="noopener noreferrer">code.claude.com</a> 为准。</p></blockquote>

</div>

<div class="tab-panel" id="tab-panel-prereq-codex" role="tabpanel" aria-labelledby="tab-btn-prereq-codex" hidden>

<figure>
<img src="/post-images/2026-09-15-deepseek-api-guide/codex-app-basic-light.webp" alt="Codex App 界面">
<figcaption>图片来源：<a href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer">OpenAI Codex</a></figcaption>
</figure>

<h2 id="cdx-inst-2">2. Codex CLI（终端）</h2>
<h3 id="cdx-inst-2-1">2.1 安装方式</h3>

<div class="os-windows">
<blockquote><p><strong>Windows 用户前置依赖</strong>：完成 Git 和 Node.js 的下载</p></blockquote>
</div>

<div class="os-macos">
<p><strong>官方脚本（macOS）</strong></p>

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

</div>

<div class="os-windows">
<p><strong>官方脚本（Windows PowerShell）</strong></p>

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

</div>

<p><strong>包管理器（需要下载 Node.js）</strong></p>

```bash
# npm（任意平台）
npm install -g @openai/codex
# Homebrew（macOS）
brew install --cask codex
```

<h3 id="cdx-inst-2-3">2.3 启动与验证</h3>

```bash
codex --version
```

<p>看到版本号就装好了。</p>
<p>直接运行 <code>codex</code> 进入交互式界面，首次会引导登录：</p>
<ul>
<li><strong>Sign in with ChatGPT</strong>：用 ChatGPT 账号（Plus / Pro / Business / Edu / Enterprise 订阅包含 Codex 额度）</li>
<li><strong>Sign in with API Key</strong>：用 OpenAI API Key，按 credits 扣费；<strong>部分功能（如 cloud threads）不可用</strong></li>
</ul>

<h3 id="cdx-inst-2-4">2.4 卸载</h3>

```bash
# npm
npm uninstall -g @openai/codex
# Homebrew
brew uninstall --cask codex
# 官方脚本 / 手动下载的：先查路径再删
which codex       # macOS
where.exe codex   # Windows
# 然后 rm / del 这个路径下的 codex 二进制
```

<h2 id="cdx-inst-3">3. Codex App（桌面应用）</h2>
<h3 id="cdx-inst-3-1">3.1 安装</h3>
<p>下载入口：<a href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer">https://chatgpt.com/codex</a></p>

<div class="os-macos">
<p><strong>macOS</strong>：下载 <code>.dmg</code>，拖进 Applications 文件夹。</p>
</div>

<div class="os-windows">
<p><strong>Windows</strong>：点 "Download for Windows" 会跳到 <strong>Microsoft Store</strong> 安装，有 2 个限制需要注意：</p>
<ul>
<li><strong>必须关掉本机代理软件再装</strong>（Microsoft Store 作为 UWP 应用，默认运行在 AppContainer 沙箱中，不允许接收环回流量，不会走本机代理。开了代理软件反而会导致 Microsoft Store 无法打开）</li>
<li><strong>本机区域必须设成 Codex 已上线的地区</strong>（比如美国）— Windows 设置 → 时间和语言 → 区域和语言 → 国家或地区改成「美国」</li>
</ul>
</div>

<h3 id="cdx-inst-3-2">3.2 启动与登录</h3>
<ol>
<li>打开 Codex App</li>
<li>登录：
<ul>
<li><strong>ChatGPT 账号</strong>：推荐，Plus / Pro / Business / Edu / Enterprise 订阅包含 Codex 额度</li>
<li><strong>OpenAI API Key</strong>：用 credits 扣费，部分功能（如 cloud threads）不可用</li>
</ul>
</li>
<li>发送第一条消息</li>
</ol>

<h2 id="cdx-inst-ref">参考链接</h2>
<ul>
<li><a href="https://developers.openai.com/codex" target="_blank" rel="noopener noreferrer">Codex 官方文档</a></li>
<li><a href="https://github.com/openai/codex" target="_blank" rel="noopener noreferrer">GitHub 仓库</a></li>
</ul>

</div>

</div>

</div>

<div class="tab-panel" id="tab-panel-config" role="tabpanel" aria-labelledby="tab-btn-config" hidden>

<div class="tab-group" data-tabs>

<div class="tab-list" role="tablist" aria-label="配置">
<button class="tab-btn" id="tab-btn-config-claude" type="button" role="tab" aria-selected="true" aria-controls="tab-panel-config-claude" data-tab="config-claude">Claude Code 配置</button>
<button class="tab-btn" id="tab-btn-config-codex" type="button" role="tab" aria-selected="false" tabindex="-1" aria-controls="tab-panel-config-codex" data-tab="config-codex">Codex 配置</button>
</div>

<div class="tab-panel" id="tab-panel-config-claude" role="tabpanel" aria-labelledby="tab-btn-config-claude">

<figure>
<img src="/post-images/2026-09-15-deepseek-api-guide/claude-code-terminal.png" alt="Claude Code 终端界面">
<figcaption>图片来源：<a href="https://www.anthropic.com/claude-code" target="_blank" rel="noopener noreferrer">Anthropic Claude Code</a></figcaption>
</figure>

<blockquote><p>默认读者已下载 Claude Code</p></blockquote>

<h2 id="cc-int-1">1. 前置准备</h2>
<h3 id="cc-int-1-1">1.1 获取 DeepSeek API Key</h3>
<ol>
<li>打开 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台 - API Keys</a></li>
<li>注册 / 登录账号</li>
<li>点击 <strong>Create new key</strong>，复制生成的 <code>sk-</code> 开头的密钥</li>
</ol>
<blockquote><p><strong>API Key 只显示一次</strong>，务必妥善保存。</p></blockquote>

<h2 id="cc-int-2">2. 配置环境变量</h2>
<blockquote>
<p><strong>两种方式任选一种</strong>：</p>
<ul>
<li><strong>方式 A（配置文件）</strong>：推荐，配置持久化、重启不丢</li>
<li><strong>方式 B（环境变量）</strong>：快速测试用，关掉终端就失效</li>
</ul>
</blockquote>

<h3 id="cc-int-2-a">方式 A：通过配置文件（settings.json）配置</h3>
<p>配置文件路径：</p>
<table>
<thead><tr><th>系统</th><th>路径</th></tr></thead>
<tbody>
<tr><td>macOS</td><td><code>~/.claude/settings.json</code></td></tr>
<tr><td>Windows</td><td><code>%USERPROFILE%\.claude\settings.json</code>（即 <code>C:\Users\&lt;你的用户名&gt;\.claude\settings.json</code>）</td></tr>
</tbody>
</table>
<p>如果文件不存在，先创建目录：</p>

<div class="os-macos">

```bash
mkdir -p ~/.claude && touch ~/.claude/settings.json
```

</div>

<div class="os-windows">

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.claude" | Out-Null
New-Item -ItemType File -Force -Path "$HOME\.claude\settings.json" | Out-Null
```

</div>

<p>填入以下内容（<strong>把你的 API Key 替换进去</strong>）：</p>

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的DeepSeek密钥",
    "ANTHROPIC_MODEL": "deepseek-flash[1m]",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-flash[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-flash[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-flash",
    "CLAUDE_CODE_EFFORT_LEVEL": "max",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "786432"
  }
}
```

<h3 id="cc-int-2-b">方式 B：通过环境变量配置（临时）</h3>

<div class="os-macos">
<p><strong>macOS</strong></p>

```bash
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=sk-你的DeepSeek密钥
export ANTHROPIC_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_OPUS_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_SONNET_MODEL=deepseek-flash[1m]
export ANTHROPIC_DEFAULT_HAIKU_MODEL=deepseek-flash
export CLAUDE_CODE_SUBAGENT_MODEL=deepseek-flash
export CLAUDE_CODE_EFFORT_LEVEL=max
export CLAUDE_CODE_AUTO_COMPACT_WINDOW=786432
```

</div>

<div class="os-windows">
<p><strong>Windows PowerShell</strong></p>

```powershell
$env:ANTHROPIC_BASE_URL = "https://api.deepseek.com/anthropic"
$env:ANTHROPIC_AUTH_TOKEN = "sk-你的DeepSeek密钥"
$env:ANTHROPIC_MODEL = "deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "deepseek-flash[1m]"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "deepseek-flash"
$env:CLAUDE_CODE_SUBAGENT_MODEL = "deepseek-flash"
$env:CLAUDE_CODE_EFFORT_LEVEL = "max"
$env:CLAUDE_CODE_AUTO_COMPACT_WINDOW = "786432"
```

</div>

<div class="os-windows">
<h2 id="cc-int-2-5">2.5 Windows 让环境变量永久生效（补充）</h2>
<p>如果不想用方式 A，只想在 Windows 系统层面把环境变量写死，有下面两种方式。<strong>注意：命令行方式直接写注册表，只对新打开的终端 / 应用生效，当前窗口看不到变化。</strong></p>
<p><strong>GUI 方式</strong>（图形界面，直观）：</p>
<ol>
<li>Win + R → 输入 <code>sysdm.cpl</code> → 回车</li>
<li>切到 <strong>高级</strong> 选项卡 → 点 <strong>环境变量</strong></li>
<li>在 <strong>用户变量</strong>（只对当前用户）或 <strong>系统变量</strong>（对所有用户，需管理员）里点 <strong>新建</strong></li>
<li>变量名 / 变量值按第 3 节表格填好，一路确定即可</li>
</ol>
<p><strong>命令行 — PowerShell</strong>：</p>
<p>用 <code>[Environment]::SetEnvironmentVariable</code> 直接写注册表。</p>
<ul>
<li><strong>User 范围</strong>（无需管理员）：</li>
</ul>

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "sk-你的DeepSeek密钥", "User")
```

<ul>
<li><strong>Machine 范围</strong>（对所有用户生效，<strong>需以管理员身份运行 PowerShell</strong>）：</li>
</ul>

```powershell
[Environment]::SetEnvironmentVariable("ANTHROPIC_AUTH_TOKEN", "sk-你的DeepSeek密钥", "Machine")
```

</div>

<h2 id="cc-int-3">3. 环境变量含义</h2>
<table>
<thead><tr><th>变量</th><th>是否必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>ANTHROPIC_BASE_URL</code></td><td>必填</td><td>DeepSeek 的 Anthropic 兼容端点，固定为 <code>https://api.deepseek.com/anthropic</code></td></tr>
<tr><td><code>ANTHROPIC_AUTH_TOKEN</code></td><td>必填</td><td>你的 DeepSeek API Key（<code>sk-</code> 开头）</td></tr>
<tr><td><code>ANTHROPIC_MODEL</code></td><td>必填</td><td>Claude Code 默认调用的模型，<code>deepseek-flash[1m]</code></td></tr>
<tr><td><code>ANTHROPIC_DEFAULT_OPUS_MODEL</code></td><td>选填</td><td>映射 Opus 档（高复杂度任务）。<code>deepseek-flash[1m]</code></td></tr>
<tr><td><code>ANTHROPIC_DEFAULT_SONNET_MODEL</code></td><td>选填</td><td>映射 Sonnet 档（日常任务）。同上</td></tr>
<tr><td><code>ANTHROPIC_DEFAULT_HAIKU_MODEL</code></td><td>选填</td><td>映射 Haiku 档（轻量快速任务）。<code>deepseek-flash</code></td></tr>
<tr><td><code>CLAUDE_CODE_SUBAGENT_MODEL</code></td><td>选填</td><td>子代理（子任务）使用的模型，用 flash 省 token</td></tr>
<tr><td><code>CLAUDE_CODE_EFFORT_LEVEL</code></td><td>选填</td><td>推理强度，<code>low</code> / <code>high</code> / <code>max</code>（DeepSeek 实际档，见第 5 节），默认 <code>max</code></td></tr>
<tr><td><code>CLAUDE_CODE_AUTO_COMPACT_WINDOW</code></td><td>推荐</td><td>自动压缩上下文的阈值（tokens），官方推荐 <strong>786432</strong>（= 768K）。配了这个，长对话不会频繁手动压缩</td></tr>
</tbody>
</table>

<h3 id="cc-int-3-1">模型名规则</h3>
<p>DeepSeek 当前主推两个模型，Claude Code 接入时：</p>
<table>
<thead><tr><th>模型名</th><th>实际版本</th><th>特点</th><th>适用场景</th></tr></thead>
<tbody>
<tr><td><code>deepseek-flash[1m]</code></td><td>DeepSeek-V4.1-Flash</td><td>284B 总参 / 13B 激活，1M 上下文，<strong>官方接入 Claude Code 的推荐档</strong></td><td>日常开发、写功能、改 bug</td></tr>
<tr><td><code>deepseek-flash</code></td><td>DeepSeek-V4.1-Flash</td><td>同上，但不带 1M 上下文开关</td><td>子任务、小修改、查 Bug、注释</td></tr>
</tbody>
</table>
<blockquote><p>方括号 <code>[1m]</code> 是 DeepSeek 的「1M 上下文开关」。如果你的任务不需要超长上下文，可以省略。</p></blockquote>

<h3 id="cc-int-3-2">使用 V4-Pro</h3>
<p><strong>手动覆盖字段</strong>：在 settings.json 里把 Opus 字段改成 <code>deepseek-v4-pro[1m]</code>，即：</p>

```json
"ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-v4-pro[1m]"
```

<h2 id="cc-int-4">4. 启动 Claude Code</h2>
<p>进入你的项目目录：</p>

```bash
cd /path/to/your-project
claude
```

<p>进入对话后，在 Claude Code 里输入：</p>

```bash
/status
```

<p>确认 <strong>API Endpoint</strong> 显示 <code>https://api.deepseek.com/anthropic</code>，<strong>Model</strong> 显示 <code>deepseek-flash[1m]</code>，说明配置已生效。</p>
<p>然后随便问一句验证连通性：</p>

```bash
hello
```

<p>如果 DeepSeek 正常回复，接入就完成了。</p>

<h2 id="cc-int-5">5. 切换推理强度</h2>
<p>Claude Code 默认按 <code>CLAUDE_CODE_EFFORT_LEVEL</code> 配置的档位推理，你可以根据任务复杂度随时调整。</p>
<h3 id="cc-int-5-1">5.1 三种切换方式</h3>
<p><strong>会话内动态切换</strong>（最常用）：</p>
<p>Claude Code 内置 <code>/effort</code> 命令，Claude 正在工作时也能切，改完会应用到当前 turn 的下一个请求：</p>

```bash
/effort           # 弹出滑块，可选手动选 low / medium / high / xhigh / max / auto
/effort high      # 直接设成 high
/effort low       # 直接设成 low，关闭思考模式，响应最快
/effort auto      # 交给 Claude 按任务复杂度自动选档
```

<p><strong>启动时定档</strong>：</p>

```bash
claude --effort high   # 这次会话全程用 high
claude --effort max    # 全程用 max
```

<p><strong>修改默认档</strong>（影响所有未来会话）：编辑 <code>~/.claude/settings.json</code>，把 <code>CLAUDE_CODE_EFFORT_LEVEL</code> 改成想要的值，重启 Claude Code 生效。</p>

<h3 id="cc-int-5-2">5.2 DeepSeek 后端的实际档位</h3>
<p>Claude Code 的 <code>/effort</code> 滑块显示 5 档（low / medium / high / xhigh / max），但落到 DeepSeek 后端<strong>只有 3 档真正有区别</strong>，中间的会被合并：</p>
<table>
<thead><tr><th>Claude Code 传入</th><th>DeepSeek 实际生效</th><th>备注</th></tr></thead>
<tbody>
<tr><td><code>low</code></td><td><strong>low</strong></td><td>同时<strong>关闭思考模式</strong>，响应快、省 token</td></tr>
<tr><td><code>medium</code></td><td>high</td><td>被合并到 high</td></tr>
<tr><td><code>high</code></td><td>high</td><td>日常开发默认档</td></tr>
<tr><td><code>xhigh</code></td><td>high</td><td>被合并到 high</td></tr>
<tr><td><code>max</code></td><td><strong>max</strong></td><td>深度推理，token 最多，速度最慢</td></tr>
<tr><td><code>auto</code></td><td>Claude 自选</td><td>Claude 在 low / high / max 之间自动切</td></tr>
</tbody>
</table>

<h2 id="cc-int-ref">6. 参考链接</h2>
<ul>
<li><a href="https://api-docs.deepseek.com/zh-cn/" target="_blank" rel="noopener noreferrer">DeepSeek 官方文档（中文）</a></li>
<li><a href="https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/claude_code" target="_blank" rel="noopener noreferrer">DeepSeek Claude Code 接入指南</a></li>
<li><a href="https://api-docs.deepseek.com/zh-cn/guides/anthropic_api" target="_blank" rel="noopener noreferrer">Anthropic API 兼容说明</a></li>
<li><a href="https://api-docs.deepseek.com/zh-cn/guides/thinking_mode" target="_blank" rel="noopener noreferrer">DeepSeek 思考模式文档</a></li>
<li><a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台</a></li>
<li><a href="https://docs.claude.com/en/docs/claude-code" target="_blank" rel="noopener noreferrer">Claude Code 官方文档</a></li>
</ul>
<blockquote><p>最后更新：基于 DeepSeek 官方文档 2026-09 抓取版本。如果官方文档更新请以最新为准。</p></blockquote>

</div>

<div class="tab-panel" id="tab-panel-config-codex" role="tabpanel" aria-labelledby="tab-btn-config-codex" hidden>

<figure>
<img src="/post-images/2026-09-15-deepseek-api-guide/codex-app-basic-light.webp" alt="Codex App 界面">
<figcaption>图片来源：<a href="https://chatgpt.com/codex" target="_blank" rel="noopener noreferrer">OpenAI Codex</a></figcaption>
</figure>

<blockquote><p>默认读者已下载 Codex</p></blockquote>

<h2 id="cdx-int-1">1. 前置准备</h2>
<h3 id="cdx-int-1-1">1.1 获取 DeepSeek API Key</h3>
<ol>
<li>打开 <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台 - API Keys</a></li>
<li>注册 / 登录账号</li>
<li>点击 <strong>Create new key</strong>，复制生成的 <code>sk-</code> 开头的密钥</li>
</ol>
<blockquote><p><strong>API Key 只显示一次</strong>，务必妥善保存。</p></blockquote>

<h2 id="cdx-int-2">2. 配置 DeepSeek 为模型提供方</h2>
<p>Codex 需要两个文件，缺一不可：</p>
<table>
<thead><tr><th>文件</th><th>路径</th><th>作用</th></tr></thead>
<tbody>
<tr><td><code>~/.codex/config.toml</code></td><td>TOML 配置文件</td><td>模型、provider、认证方式、推理档位等</td></tr>
<tr><td><code>~/.codex/models.json</code></td><td>JSON 模型目录</td><td>声明 DeepSeek 模型元数据（上下文窗口、推理档位、工具调用格式等）</td></tr>
</tbody>
</table>
<blockquote><p><strong>配置前务必先启动 Codex 一次</strong>（随便 <code>codex</code> 跑一下退出即可），让客户端生成 <code>~/.codex</code> 目录。</p></blockquote>

<h3 id="cdx-int-2-a">方式 A：一键脚本（推荐）</h3>
<p>DeepSeek 官方提供脚本，自动备份、写 <code>models.json</code>、改 <code>config.toml</code>、校验语法。</p>

<div class="os-macos">
<p><strong>macOS</strong></p>

```bash
bash <(curl -fsSL https://cdn.deepseek.com/api-docs/codex-deepseek-setup.sh)
```

</div>

<div class="os-windows">
<p><strong>Windows PowerShell</strong></p>

```powershell
irm https://cdn.deepseek.com/api-docs/codex-deepseek-setup.ps1 | iex
```

</div>

<p>按菜单选择操作：</p>
<table>
<thead><tr><th>菜单选项</th><th>作用</th></tr></thead>
<tbody>
<tr><td><strong>1</strong></td><td>配置使用 <code>deepseek-flash</code>（支持图片输入，推荐）</td></tr>
<tr><td><strong>2</strong></td><td>配置使用 <code>deepseek-v4-pro</code>（深度推理更强，无图片输入）</td></tr>
<tr><td><strong>9</strong></td><td>恢复安装前的默认 Codex 配置，删除 DeepSeek 相关配置</td></tr>
</tbody>
</table>
<p>首次运行会提示输入 API Key（以 <code>sk-</code> 开头）。</p>
<p>脚本会自动完成：</p>
<ol>
<li><strong>备份</strong> <code>~/.codex/config.toml</code> 到 <code>~/.codex/backup-deepseek/</code></li>
<li><strong>写入</strong> <code>~/.codex/models.json</code>（声明 DeepSeek 模型元数据）</li>
<li><strong>修改</strong> <code>~/.codex/config.toml</code>，只改必要字段，你原有的 MCP、项目信任级别等配置全部保留</li>
<li><strong>校验</strong> <code>config.toml</code> / <code>models.json</code> 语法，失败则中止，不修改任何文件</li>
</ol>
<blockquote><p>如果此前用旧版本脚本装过 <code>deepseek-v4-flash</code> / <code>deepseek-v4-flash-vision-exp</code> 等条目，重新运行脚本会自动清理，只保留 <code>deepseek-flash</code> 和 <code>deepseek-v4-pro</code>。</p></blockquote>

<h3 id="cdx-int-2-b">方式 B：手动编辑配置文件</h3>
<p>如果你想完全掌控每一行，需要创建/修改两个文件。</p>
<p><strong>1. 创建 <code>~/.codex/models.json</code></strong> — 声明 DeepSeek 模型元数据：</p>

<div class="os-macos">
<p><strong>macOS</strong></p>

```bash
mkdir -p ~/.codex
```

</div>

<div class="os-windows">
<p><strong>Windows PowerShell</strong></p>

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\.codex" | Out-Null
```

</div>

<p>写入以下内容（包含 <code>deepseek-flash</code> 和 <code>deepseek-v4-pro</code> 两个模型）：</p>

```json
{
  "models": [
    {
      "slug": "deepseek-flash",
      "prefer_websockets": false,
      "support_verbosity": true,
      "default_verbosity": "low",
      "apply_patch_tool_type": "freeform",
      "web_search_tool_type": "text",
      "input_modalities": ["text", "image"],
      "supports_image_detail_original": true,
      "truncation_policy": { "mode": "tokens", "limit": 10000 },
      "supports_parallel_tool_calls": true,
      "tool_mode": null,
      "multi_agent_version": "v2",
      "use_responses_lite": false,
      "include_skills_usage_instructions": false,
      "auto_review_model_override": null,
      "context_window": 1048576,
      "max_context_window": 1048576,
      "effective_context_window_percent": 95,
      "auto_compact_token_limit": null,
      "comp_hash": "3000",
      "reasoning_summary_format": "experimental",
      "default_reasoning_summary": "none",
      "display_name": "DeepSeek-Flash",
      "description": "Latest frontier agentic coding model with image input.",
      "default_reasoning_level": "high",
      "supported_reasoning_levels": [
        { "effort": "low", "description": "Fast responses with lighter reasoning" },
        { "effort": "high", "description": "Extra high reasoning depth for complex problems" },
        { "effort": "max", "description": "Maximum reasoning depth" }
      ]
    },
    {
      "slug": "deepseek-v4-pro",
      "prefer_websockets": false,
      "support_verbosity": true,
      "default_verbosity": "low",
      "apply_patch_tool_type": "freeform",
      "web_search_tool_type": "text",
      "input_modalities": ["text"],
      "supports_image_detail_original": false,
      "truncation_policy": { "mode": "tokens", "limit": 10000 },
      "supports_parallel_tool_calls": true,
      "tool_mode": null,
      "multi_agent_version": "v2",
      "use_responses_lite": false,
      "include_skills_usage_instructions": false,
      "auto_review_model_override": null,
      "context_window": 1048576,
      "max_context_window": 1048576,
      "effective_context_window_percent": 95,
      "auto_compact_token_limit": null,
      "comp_hash": "3000",
      "reasoning_summary_format": "experimental",
      "default_reasoning_summary": "none",
      "display_name": "DeepSeek-V4-Pro",
      "description": "Latest frontier agentic coding model.",
      "default_reasoning_level": "high",
      "supported_reasoning_levels": [
        { "effort": "low", "description": "Fast responses with lighter reasoning" },
        { "effort": "high", "description": "Extra high reasoning depth for complex problems" },
        { "effort": "max", "description": "Maximum reasoning depth" }
      ]
    }
  ]
}
```

<blockquote><p><code>deepseek-flash</code> 的 <code>input_modalities</code> 包含 <code>image</code>，Codex 据此判断该模型可以接收图片。<code>deepseek-v4-pro</code> 不支持图片。</p></blockquote>
<p><strong>2. 编辑 <code>~/.codex/config.toml</code></strong> — 写入配置（<strong>把你的 API Key 替换进去</strong>）：</p>

```toml
model = "deepseek-flash"
model_provider = "deepseek"
preferred_auth_method = "apikey"
forced_login_method = "api"
model_reasoning_effort = "high"
web_search = "disabled"
model_catalog_json = "~/.codex/models.json"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
experimental_bearer_token = "sk-你的DeepSeek密钥"
```

<blockquote><p>用 v4-pro：把 <code>model = "deepseek-flash"</code> 改成 <code>model = "deepseek-v4-pro"</code> 即可，其他不用动。</p></blockquote>

<h2 id="cdx-int-2-5">2.5 让 API Key 永久生效（补充）</h2>
<p><code>config.toml</code> 里直接写 API Key 简单但密钥暴露在文件里。更安全的做法是用环境变量，只把密钥名写在配置里、密钥本身放到 shell 环境。</p>
<p>把 <code>config.toml</code> 改成（用 <code>env_key</code> 引用环境变量名）：</p>

```toml
model = "deepseek-flash"
model_provider = "deepseek"
preferred_auth_method = "apikey"
forced_login_method = "api"
model_reasoning_effort = "high"
web_search = "disabled"
model_catalog_json = "~/.codex/models.json"

[model_providers.deepseek]
name = "deepseek"
base_url = "https://api.deepseek.com/"
wire_api = "responses"
env_key = "DEEPSEEK_API_KEY"
```

<p>然后只把密钥放在系统环境变量里。命令行临时设置（关掉终端就失效）：</p>

<div class="os-macos">
<p><strong>macOS</strong></p>

```bash
export DEEPSEEK_API_KEY="sk-你的DeepSeek密钥"
```

</div>

<div class="os-windows">
<p><strong>Windows PowerShell</strong></p>

```powershell
$env:DEEPSEEK_API_KEY = "sk-你的DeepSeek密钥"
```

</div>

<p>想永久生效，把环境变量写进 shell profile 或 Windows 系统环境变量（操作步骤跟 Claude Code 配置里的 2.5 节完全一致）。</p>

<h2 id="cdx-int-3">3. config.toml 字段说明</h2>
<h3 id="cdx-int-3-1">3.1 顶层字段</h3>
<table>
<thead><tr><th>字段</th><th>是否必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>model</code></td><td>必填</td><td>默认模型，<code>deepseek-flash</code> 或 <code>deepseek-v4-pro</code></td></tr>
<tr><td><code>model_provider</code></td><td>必填</td><td>模型提供方 id，跟下面 <code>[model_providers.XXX]</code> 块的 id 对应（这里写 <code>deepseek</code>）</td></tr>
<tr><td><code>preferred_auth_method</code></td><td>推荐</td><td>用 <code>apikey</code> 跳过 ChatGPT 账号登录</td></tr>
<tr><td><code>forced_login_method</code></td><td>推荐</td><td>强制使用 <code>api</code> 登录方式，不弹账号选择菜单</td></tr>
<tr><td><code>model_reasoning_effort</code></td><td>选填</td><td>推理强度，<code>low</code> / <code>high</code> / <code>max</code>（DeepSeek 实际档，见第 5 节），默认 <code>high</code></td></tr>
<tr><td><code>web_search</code></td><td>推荐</td><td>DeepSeek 模型下设为 <code>"disabled"</code>，避免 Codex 误调用内置联网搜索</td></tr>
<tr><td><code>model_catalog_json</code></td><td>必填</td><td>自定义模型目录文件路径，指向 <code>~/.codex/models.json</code>，Codex 从这里读模型元数据</td></tr>
</tbody>
</table>

<h3 id="cdx-int-3-2">3.2 <code>[model_providers.deepseek]</code> 块</h3>
<table>
<thead><tr><th>字段</th><th>是否必填</th><th>说明</th></tr></thead>
<tbody>
<tr><td><code>name</code></td><td>必填</td><td>显示名</td></tr>
<tr><td><code>base_url</code></td><td>必填</td><td>DeepSeek 端点，<code>https://api.deepseek.com/</code>（Codex 自动追加 <code>/responses</code> 路径）</td></tr>
<tr><td><code>wire_api</code></td><td>必填</td><td>协议类型，DeepSeek 原生支持 Responses API，所以填 <code>responses</code></td></tr>
<tr><td><code>experimental_bearer_token</code></td><td>二选一</td><td>API Key 直接写进配置文件 — 简单，但密钥暴露在文件里</td></tr>
<tr><td><code>env_key</code></td><td>二选一</td><td>环境变量名（比如 <code>DEEPSEEK_API_KEY</code>），从环境变量读密钥 — 更安全</td></tr>
</tbody>
</table>
<p><code>experimental_bearer_token</code> 和 <code>env_key</code> 选一个就行，推荐 <code>env_key</code>（配第 2.5 节）。</p>

<h3 id="cdx-int-3-3">3.3 模型名规则</h3>
<table>
<thead><tr><th>模型名</th><th>Codex 支持</th><th>实际版本</th><th>特点</th></tr></thead>
<tbody>
<tr><td><code>deepseek-flash</code></td><td>完全支持，<strong>推荐</strong></td><td>DeepSeek-V4.1-Flash</td><td>1M 上下文，<strong>支持图片输入</strong>，性价比最好，响应快</td></tr>
<tr><td><code>deepseek-v4-pro</code></td><td>完全支持</td><td>DeepSeek-V4-Pro-0813</td><td>1M 上下文，无图片输入，深度推理更强</td></tr>
</tbody>
</table>
<p>切换模型只需把 <code>model</code> 字段改一下，其他配置不动。</p>

<h2 id="cdx-int-4">4. 启动 Codex</h2>
<p>进入你的项目目录：</p>

```bash
cd /path/to/your-project
codex
```

<p>启动后看 banner，确认显示：</p>

```
model: deepseek-flash
provider: deepseek
reasoning effort: high
```

<p>如果一致，说明配置已生效。</p>
<p>然后与 Codex 会话验证连通性：</p>

```bash
hello
```

<h2 id="cdx-int-5">5. 推理强度</h2>
<p>Codex 默认按 <code>model_reasoning_effort</code> 配置的档位推理。DeepSeek 后端只识别三个真正有区别的档位：</p>
<table>
<thead><tr><th>Codex 传入</th><th>DeepSeek 实际生效</th><th>备注</th></tr></thead>
<tbody>
<tr><td><code>low</code></td><td><strong>low</strong></td><td>关闭思考模式，响应最快、省 token</td></tr>
<tr><td><code>medium</code></td><td>high</td><td>被合并到 high</td></tr>
<tr><td><code>high</code></td><td>high</td><td>日常开发默认档</td></tr>
<tr><td><code>xhigh</code></td><td>high</td><td>被合并到 high</td></tr>
<tr><td><code>max</code></td><td><strong>max</strong></td><td>深度推理，token 最多、速度最慢</td></tr>
</tbody>
</table>

<h2 id="cdx-int-ref">6. 参考链接</h2>
<ul>
<li><a href="https://api-docs.deepseek.com/zh-cn/quick_start/agent_integrations/codex" target="_blank" rel="noopener noreferrer">DeepSeek Codex 接入指南</a></li>
<li><a href="https://api-docs.deepseek.com/zh-cn/guides/thinking_mode" target="_blank" rel="noopener noreferrer">DeepSeek 思考模式文档</a></li>
<li><a href="https://platform.deepseek.com/" target="_blank" rel="noopener noreferrer">DeepSeek 开放平台</a></li>
<li><a href="https://github.com/openai/codex" target="_blank" rel="noopener noreferrer">OpenAI Codex CLI</a></li>
</ul>
<blockquote><p>最后更新：基于 DeepSeek 官方文档 2026-09 抓取版本。两个模型（<code>deepseek-flash</code> / <code>deepseek-v4-pro</code>）均完全支持，本文档更新如有滞后以 DeepSeek 最新公告为准。</p></blockquote>

</div>

</div>

</div>

</div>
