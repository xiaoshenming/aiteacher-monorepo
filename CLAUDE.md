# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI Teacher — 智慧教育平台 monorepo，Nx + pnpm 管理。四个应用：Nuxt 4 前端、两个 Express 5 后端、一个 FastAPI 语音识别服务。

## 常用命令

```bash
# 启动所有服务（推荐）
source ~/.zshrc && pnpm dev:nx

# 启动单个应用
pnpm nx dev frontend          # 前端 :10003
pnpm nx dev backend-main      # 主后端 :10001
pnpm nx dev backend-cloud     # 云存储后端 :10002
pnpm nx dev service-asr       # 语音识别 :10005

# 只启动后端
pnpm dev:backend

# 构建 / 检查 / 测试
pnpm build                    # nx run-many --target=build
pnpm lint                     # nx run-many --target=lint
pnpm test                     # nx run-many --target=test

# 构建单个项目
pnpm nx build frontend

# 停止所有服务
pnpm stop

# Nx 依赖图
pnpm graph                    # :10004
```

### 数据库操作

```bash
mysql -h 127.0.0.1 -u ming -pming aiteacher -e "SQL语句"
```

## 架构

```
frontend (Nuxt 4, :10003)
  ├──→ backend-main (:10001)   用户、课程、AI、教案、消息
  └──→ backend-cloud (:10002)  文件管理、编辑器、数据分析

backend-main ──→ MySQL + Redis + RabbitMQ
backend-cloud ──→ MySQL + Redis
backend-cloud ──→ service-asr (:10005)  语音识别
```

### 前端 (apps/frontend)

- Nuxt 4 + Vue 3，UI 用 Nuxt UI 4 + Tailwind CSS 4
- 状态管理：Pinia（stores 在 `app/stores/`）
- API 请求：`app/composables/useApi.ts` 提供 `apiFetch`（→ backend-main）和 `cloudFetch`（→ backend-cloud），自动附加 JWT
- 路由守卫：`app/middleware/auth.ts`，未登录跳转 `/login`
- 富文本编辑器：Tiptap 3，组件在 `app/components/editor/`
- 3D 渲染：TresJS（Three.js）
- 图表：ECharts（nuxt-echarts）
- 页面结构：`/login`、`/dashboard`、`/user/*`（教师）、`/admin/*`、`/superadmin/*`

### 主后端 (apps/backend-main)

- Express 5，纯 JavaScript（CommonJS）
- 数据库：mysql2 原生查询（无 ORM），连接配置在 `config/db.js`
- 缓存：ioredis，配置在 `config/redis.js`
- 消息队列：amqplib（RabbitMQ）
- 认证：JWT + bcryptjs，中间件在 `model/auth/authUtils.js`
- 角色权限：0=学生, 1=普通用户, 2=教师, 3=管理员, 4=超级管理员
- AI 集成：OpenAI SDK 调用 DeepSeek API，WebSocket 流式输出（`model/ai/wxsocket.js`）
- 日志：Winston（`utils/logger.js`），输出到 `logs/`
- API 文档：Swagger UI 在 `/api-docs`
- 路由模块在 `model/` 下按功能分目录，每个目录含 Router 文件

### 云存储后端 (apps/backend-cloud)

- Express 5，JavaScript（CommonJS）
- 文件上传：Multer 2.0
- 路由在 `router/` 下：pcApi（PC 云盘）、mobileApi（移动端）、umoEditorApi（编辑器）、analytics（统计）、recording（录制）
- ASR 任务队列：`asrQueue.js`，异步调用 service-asr

### 语音识别 (apps/service-asr)

- Python FastAPI + Uvicorn
- FunASR（阿里达摩院）：Nano 模型（高精度转写）+ SenseVoice（实时流式）
- 模型缓存在 `./models` 目录

## 关键约定

- 后端使用原生 SQL 查询，不使用 ORM。新增表或字段需手动写 SQL
- 前端 API 调用统一通过 `useApi()` composable，不要直接用 `$fetch`
- 环境变量在各应用的 `.env` 文件中，前端运行时配置在 `nuxt.config.ts` 的 `runtimeConfig`
- Vue 版本锁定为 3.5.28（根 package.json pnpm overrides）
- 所有 Nx 命令用 `pnpm nx` 前缀执行

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## Nx 工作区指南

- 探索工作区结构时，先调用 `nx-workspace` skill
- 运行任务始终通过 `pnpm nx`（如 `pnpm nx build frontend`），不要直接调用底层工具
- 脚手架任务先调用 `nx-generate` skill
- 不确定 CLI 参数时查 `--help`，不要猜测

<!-- nx configuration end-->
