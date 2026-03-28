# AI Teacher Monorepo

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/xiaoshenming/aiteacher-monorepo)

智慧教育平台，集成 AI 对话、协作白板、AI PPT 生成、语音识别、同声传译、课堂录制、富文本教案编辑、智能出题、3D 可视化等功能。使用 Nx + pnpm 管理多应用架构。

## 项目结构

```
aiteacher-monorepo/
├── apps/
│   ├── frontend/              # 前端应用 (Nuxt 4, :10003)
│   ├── backend-main/          # 主后端服务 (Express 5, :10001)
│   ├── backend-cloud/         # 云存储后端 (Express 5, :10002)
│   ├── excalidraw/            # 协作白板前端 (React 19 + Vite, :10007)
│   ├── excalidraw-room/       # 白板协作服务 (Express 5 + Socket.IO, :10008)
│   ├── excalidraw-firebase/   # 白板数据持久化 (Firebase Emulator, :10009-10011)
│   ├── service-asr/           # 语音识别服务 (FastAPI, :10005)
│   └── LandPPT/               # AI PPT 生成服务 (FastAPI, :10006)
├── packages/                  # 共享包
├── docs/                      # 文档目录
├── docker-compose.yml         # Docker 编排
├── nx.json                    # Nx 工作区配置
├── pnpm-workspace.yaml        # pnpm 工作区
└── package.json               # 根配置与脚本
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 4 + Vue 3、Nuxt UI 4 + Tailwind CSS 4、Tiptap 3 富文本编辑器、ECharts 6、TresJS (Three.js)、GSAP 动画、Pinia、PWA、@vue-office 文档预览 |
| 协作白板 | React 19 + Excalidraw、Socket.IO 实时协作、Firebase Firestore/Storage 持久化、端到端加密 |
| 主后端 | Express 5、MySQL、Redis、RabbitMQ、WebSocket、JWT、Prometheus 监控、Winston 日志 |
| 云存储后端 | Express 5、MySQL、Redis、Multer 文件上传、FFmpeg 音视频处理、DeepSeek AI（文本变换 + 笔记生成） |
| 白板协作服务 | Express 5 + TypeScript、Socket.IO、ioredis、JWT 认证 |
| 语音识别 | Python FastAPI、FunASR（阿里达摩院 Nano + SenseVoice）、WebSocket 流式识别 |
| PPT 生成 | Python FastAPI、LangChain + LangGraph、多 AI 提供商、Tavily/SearXNG 研究、Playwright、SQLite |
| AI 集成 | DeepSeek API（OpenAI SDK）、SSE + WebSocket 流式输出 |
| 工具链 | Nx 22、pnpm 10、Docker、uv (Python) |

## 服务端口

| 服务 | 开发端口 | Docker 端口 | 说明 |
|------|---------|------------|------|
| backend-main | 10001 | 3000 | 主后端（用户、课程、AI、教案、管理等） |
| backend-cloud | 10002 | 5001 | 云存储（文件管理、编辑器、录制、数据分析） |
| frontend | 10003 | 3001 | 前端应用 |
| Nx Graph | 10004 | — | Nx 依赖可视化 |
| service-asr | 10005 | 8766 | 语音识别 |
| LandPPT | 10006 | — | AI PPT 生成 |
| excalidraw | 10007 | — | 协作白板前端 |
| excalidraw-room | 10008 | — | 白板协作 WebSocket 服务 |
| excalidraw-firebase | 10009-10011 | — | Firebase 模拟器（Firestore/Storage/UI） |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 10+
- Python 3.11+（LandPPT）、Python 3.8+（语音识别）
- uv（Python 包管理，LandPPT 使用）
- MySQL、Redis、RabbitMQ
- Firebase CLI（协作白板持久化）

### 安装依赖

```bash
pnpm install
```

### 环境变量

每个服务需要对应的 `.env` 文件（参考各应用下的 `.env.example`）：

- `apps/backend-main/.env` — MySQL、Redis、RabbitMQ、JWT 密钥、DeepSeek API Key
- `apps/backend-cloud/.env` — MySQL、Redis、JWT 密钥、DeepSeek API Key
- `apps/excalidraw-room/.env` — Redis、JWT 密钥、CORS 源
- `apps/service-asr/.env` — 模型配置
- `apps/LandPPT/.env` — AI 提供商 API Key、研究服务、图片服务、SQLite 路径
- `apps/frontend/.env`（可选）— API 地址覆盖

### 启动服务

```bash
# 启动所有服务（推荐）
pnpm dev:nx

