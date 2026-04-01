# 流式 Markdown 实时渲染 + Pretext 文本布局集成

## 概述

分两阶段增强 AI 教师平台的文本渲染体验：
1. **阶段一**：AI 聊天和教案编辑器的流式 Markdown 实时渲染
2. **阶段二**：Pretext 集成 — 聊天虚拟化、气泡 shrinkwrap、同传面板优化

## 阶段一：流式 Markdown 实时渲染

### 问题

当前 AI 聊天（`AIChatMessages.vue`）流式输出时只显示纯文本（`whitespace-pre-wrap`），完成后才用 MDC 解析 Markdown。教案编辑器（`useEditorCompletion.ts` generate 模式）同样是先插入纯文本，完成后删除再以 Markdown 重新插入。

用户体验：流式过程中看不到格式化内容（标题、列表、代码块、表格），感知上"不够智能"。

### 方案

创建 `useStreamingMarkdown` composable，基于 markdown-it 做增量渲染：

```
每收到 chunk → 累积到 buffer → markdown-it 解析完整 buffer → 输出 HTML
未闭合标记（如 **未闭合、```未闭合）→ 容错自动闭合后再解析
```

#### 核心组件

**`app/composables/useStreamingMarkdown.ts`**
- 接收流式 chunk，累积文本
- 用 markdown-it 解析累积文本为 HTML
- 处理未闭合标记的容错（自动闭合 `**`、`` ` ``、````、`- ` 等）
- 节流渲染（每 30-50ms 最多渲染一次，避免高频 chunk 导致卡顿）
- 导出 `{ html, isComplete, feed(chunk), reset() }`

**`app/components/ai/StreamingMarkdown.vue`**
- 接收 `html` 和 `isComplete` props
- 流式中：用 `v-html` 渲染增量 HTML + 尾部闪烁光标
- 完成后：切换到 MDC 组件做最终精确渲染（确保 Shiki 代码高亮等完整功能）

#### 改动点

1. `AIChatMessages.vue` — 流式消息从 `<div class="whitespace-pre-wrap">` 改为 `<StreamingMarkdown>`
2. `useEditorCompletion.ts` generate 模式 — 流式阶段仍然逐 chunk 插入纯文本（保持实时反馈），但用 `useStreamingMarkdown` 在编辑器旁边或下方显示格式化预览。流式结束后，删除纯文本并以 Markdown 格式重新插入（保留现有的两阶段策略，但增加了流式预览）。这比直接在 Tiptap 中做增量 Markdown 插入更稳定，因为 Tiptap 的 Markdown 解析是全量的，频繁调用会导致性能问题。

#### 容错策略

流式 Markdown 的核心难点是不完整语法。处理规则：

| 未闭合标记 | 容错方式 |
|-----------|---------|
| `**加粗` 未闭合 | 追加 `**` 闭合 |
| `` `代码` `` 未闭合 | 追加 `` ` `` 闭合 |
| ```` ``` ```` 代码块未闭合 | 追加 ```` ``` ```` 闭合 |
| `- 列表项` 无换行 | 正常渲染，不需要特殊处理 |
| `| 表格 |` 未完成 | 等待更多行再渲染表格部分 |
| `# 标题` | 正常渲染 |

#### 节流策略

- 使用 `requestAnimationFrame` 节流，每帧最多渲染一次
- chunk 累积到 buffer，RAF 回调时批量解析
- 避免每个 chunk（可能只有几个字符）都触发一次完整的 markdown-it 解析

## 阶段二：Pretext 集成

### 依赖

```bash
pnpm add @chenglou/pretext --filter frontend
```

### 2.1 usePretext composable

**`app/composables/usePretext.ts`**

封装 Pretext 的 `prepare` / `layout` API，提供 Vue 响应式接口：

```ts
// 核心能力
measureHeight(text, font, maxWidth, lineHeight) → number  // 预测文本高度
shrinkWrap(text, font, maxWidth, lineHeight) → number      // 计算最紧凑宽度
```

