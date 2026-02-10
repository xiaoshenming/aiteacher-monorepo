# AI Teacher Monorepo

智慧教育平台，集成 AI 对话、语音识别、富文本教案编辑、3D 可视化等功能。使用 Nx + pnpm 管理多应用架构。

## 项目结构

```
aiteacher-monorepo/
├── apps/
│   ├── backend-main/       # 主后端服务 (Express, :10001)
│   ├── backend-cloud/      # 云存储后端 (Express, :10002)
│   ├── service-asr/        # 语音识别服务 (FastAPI, :10005)
│   └── frontend/           # 前端应用 (Nuxt 4, :10003)
├── packages/               # 共享包
├── logs/                   # 日志目录
├── docker-compose.yml      # Docker 编排
├── nx.json                 # Nx 工作区配置
├── pnpm-workspace.yaml     # pnpm 工作区
└── package.json            # 根配置与脚本
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 4 + Vue 3、Nuxt UI 4 + Tailwind CSS 4、TresJS (Three.js)、Tiptap 富文本编辑器、ECharts、Pinia |
| 主后端 | Express 5、MySQL、Redis、RabbitMQ、WebSocket、JWT |
| 云存储后端 | Express 5、MySQL、Redis、Multer 文件上传 |
| 语音识别 | Python FastAPI、FunASR（阿里达摩院）、WebSocket 流式识别 |
| AI 集成 | DeepSeek API、阿里百炼 DASHSCOPE、AIPPT |
| 工具链 | Nx 22、pnpm 10、Docker |

## 服务端口

| 服务 | 开发端口 | Docker 端口 | 说明 |
|------|---------|------------|------|
| backend-main | 10001 | 3000 | 主后端（用户、课程、AI、教案等） |
| backend-cloud | 10002 | 5001 | 云存储（文件管理、编辑器、数据分析） |
| frontend | 10003 | 3001 | 前端应用 |
| Nx Graph | 10004 | — | Nx 依赖可视化 |
| service-asr | 10005 | 8766 | 语音识别 |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 10+
- Python 3.10+（语音识别服务）
- MySQL、Redis、RabbitMQ

### 安装依赖

```bash
pnpm install
```

### 环境变量

每个服务需要对应的 `.env` 文件：

- `apps/backend-main/.env` — MySQL、Redis、RabbitMQ、JWT 密钥、AI API Key
- `apps/backend-cloud/.env` — MySQL、Redis、JWT 密钥
- `apps/service-asr/.env` — 模型配置
- `apps/frontend/.env`（可选）— API 地址覆盖

### 启动服务

```bash
# 启动所有服务
pnpm dev

# 只启动后端
pnpm dev:backend

# 只启动前端
pnpm dev:frontend

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
- **AI 对话** — 基于 DeepSeek 的智能问答，支持流式输出
- **教案管理** — Tiptap 富文本编辑器，支持 AI 内联补全、文本变换、图片上传、代码高亮、表格、任务列表
- **3D 可视化** — TresJS + Three.js 场景渲染
- **数据分析** — ECharts 图表展示
- **主题切换** — 亮色/暗色模式，圆形波纹过渡动画

### 主后端 (apps/backend-main)

| 模块 | 路由 | 说明 |
|------|------|------|
| 用户管理 | `/api/users` | 注册、登录、JWT 认证 |
| 课程管理 | `/api/courses` | 课程 CRUD |
| 班级管理 | `/api/classes` | 班级与学生管理 |
| AI 功能 | `/api/ai` | AI 对话、编辑器补全 |
| 教案管理 | `/api/lessonPlans` | 教案 CRUD |
| 题目生成 | `/api/bridge` | 智能出题 |
| PPT 生成 | `/api/ppt` | AI 生成 PPT |
| 课程表 | `/api/course-schedule` | 排课管理 |
| 消息通知 | `/api/notifications` | RabbitMQ 消息队列 |
| 新闻资讯 | `/api/news` | 新闻管理 |
| API 文档 | `/api-docs` | Swagger UI |

### 云存储后端 (apps/backend-cloud)

| 模块 | 路由 | 说明 |
|------|------|------|
| PC 云盘 | `/api/pc` | PC 端文件管理 |
| 移动端 | `/api/mobile` | 移动端文件管理 |
| 编辑器 | `/api/editor` | 图片上传、AI 文本变换 |
| 数据分析 | `/api/analytics` | 统计分析 |
| 课堂录制 | `/api/recording` | 录制管理 |

### 语音识别 (apps/service-asr)

- **高精度转写** — FunASR Nano 模型，适用于录音后处理
- **实时流式识别** — SenseVoice 模型，低延迟、多语言、情感识别
- **WebSocket 接口** — 支持实时音频流输入

## 生产部署

### 环境变量

前端 API 地址通过 Nuxt 运行时配置注入，生产环境设置：

```bash
NUXT_PUBLIC_API_BASE=https://your-domain.com/api/
NUXT_PUBLIC_API_CLOUD=https://your-domain.com/cloud-api/
```

### Docker

```bash
docker-compose up -d
```

## 项目依赖关系

```
frontend ──→ backend-main (API :10001)
         ──→ backend-cloud (文件/编辑器 :10002)

backend-cloud ──→ service-asr (语音识别 :10005)

backend-main ──→ MySQL + Redis + RabbitMQ
backend-cloud ──→ MySQL + Redis
service-asr ──→ FunASR 模型（本地缓存）
```

## 开源许可

本项目基于 [AGPL-3.0](LICENSE) 许可证开源。任何基于本项目的二次开发、修改或网络服务部署，均必须公开完整源代码，且不得用于闭源商业化。