# 只启动后端
pnpm dev:backend

# 只启动前端
pnpm dev:frontend

# 启动 Excalidraw 协作白板（三个服务）
pnpm dev:excalidraw

# 启动单个应用
pnpm nx dev frontend
pnpm nx dev backend-main
pnpm nx dev backend-cloud
pnpm nx dev excalidraw
pnpm nx dev excalidraw-room
pnpm nx dev excalidraw-firebase
pnpm nx dev service-asr
pnpm nx dev LandPPT

# pnpm 原生并行启动（调试用）
pnpm dev:native
```

### 其他命令

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建所有项目 |
| `pnpm lint` | ESLint 检查 |
| `pnpm test` | 运行测试 |
| `pnpm graph` | 启动 Nx Graph 可视化 |
| `pnpm stop` | 停止所有服务 |

## 核心功能

### 前端 (apps/frontend)

- **多角色仪表盘** — 教师、学生、管理员、超级管理员四套独立界面
- **AI 对话** — 基于 DeepSeek 的智能问答，支持 SSE/WebSocket 流式输出
- **协作白板** — Excalidraw 实时多人协作，iframe 嵌入，支持房间管理
- **教案管理** — Tiptap 富文本编辑器，支持 AI 内联补全、文本变换、图片上传、代码高亮、表格、任务列表
- **AI PPT 生成** — 集成 LandPPT，支持研究报告生成和多模板
- **AI 智能出题** — 自动生成试题，支持多题型
- **课堂录制** — 音视频录制、ASR 转录、AI 笔记生成
- **AI 同声传译** — WebSocket 实时语音识别 + 翻译
- **题库与作业** — 题库管理、作业布置与批改
- **数据分析** — ECharts 图表展示（柱状图、折线图、饼图、雷达图、仪表盘）
- **3D 可视化** — TresJS + Three.js + 后处理效果
- **文档预览** — 支持 Word、Excel、PDF、PPT 在线预览
- **打印设计器** — 课堂测验等打印模板设计
- **布局自定义** — 侧边栏/密度/字号/圆角/渐变背景（Zen Browser 风格色彩和谐系统）
- **主题切换** — 亮色/暗色模式，圆形波纹过渡动画
- **VIP 订阅** — 支付/订阅系统
- **PWA 支持** — 离线缓存、可安装为桌面应用
- **超级管理员** — 系统监控、安全中心、数据备份、日志查看、PPT 服务配置

### 主后端 (apps/backend-main)

| 模块 | 路由 | 说明 |
|------|------|------|
| 用户管理 | `/api/users` | 注册、登录、JWT 认证 |
| 学生管理 | `/api/students` | 学生注册、课程、班级、个人信息 |
| 课程管理 | `/api/courses` | 课程 CRUD |
| 班级管理 | `/api/classes` | 班级与学生管理 |
| AI 功能 | `/api/ai` | AI 对话、编辑器补全 |
| 教案管理 | `/api/lessonPlans` | 教案 CRUD |
| 题库管理 | `/api/questionBank` | 题库 CRUD |
| 作业管理 | `/api/assignment` | 作业布置与批改 |
| 资源管理 | `/api/resource` | 教学资源管理 |
| 题目生成 | `/api/bridge` | 智能出题 |
| PPT 生成 | `/api/ppt` | AI 生成 PPT |
| 课程表 | `/api/course-schedule` | 排课管理 |
| 消息通知 | `/api/notifications` | RabbitMQ 消息队列 |
| 新闻资讯 | `/api/news` | 新闻管理 |
| 版本日志 | `/api/changelog` | 更新日志 |
| 管理员 | `/api/admin` | 用户管理、系统监控、安全审计、数据备份、日志查询 |
| API 文档 | `/api-docs` | Swagger UI |
| 监控指标 | `/metrics` | Prometheus 指标 |
| 健康检查 | `/health` | MySQL + Redis 连接状态 |

### 云存储后端 (apps/backend-cloud)

| 模块 | 路由 | 说明 |
|------|------|------|
| PC 云盘 | `/api/pc` | PC 端文件管理 |
| 移动端 | `/api/mobile` | 移动端文件管理 |
| 编辑器 | `/api/editor` | 图片上传、AI 文本变换 |
| 数据分析 | `/api/analytics` | 统计分析 |
| 课堂录制 | `/api/recording` | 录制管理、音视频处理、ASR 转录 |
| 文件下载 | `/api/download` | 文件下载服务 |

### 协作白板 (excalidraw + excalidraw-room + excalidraw-firebase)

- **实时协作** — Socket.IO 多人实时绘图，端到端加密广播
- **房间管理** — REST API 创建/加入/管理房间，每房间最多 20 人，7 天自动过期
- **数据持久化** — Firebase Firestore 存储加密场景数据，Storage 存储上传文件
- **iframe 集成** — 通过 postMessage 与 Nuxt 前端通信，支持 JWT 认证桥接
- **PWA 支持** — 可独立使用的白板应用

### 语音识别 (apps/service-asr)

- **高精度转写** — FunASR Nano 模型，适用于录音后处理
- **实时流式识别** — SenseVoice 模型，低延迟、多语言、情感识别
- **WebSocket 接口** — 支持实时音频流输入

### AI PPT 生成 (apps/LandPPT)

- **多 AI 提供商** — OpenAI、DeepSeek、Kimi、MiniMax、Anthropic、Google Gemini、Ollama、302.AI
- **研究报告** — Tavily / SearXNG 联网搜索，自动生成研究报告
- **图片服务** — Pixabay、Unsplash 搜索 + SiliconFlow、Pollinations AI 生成
- **模板管理** — 支持自定义 PPT 模板
- **OpenAI 兼容 API** — 可作为独立 AI 服务调用

## 项目依赖关系

```
frontend (:10003)
  ├──→ backend-main (:10001)        用户、课程、AI、教案、管理
  ├──→ backend-cloud (:10002)       文件管理、编辑器、录制、数据分析
  ├──→ LandPPT (:10006)            AI PPT 生成
  └──→ excalidraw (:10007)          协作白板 (iframe)
        ├──→ excalidraw-room (:10008)       WebSocket 实时协作
        └──→ excalidraw-firebase (:10009)   场景数据持久化

backend-cloud ──→ service-asr (:10005)  语音识别

backend-main  ──→ MySQL + Redis + RabbitMQ
backend-cloud ──→ MySQL + Redis
excalidraw-room ──→ Redis
excalidraw-firebase ──→ Firestore + Storage (本地模拟器)
service-asr   ──→ FunASR 模型（本地缓存）
LandPPT       ──→ SQLite + 多 AI 提供商 + Tavily/SearXNG
```

## 生产部署

### 环境变量

前端 API 地址通过 Nuxt 运行时配置注入，生产环境设置：

```bash
NUXT_PUBLIC_API_BASE=https://your-domain.com/api/
NUXT_PUBLIC_API_CLOUD=https://your-domain.com/cloud-api/
NUXT_PUBLIC_LANDPPT_BASE=https://your-domain.com/landppt/
```

### Docker

```bash
docker-compose up -d
```

> 注：Excalidraw 三个服务和 LandPPT 目前未包含在 docker-compose.yml 中，需单独部署。

## 开源许可

本项目基于 [AGPL-3.0](LICENSE) 许可证开源。任何基于本项目的二次开发、修改或网络服务部署，均必须公开完整源代码，且不得用于闭源商业化。
