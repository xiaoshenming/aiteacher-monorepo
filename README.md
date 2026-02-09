# AI Teacher Monorepo

AI Teacher 项目的 Monorepo，使用 Nx 管理多个应用和服务。

## 项目结构

```
aiteacher-monorepo/
├── apps/
│   ├── backend-main/      # 主程序后端 (Express :3000)
│   ├── backend-cloud/     # 云盘后端 (Express :5001)
│   ├── service-asr/       # 语音识别服务 (Python :8766)
│   └── frontend/          # 前端 (Nuxt :3000)
├── packages/              # 共享包
├── nx.json               # Nx 配置
├── pnpm-workspace.yaml   # pnpm 工作区配置
└── package.json          # 根配置
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动服务

#### 方式 1: Nx 启动（推荐，像 TresJS）

```bash
# 启动所有服务
pnpm dev

# 只启动后端
pnpm dev:backend

# 只启动前端
pnpm dev:frontend
```

#### 方式 2: pnpm 原生启动（用于调试）

```bash
# 启动所有服务
pnpm dev:native
```

### Nx 可视化界面

```bash
# 启动 Nx Graph
pnpm nx graph

# 访问 http://localhost:7777/configs
```

### 其他命令

| 命令 | 说明 |
|------|------|
| `pnpm build` | 构建所有项目 |
| `pnpm lint` | 检查所有项目 |
| `pnpm test` | 测试所有项目 |
| `pnpm stop` | 停止所有服务 |

## 服务端口

| 服务 | 端口 |
|------|------|
| 主程序后端 | 3000 |
| 云盘后端 | 5001 |
| 语音服务 | 8766 |
| 前端 | 3000 |

## 环境变量

确保每个服务都有对应的 `.env` 文件：

- `apps/backend-main/.env`
- `apps/backend-cloud/.env`
- `apps/service-asr/.env`
- `apps/frontend/.env`（可选）
