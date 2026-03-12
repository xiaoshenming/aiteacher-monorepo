# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI Teacher — 智慧教育平台 monorepo，Nx + pnpm 管理。八个应用：Nuxt 4 前端、两个 Express 5 后端、Excalidraw 协作白板（前端 + 协作服务 + Firebase 模拟器）、FastAPI 语音识别服务、FastAPI PPT 生成服务。

## 常用命令

```bash
# 启动所有服务（推荐）
source ~/.zshrc && pnpm dev:nx

# 启动单个应用
pnpm nx dev frontend              # 前端 :10003
pnpm nx dev backend-main          # 主后端 :10001
pnpm nx dev backend-cloud         # 云存储后端 :10002
pnpm nx dev excalidraw            # 白板前端 :10007
pnpm nx dev excalidraw-room       # 白板协作服务 :10008
pnpm nx dev excalidraw-firebase   # Firebase 模拟器 :10009-10011
pnpm nx dev service-asr           # 语音识别 :10005
pnpm nx dev LandPPT               # PPT 生成 :10006

# 只启动后端
pnpm dev:backend

# 启动 Excalidraw 协作白板（三个服务）
pnpm dev:excalidraw

# 构建 / 检查 / 测试
pnpm build                        # nx run-many --target=build
pnpm lint                         # nx run-many --target=lint
pnpm test                         # nx run-many --target=test

# 构建单个项目
pnpm nx build frontend

# 停止所有服务
pnpm stop

# Nx 依赖图
pnpm graph                        # :10004
```

### 数据库操作

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "SQL语句"
```

## 架构

```
frontend (Nuxt 4, :10003)
  ├──→ backend-main (:10001)        用户、课程、AI、教案、管理、消息
  ├──→ backend-cloud (:10002)       文件管理、编辑器、录制、数据分析
  ├──→ LandPPT (:10006)            AI PPT 生成
  └──→ excalidraw (:10007)          协作白板 (iframe 嵌入)
        ├──→ excalidraw-room (:10008)       WebSocket 实时协作
        └──→ excalidraw-firebase (:10009)   Firestore + Storage 持久化