- 内部维护 `prepare()` 缓存，相同 text+font 不重复计算
- 提供 `clearCache()` 用于内存管理

### 2.2 AI 聊天虚拟化

**问题**：长对话（100+ 条消息）所有消息都在 DOM 中，滚动性能下降。

**方案**：用 Pretext 预计算每条消息高度，实现虚拟滚动。

**`app/components/ai/VirtualChatMessages.vue`**
- 替代当前的 `UChatMessages` 组件（或包装它）
- 用 `usePretext().measureHeight()` 预计算每条消息的渲染高度
- 只渲染可视区域 ± 缓冲区的消息
- 用绝对定位 + transform 放置每条消息
- 滚动时动态计算哪些消息可见

**高度预测逻辑**：
- 用户消息：纯文本，直接用 Pretext `layout()` 计算
- AI 消息：Markdown 渲染后的高度更复杂，用 Pretext 估算文本部分 + 固定 padding 补偿代码块/表格等块级元素
- 首次渲染后用实际 DOM 高度校准缓存，后续使用缓存值

**触发条件**：消息数 > 50 时启用虚拟化，少于 50 条用原生渲染（避免过度优化）。

### 2.3 聊天气泡 Shrinkwrap

**问题**：短消息（如"好的"、"收到"）的气泡宽度和长消息一样宽，浪费空间。

**方案**：用 Pretext 的 `walkLineRanges()` 计算最紧凑的气泡宽度。

在 `VirtualChatMessages.vue` 或独立的 `ChatBubble.vue` 中：
- 对用户消息，用 `walkLineRanges` 二分搜索最小宽度使行数不变
- 设置 `max-width` 为计算出的最紧凑宽度 + padding
- 短消息自动收窄，长消息保持正常宽度

### 2.4 同传面板虚拟化

**问题**：长时间同传产生大量文本条目（`TranscriptPanel.vue`），当前全部渲染在 DOM 中。

**方案**：与聊天虚拟化类似，用 Pretext 预计算每条转写/翻译的高度，实现虚拟滚动。

改动 `TranscriptPanel.vue`：
- 消息数 > 100 时启用虚拟化
- 用 `usePretext().measureHeight()` 预计算高度
- 保持自动滚动到底部的行为

### 2.5 教案编辑器流式高度预测

**问题**：流式插入内容时，编辑器高度突变导致滚动跳动。

**方案**：用 Pretext 预测即将插入的文本高度，提前调整编辑器容器高度。

在 `useEditorCompletion.ts` 中：
- 流式开始时，用当前累积文本预测最终高度
- 提前设置编辑器 `min-height`，避免内容增长时的布局跳动
- 流式结束后移除 `min-height` 约束

## 实施顺序

1. **阶段一 Step 1**：`useStreamingMarkdown` composable + `StreamingMarkdown.vue` 组件
2. **阶段一 Step 2**：改造 `AIChatMessages.vue` 使用流式 Markdown
3. **阶段一 Step 3**：改造 `useEditorCompletion.ts` generate 模式
4. **阶段二 Step 1**：安装 Pretext，创建 `usePretext` composable
5. **阶段二 Step 2**：`VirtualChatMessages.vue` 虚拟化 + shrinkwrap
6. **阶段二 Step 3**：`TranscriptPanel.vue` 虚拟化
7. **阶段二 Step 4**：教案编辑器流式高度预测

## 不做的事

- 不替换 Nuxt UI 的 `UChatMessages` 组件内部实现，只在外层包装
- 不用 Pretext 替代 CSS `line-clamp` / `truncate` — CSS 处理得很好
- 不用 Pretext 做 masonry 布局 — 项目中没有这个需求
- 不用 Pretext 替代 `UTextarea autoresize` — Nuxt UI 内置处理足够
- 不做 Canvas/WebGL 渲染 — 保持 DOM 渲染，Pretext 只用于测量