backend-main  ──→ MySQL + Redis + RabbitMQ
backend-cloud ──→ MySQL + Redis
backend-cloud ──→ service-asr (:10005)  语音识别（ASR 任务队列）
excalidraw-room ──→ Redis（房间数据，TTL 7天）
LandPPT ──→ SQLite + 多 AI 提供商
```

### 前端 (apps/frontend)

- Nuxt 4 + Vue 3，UI 用 Nuxt UI 4 + Tailwind CSS 4
- 状态管理：Pinia + pinia-plugin-persistedstate（stores 在 `app/stores/`）
  - `user.ts` 用户状态、`chatSessions.ts` AI 聊天会话、`layout.ts` 布局自定义（渐变背景、侧边栏、密度等）
- API 请求：`app/composables/useApi.ts` 提供 `apiFetch`（→ backend-main）、`cloudFetch`（→ backend-cloud），自动附加 JWT
- LandPPT 集成：`app/composables/useLandPPT.ts`
- 白板集成：`app/composables/useWhiteboard.ts`（调用 excalidraw-room REST API）、`app/components/whiteboard/ExcalidrawEmbed.vue`（iframe + postMessage）
- AI 流式通信：`useSSE.ts`（SSE 流式请求）、`useAIChat.ts`（AI 对话）、`useAINotes.ts`（AI 笔记）
- 课堂录制：`useMediaRecorder.ts`、`useMediaStream.ts`、`useRecordings.ts`、`useTranscript.ts`
- 同声传译：`useInterpreter.ts`（WebSocket 实时语音识别 + 翻译）
- 路由守卫：`app/middleware/auth.global.ts`（全局）、`auth.ts`、`role-guard.ts`
- 富文本编辑器：Tiptap 3，组件在 `app/components/editor/`，含 AI 补全、拖拽、表情、导出等扩展
- 3D 渲染：TresJS（Three.js）+ 后处理效果
- 图表：ECharts 6（nuxt-echarts），支持 Bar/Line/Pie/Radar/Gauge
- 动画：GSAP
- 文档预览：@vue-office（docx/excel/pdf/pptx）
- 打印设计器：hiprint（`useHiprint.ts`）
- PWA 支持：@vite-pwa/nuxt
- Markdown 渲染：@nuxtjs/mdc + Shiki 代码高亮
- 页面结构：
  - `/login` 登录注册
  - `/dashboard` 仪表盘
  - `/user/*` 教师端（白板、录制、同传、出题、题库、作业、教案、PPT、课程表、分析、订阅等）
  - `/student/*` 学生端（首页仪表盘、课程、课程表、作业、考试、成绩、学情分析、个人中心、协作白板）
  - `/admin/*` 管理员
  - `/superadmin/*` 超级管理员（监控、安全、备份、日志、PPT 配置）

### 前端 UI 风格规范

修改或新建前端页面时，必须遵守以下设计系统，保持全站视觉一致性。

**主题色（app.config.ts）**
- 主色：`teal`（通过 `text-primary`, `bg-primary`, `border-primary` 等语义类使用）
- 中性色：`zinc`
- 不要使用鲜艳的蓝紫色渐变（如 `from-blue-500 to-indigo-600`），不要使用高饱和度的多彩渐变背景

**语义 Token（优先使用，自动适配暗色模式）**
- 文字层级：`text-highlighted`（强调）> 默认 > `text-muted`（次要）> `text-dimmed`（最弱）
- 背景层级：`bg-elevated`（侧边栏）> `bg-default`（卡片）> `bg-accented`（hover/骨架屏）
- 边框：`border-default`

**卡片样式**
- 标准卡片：`rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50`
- hover 效果：`hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`
- UCard 全局已配置 hover 上浮效果，无需重复添加
- 参考组件：`app/components/course/Card.vue`

**颜色使用规则**
- 辅助色用半透明：`bg-teal-500/10 text-teal-500`、`bg-blue-500/10 text-blue-500` 等
- 图标背景：`w-10 h-10 rounded-lg bg-xxx-500/10 flex items-center justify-center`
- 装饰性渐变横幅（低饱和度）：`bg-gradient-to-r from-primary/10 via-primary/5 to-transparent`
- 分数/状态着色：>=90 `text-green-600`、>=70 `text-primary`、<70 `text-amber-600`

**组件使用**
- UBadge：`variant="subtle"` + `size="sm"` 或 `size="xs"`
- UButton：`variant="soft"` / `variant="ghost"` / `color="neutral"` 用于次要操作，`color="primary"` 用于主操作
- 页面布局：`UDashboardPanel` > `#header`（`UDashboardNavbar` + `UDashboardSidebarCollapse`）> `#body`
- 图表容器：`<ClientOnly><DashboardChartLazy title="xxx" :option="xxxOption" /></ClientOnly>`

**ECharts 图表配色**
- 主色：`#14b8a6`（teal-500）
- 面积填充：`rgba(20, 184, 166, 0.1)`
- 雷达图填充：`rgba(20, 184, 166, 0.2)`
- 辅助色：`#99f6e4`（teal-200）、`#0d9488`（teal-600）

**暗色模式**
- 所有硬编码颜色必须有 `dark:` 对应（如 `bg-white dark:bg-zinc-800/50`）
- 优先使用语义 token 自动适配
- 课程表等多色区分场景用柔和半透明色：`bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800`

**布局自定义系统**
- `app/stores/layout.ts`（Pinia 持久化）管理所有布局偏好
- 支持：侧边栏位置/宽度/毛玻璃、密度（compact/comfortable/spacious）、圆角（none/small/large）、字号、Zen 渐变背景等
- 布局组件在 `app/layouts/dashboard.vue`

### 主后端 (apps/backend-main)

- Express 5，纯 JavaScript（CommonJS）
- 数据库：mysql2 原生查询（无 ORM），连接配置在 `config/db.js`
- 缓存：ioredis，配置在 `config/redis.js`
- 心跳检测：`config/heartbeat.js`，每 5 分钟检测 Redis + MySQL
- 消息队列：amqplib（RabbitMQ）
- 认证：JWT + bcryptjs，中间件在 `model/auth/authUtils.js`
- 角色权限：0=学生, 1=普通用户, 2=教师, 3=管理员, 4=超级管理员
- AI 集成：OpenAI SDK 调用 DeepSeek API，WebSocket 流式输出（`model/ai/wxsocket.js`）
- 日志：Winston（`utils/logger.js`），输出到 `logs/`
- API 文档：Swagger UI 在 `/api-docs`
- 监控：Prometheus 指标在 `/metrics`（prom-client），自定义指标在 `middleware/metrics.js`
- 限流：express-rate-limit（globalLimiter、authLimiter、aiLimiter），配置在 `middleware/rateLimiter.js`
- 错误处理：`middleware/errorHandler.js`（统一错误处理 + AppError 类 + asyncHandler）
- 请求验证：`middleware/validators.js`（express-validator，覆盖注册/登录/AI/教案/课程等）
- 错误码：`utils/errorCodes.js`（统一错误码字典 1000-8999）
- Token 计数：`utils/tokenCounter.js`（gpt-tokenizer）
- 路由模块在 `model/` 下按功能分目录：
  - `user/` 用户管理、`student/` 学生模块、`course/` 课程、`class/` 班级、`ai/` AI 对话
  - `edu/` 教育模块（lessonPlans 教案、questionBank 题库、assignment 作业、resource 资源）
  - `ppt/` PPT 生成、`question/` 题目生成、`schedule/` 课程表
  - `rabbitmq/` 消息通知、`news/` 新闻、`changelog/` 版本日志
  - `admin/` 管理员（用户 CRUD、系统监控、安全审计、数据备份、日志查询、仪表盘统计）
  - `email/` 邮件验证、`wx/` 微信集成、`static/` 文件上传

### 云存储后端 (apps/backend-cloud)

- Express 5，JavaScript（CommonJS）
- 文件上传：Multer 2.0
- AI 集成：OpenAI SDK 调用 DeepSeek API
  - `utils/aiService.js` — 编辑器 AI 文本变换
  - `utils/noteService.js` — AI 笔记生成（结构化笔记、关键词提取、课程摘要）
- 音视频处理：`utils/mediaUtils.js`（FFmpeg 提取音频，转 16kHz 单声道 WAV 适配 FunASR）
- ASR 任务队列：`utils/asrQueue.js`，2 个 Worker 异步调用 service-asr
- 路由在 `router/` 下：pcApi（PC 云盘）、mobileApi（移动端）、umoEditorApi（编辑器）、analytics（统计）、recording（录制）、apidownload（文件下载）
- 存储目录：`storage/`（audio/ 录制音频、chunks/ 分块上传、editor/ 编辑器文件、files/ PC 云盘、mobile_files/ 移动端）

### 协作白板 (apps/excalidraw + excalidraw-room + excalidraw-firebase)

**excalidraw**（前端，:10007）：
- React 19 + Vite 5，基于 Excalidraw 开源项目
- Jotai 状态管理，Socket.IO Client 实时协作
- Firebase SDK 11.3 连接本地模拟器
- iframe 认证桥接：`excalidraw-app/auth/auth-bridge.ts`（postMessage 与 Nuxt 交换 JWT）
- 协作核心：`excalidraw-app/collab/Collab.tsx`（场景同步）、`Portal.tsx`（加密广播）
- 数据持久化：`excalidraw-app/data/firebase.ts`（Firestore 场景 + Storage 文件）
- 内部 monorepo 结构：`excalidraw-app/` + `packages/`（common、element、excalidraw、math、utils）

**excalidraw-room**（协作服务，:10008）：
- Express 5 + TypeScript，Socket.IO 4.8
- Redis 存储房间数据（Hash，TTL 7 天，每房间最多 20 人）
- REST API `/api/rooms`：房间 CRUD、加入/离开/踢人
- Socket.IO 事件：join-room、server-broadcast（加密）、idle-state、room-user-change

**excalidraw-firebase**（数据持久化，:10009-10011）：
- Firebase Emulator Suite（Firestore :10009、Storage :10010、UI :10011）
- 开发环境替代线上 Firebase，数据自动导入/导出到 `data/` 目录

### 语音识别 (apps/service-asr)

- Python FastAPI + Uvicorn（venv 虚拟环境）
- FunASR（阿里达摩院）：Nano 模型（高精度转写）+ SenseVoice（实时流式）
- 模型缓存在 `./models` 目录
- 启动：`./venv/bin/python funasr_service.py`

### PPT 生成 (apps/LandPPT)

- Python FastAPI + Uvicorn，uv 管理依赖
- AI 驱动 PPT 生成，LangChain + LangGraph 工作流引擎
- 多 AI 提供商：OpenAI、DeepSeek、Kimi、MiniMax、Anthropic、Google Gemini、Ollama、302.AI
- 研究功能：Tavily / SearXNG 联网搜索
- 图片服务：Pixabay、Unsplash、SiliconFlow、Pollinations
- 浏览器自动化：Playwright（PPT 渲染/截图）
- 数据库：SQLAlchemy + SQLite（landppt.db）
- 启动命令：`uv run python run.py`
- 代码在 `src/landppt/` 下：`ai/`（AI 提供商）、`api/`（路由）、`services/`（业务逻辑）、`database/`（模型）

## 关键约定

- 后端使用原生 SQL 查询，不使用 ORM。新增表或字段需手动写 SQL
- 前端 API 调用统一通过 `useApi()` composable，不要直接用 `$fetch`
- 白板房间 API 通过 `useWhiteboard()` composable 调用 excalidraw-room
- 环境变量在各应用的 `.env` 文件中，前端运行时配置在 `nuxt.config.ts` 的 `runtimeConfig`
- Vue 版本锁定为 3.5.28，TypeScript 锁定为 5.9.3（根 package.json pnpm overrides）
- 所有 Nx 命令用 `pnpm nx` 前缀执行
- LandPPT 使用 uv 管理 Python 依赖，不使用 pip
- service-asr 使用 venv 虚拟环境，不使用 uv
- excalidraw 应用在 pnpm-workspace.yaml 中被排除（`!apps/excalidraw`），有独立的内部 monorepo
- excalidraw-firebase 也被排除出 pnpm workspace，纯配置项目

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
