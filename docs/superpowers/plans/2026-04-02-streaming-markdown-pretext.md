# 流式 Markdown + Pretext 集成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 AI 聊天和教案编辑器在流式输出时实时渲染 Markdown，并用 Pretext 为聊天和同传面板提供虚拟化滚动和气泡 shrinkwrap。

**Architecture:** 阶段一用 `marked`（已有依赖 v17）+ `isomorphic-dompurify`（已有）做流式增量 Markdown 渲染，通过 RAF 节流避免高频重渲染。阶段二用 `@chenglou/pretext` 的 `prepare`/`layout`/`walkLineRanges` API 预计算文本高度和最紧凑宽度，驱动虚拟滚动和气泡 shrinkwrap。

**Tech Stack:** Vue 3 / Nuxt 4, marked v17, isomorphic-dompurify, @chenglou/pretext, Tiptap 3

---

## File Structure

### 阶段一：流式 Markdown

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `app/composables/useStreamingMarkdown.ts` | 流式 Markdown 增量解析 + RAF 节流 + 容错闭合 |
| Create | `app/components/ai/StreamingMarkdown.vue` | 流式/完成态切换渲染组件 |
| Modify | `app/components/ai/AIChatMessages.vue` | 流式消息改用 StreamingMarkdown |
| Modify | `app/components/editor/AIGenerateDialog.vue` | 添加流式 Markdown 预览面板 |

### 阶段二：Pretext

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `app/composables/usePretext.ts` | Pretext API 的 Vue 封装 |
| Create | `app/composables/useVirtualScroll.ts` | 通用虚拟滚动引擎（Pretext 驱动高度预测） |
| Modify | `app/components/ai/AIChatMessages.vue` | 消息数 > 50 时启用虚拟化 + shrinkwrap |
| Modify | `app/components/interpreter/TranscriptPanel.vue` | 条目数 > 100 时启用虚拟化 |

---

## Task 1: useStreamingMarkdown composable

**Files:**
- Create: `apps/frontend/app/composables/useStreamingMarkdown.ts`

- [ ] **Step 1: Create the composable**

```ts
import { Marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

/**
 * 流式 Markdown 增量渲染 composable
 * 每收到 chunk 累积文本，通过 RAF 节流批量解析，未闭合标记自动容错闭合
 */
export function useStreamingMarkdown() {
  const buffer = ref('')
  const html = ref('')
  const isComplete = ref(false)

  const marked = new Marked({
    breaks: true,
    gfm: true,
  })

  let rafId: number | null = null
  let dirty = false

  /** 自动闭合未完成的 Markdown 标记 */
  function autoClose(text: string): string {
    let result = text

    // 闭合未完成的代码块 ```
    const fenceCount = (result.match(/^```/gm) || []).length
    if (fenceCount % 2 !== 0) {
      result += '\n```'
    }

    // 闭合未完成的行内代码 `
    const backtickCount = (result.match(/(?<!`)`(?!`)/g) || []).length
    if (backtickCount % 2 !== 0) {
      result += '`'
    }

    // 闭合未完成的加粗 **
    const boldCount = (result.match(/\*\*/g) || []).length
    if (boldCount % 2 !== 0) {
      result += '**'
    }

    // 闭合未完成的斜体 *（排除 ** 已处理的）
    const allStars = (result.match(/\*/g) || []).length
    const boldStars = (result.match(/\*\*/g) || []).length * 2
    const italicStars = allStars - boldStars
    if (italicStars % 2 !== 0) {
      result += '*'
    }

    // 闭合未完成的删除线 ~~
    const strikeCount = (result.match(/~~/g) || []).length
    if (strikeCount % 2 !== 0) {
      result += '~~'
    }

    return result
  }

  function render() {
    if (!dirty) return
    dirty = false
    rafId = null

    const closed = autoClose(buffer.value)
    const raw = marked.parse(closed) as string
    html.value = DOMPurify.sanitize(raw)
  }

  function scheduleRender() {
    dirty = true
    if (rafId === null) {
      rafId = requestAnimationFrame(render)
    }
  }

  /** 喂入一个流式 chunk */
  function feed(chunk: string) {
    buffer.value += chunk
    scheduleRender()
  }

  /** 流式结束，做最终渲染 */
  function finish() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    dirty = true
    render()
    isComplete.value = true
  }

  /** 重置状态，准备下一次流式 */
  function reset() {
    buffer.value = ''
    html.value = ''
    isComplete.value = false
    dirty = false
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  onUnmounted(() => {
    if (rafId !== null) cancelAnimationFrame(rafId)
  })

  return {
    html: readonly(html),
    rawText: readonly(buffer),
    isComplete: readonly(isComplete),
    feed,
    finish,
    reset,
  }
}
```

- [ ] **Step 2: Verify no syntax errors**

Run IDE diagnostics on `useStreamingMarkdown.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/composables/useStreamingMarkdown.ts
git commit -m "feat: add useStreamingMarkdown composable for incremental markdown rendering"
```

---

## Task 2: StreamingMarkdown.vue 组件

**Files:**
- Create: `apps/frontend/app/components/ai/StreamingMarkdown.vue`

- [ ] **Step 1: Create the component**

```vue
<script setup lang="ts">
const props = defineProps<{
  content: string
  streaming: boolean
}>()

const { html, isComplete, feed, finish, reset } = useStreamingMarkdown()

let lastLength = 0
watch(() => props.content, (newContent) => {
  if (!newContent) {
    reset()
    lastLength = 0
    return
  }
  const delta = newContent.slice(lastLength)
  if (delta) feed(delta)
  lastLength = newContent.length
})

watch(() => props.streaming, (streaming) => {
  if (!streaming && props.content) finish()
})

onUnmounted(() => reset())
</script>

<template>
  <div class="streaming-markdown">
    <MDC
      v-if="isComplete"
      :value="content"
      class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
    />
    <div
      v-else
      class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
      v-html="html"
    />
    <span
      v-if="streaming && !isComplete"
      class="inline-block w-2 h-4 bg-primary-500 rounded-sm animate-pulse ml-0.5 align-text-bottom"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/components/ai/StreamingMarkdown.vue
git commit -m "feat: add StreamingMarkdown component for real-time markdown rendering"
```

---

## Task 3: 改造 AIChatMessages.vue 使用流式 Markdown

**Files:**
- Modify: `apps/frontend/app/components/ai/AIChatMessages.vue:52-54`

- [ ] **Step 1: Replace streaming plain text with StreamingMarkdown**

In `apps/frontend/app/components/ai/AIChatMessages.vue`, find lines 52-54:

```vue
<MDC v-if="chatStatus !== 'streaming' || message.id !== activeConversation?.messages[activeConversation.messages.length - 1]?.id" :value="message.content" class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0" />
<div v-else class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{{ message.content }}</div>
```

Replace with:

```vue
<StreamingMarkdown
  v-if="chatStatus === 'streaming' && message.id === activeConversation?.messages[activeConversation.messages.length - 1]?.id"
  :content="message.content"
  :streaming="true"
/>
<MDC
  v-else
  :value="message.content"
  class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
/>
```

- [ ] **Step 2: Manual test**

Run: `source ~/.zshrc && pnpm nx dev frontend`
1. 打开 AI 聊天页面，发送消息
2. 验证：流式过程中能看到格式化的标题、列表、代码块
3. 验证：流式结束后切换到 MDC 渲染，Shiki 代码高亮正常
4. 验证：闪烁光标在流式中可见，结束后消失

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/components/ai/AIChatMessages.vue
git commit -m "feat: enable real-time markdown rendering during AI chat streaming"
```

---

## Task 4: 教案编辑器 AI 生成对话框添加流式预览

**Files:**
- Modify: `apps/frontend/app/components/editor/AIGenerateDialog.vue`

- [ ] **Step 1: Add streaming markdown preview to the dialog**

In `apps/frontend/app/components/editor/AIGenerateDialog.vue`, add a `previewContent` prop and show a preview panel when generating:

Update the script section — add new prop:

```vue
<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

const props = defineProps<{
  editor?: Editor
  loading?: boolean
  previewContent?: string
}>()
```

Update the template `#body` slot — add preview panel below the textarea:

```vue
<template #body>
  <div class="flex flex-col gap-4">
    <UTextarea
      v-model="prompt"
      :disabled="loading"
      placeholder="请描述您的教案需求，例如：&#10;• 小学三年级语文《荷花》第一课时教案&#10;• 初中物理《牛顿第一定律》探究式教学设计&#10;• 高中英语 Unit 3 Reading 阅读课教案"
      :rows="5"
      autofocus
      @keydown.meta.enter="onGenerate"
      @keydown.ctrl.enter="onGenerate"
    />
    <p class="text-xs text-muted">按 Ctrl+Enter 快速生成</p>

    <!-- 流式生成预览 -->
    <div v-if="loading && previewContent" class="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 max-h-80 overflow-y-auto">
      <div class="flex items-center gap-2 mb-3">
        <UIcon name="i-lucide-eye" class="size-4 text-primary-500" />
        <span class="text-xs font-medium text-muted">实时预览</span>
      </div>
      <StreamingMarkdown :content="previewContent" :streaming="true" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Wire up previewContent in LessonPlanEditor.vue**

In `apps/frontend/app/components/editor/LessonPlanEditor.vue`, expose `completionText` from `useEditorCompletion` and pass it to the dialog.

First, update the destructuring (around line 20):

```ts
const { extension: completionExtension, handlers: aiHandlers, isLoading: aiLoading, triggerGenerate, stop: stopGenerate, completionText } = useEditorCompletion(editorRef)
```

Then update the dialog component (around line 201):

```vue
<EditorAIGenerateDialog
  v-model="generateDialogOpen"
  :editor="editor"
  :loading="aiLoading"
  :preview-content="completionText"
  @generate="onGenerate"
  @stop="onStopGenerate"
/>
```

- [ ] **Step 3: Expose completionText from useEditorCompletion**

In `apps/frontend/app/composables/useEditorCompletion.ts`, add `completionText` to the return object (around line 391):

```ts
return {
  extension,
  handlers,
  isLoading,
  mode,
  completionText: readonly(completionText),
  triggerGenerate,
  stop
}
```

- [ ] **Step 4: Manual test**

Run: `source ~/.zshrc && pnpm nx dev frontend`
1. 打开教案编辑器，点击 AI 生成
2. 输入提示词，点击生成
3. 验证：对话框中出现实时预览面板，显示格式化的 Markdown
4. 验证：编辑器中仍然是纯文本流式插入
5. 验证：生成完成后，对话框关闭，编辑器内容变为富文本

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/app/components/editor/AIGenerateDialog.vue \
        apps/frontend/app/components/editor/LessonPlanEditor.vue \
        apps/frontend/app/composables/useEditorCompletion.ts
git commit -m "feat: add real-time markdown preview to lesson plan AI generation dialog"
```

---

## Task 5: 安装 Pretext + usePretext composable

**Files:**
- Create: `apps/frontend/app/composables/usePretext.ts`

- [ ] **Step 1: Install @chenglou/pretext**

```bash
cd /home/ming/data/Project/NodeProject/chap2/aiteacher-monorepo
source ~/.zshrc && pnpm add @chenglou/pretext --filter @aiteacher/frontend
```

- [ ] **Step 2: Create usePretext composable**

```ts
import { prepare, layout, prepareWithSegments, walkLineRanges } from '@chenglou/pretext'
import type { PreparedText, PreparedTextWithSegments } from '@chenglou/pretext'

/** 默认字体，与 CSS --font-sans 保持一致 */
const DEFAULT_FONT = '14px "Noto Sans SC", "Inter", sans-serif'
const DEFAULT_LINE_HEIGHT = 22 // 14px * 1.57 ≈ 22px (prose-sm leading-relaxed)

/** prepare() 结果缓存，避免重复计算 */
const prepareCache = new Map<string, PreparedText>()
const prepareWithSegmentsCache = new Map<string, PreparedTextWithSegments>()

function getCacheKey(text: string, font: string): string {
  return `${font}::${text}`
}

function getPrepared(text: string, font: string): PreparedText {
  const key = getCacheKey(text, font)
  let p = prepareCache.get(key)
  if (!p) {
    p = prepare(text, font)
    prepareCache.set(key, p)
  }
  return p
}

function getPreparedWithSegments(text: string, font: string): PreparedTextWithSegments {
  const key = getCacheKey(text, font)
  let p = prepareWithSegmentsCache.get(key)
  if (!p) {
    p = prepareWithSegments(text, font)
    prepareWithSegmentsCache.set(key, p)
  }
  return p
}

export function usePretext() {
  /**
   * 预测文本渲染高度（不触发 DOM reflow）
   * @param text 纯文本内容
   * @param maxWidth 容器最大宽度 (px)
   * @param font CSS font shorthand，默认 14px Noto Sans SC
   * @param lineHeight 行高 (px)，默认 22
   */
  function measureHeight(
    text: string,
    maxWidth: number,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
  ): number {
    if (!text) return 0
    const p = getPrepared(text, font)
    return layout(p, maxWidth, lineHeight).height
  }

  /**
   * 计算文本的最紧凑宽度（shrinkwrap）
   * 二分搜索最小宽度使行数不变
   * @param text 纯文本内容
   * @param maxWidth 容器最大宽度 (px)
   * @param font CSS font shorthand
   * @param lineHeight 行高 (px)
   */
  function shrinkWrap(
    text: string,
    maxWidth: number,
    font = DEFAULT_FONT,
    lineHeight = DEFAULT_LINE_HEIGHT,
  ): number {
    if (!text) return 0
    const p = getPreparedWithSegments(text, font)

    // 先算出当前宽度下的行数
    const baseResult = layout(p as unknown as PreparedText, maxWidth, lineHeight)
    const targetLines = baseResult.lineCount

    // 找最宽行的实际宽度
    let widestLine = 0
    walkLineRanges(p, maxWidth, (line) => {
      if (line.width > widestLine) widestLine = line.width
    })

    // 二分搜索：找到保持相同行数的最小宽度
    let lo = widestLine * 0.5
    let hi = widestLine + 1
    for (let i = 0; i < 10; i++) {
      const mid = (lo + hi) / 2
      const r = layout(p as unknown as PreparedText, mid, lineHeight)
      if (r.lineCount <= targetLines) {
        hi = mid
      } else {
        lo = mid
      }
    }

    return Math.ceil(hi)
  }

  /** 清除内部缓存 */
  function clearPretextCache() {
    prepareCache.clear()
    prepareWithSegmentsCache.clear()
  }

  return {
    measureHeight,
    shrinkWrap,
    clearCache: clearPretextCache,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/composables/usePretext.ts apps/frontend/package.json pnpm-lock.yaml
git commit -m "feat: add @chenglou/pretext and usePretext composable"
```

---

## Task 6: useVirtualScroll composable

**Files:**
- Create: `apps/frontend/app/composables/useVirtualScroll.ts`

- [ ] **Step 1: Create the virtual scroll composable**

```ts
/**
 * 通用虚拟滚动引擎
 * 接收一个高度预测函数，只渲染可视区域 ± 缓冲区的条目
 */
export interface VirtualScrollOptions {
  /** 总条目数 */
  itemCount: Ref<number>
  /** 预测第 i 个条目的高度 (px) */
  estimateHeight: (index: number) => number
  /** 滚动容器 ref */
  containerRef: Ref<HTMLElement | null>
  /** 上下缓冲区条目数，默认 5 */
  overscan?: number
}

export interface VirtualItem {
  index: number
  offsetTop: number
  height: number
}

export function useVirtualScroll(options: VirtualScrollOptions) {
  const { itemCount, estimateHeight, containerRef, overscan = 5 } = options

  const scrollTop = ref(0)
  const containerHeight = ref(0)

  // 缓存每个条目的实际高度（首次渲染后校准）
  const heightCache = new Map<number, number>()

  function getHeight(index: number): number {
    return heightCache.get(index) ?? estimateHeight(index)
  }

  /** 计算所有条目的累积偏移 */
  function getOffsets(): number[] {
    const offsets: number[] = [0]
    for (let i = 0; i < itemCount.value; i++) {
      offsets.push(offsets[i]! + getHeight(i))
    }
    return offsets
  }

  const totalHeight = computed(() => {
    let h = 0
    for (let i = 0; i < itemCount.value; i++) h += getHeight(i)
    return h
  })

  const visibleItems = computed<VirtualItem[]>(() => {
    if (!containerHeight.value || itemCount.value === 0) return []

    const offsets = getOffsets()
    const top = scrollTop.value
    const bottom = top + containerHeight.value

    // 二分搜索找到第一个可见条目
    let startIdx = 0
    let lo = 0
    let hi = itemCount.value - 1
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (offsets[mid + 1]! <= top) {
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    startIdx = Math.max(0, lo - overscan)

    // 找到最后一个可见条目
    let endIdx = lo
    while (endIdx < itemCount.value && offsets[endIdx]! < bottom) {
      endIdx++
    }
    endIdx = Math.min(itemCount.value - 1, endIdx + overscan)

    const items: VirtualItem[] = []
    for (let i = startIdx; i <= endIdx; i++) {
      items.push({
        index: i,
        offsetTop: offsets[i]!,
        height: getHeight(i),
      })
    }
    return items
  })

  /** 校准实际 DOM 高度 */
  function calibrate(index: number, actualHeight: number) {
    if (Math.abs(getHeight(index) - actualHeight) > 1) {
      heightCache.set(index, actualHeight)
    }
  }

  /** 滚动到底部 */
  function scrollToBottom() {
    const el = containerRef.value
    if (el) el.scrollTop = el.scrollHeight
  }

  // 监听滚动
  function onScroll() {
    const el = containerRef.value
    if (el) {
      scrollTop.value = el.scrollTop
      containerHeight.value = el.clientHeight
    }
  }

  // 初始化容器尺寸
  watch(containerRef, (el) => {
    if (el) {
      containerHeight.value = el.clientHeight
      el.addEventListener('scroll', onScroll, { passive: true })
    }
  }, { immediate: true })

  onUnmounted(() => {
    containerRef.value?.removeEventListener('scroll', onScroll)
  })

  return {
    visibleItems,
    totalHeight,
    calibrate,
    scrollToBottom,
    /** 清除高度缓存 */
    clearHeightCache: () => heightCache.clear(),
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/app/composables/useVirtualScroll.ts
git commit -m "feat: add useVirtualScroll composable with Pretext-driven height estimation"
```

---

## Task 7: AI 聊天虚拟化 + 气泡 Shrinkwrap

**Files:**
- Modify: `apps/frontend/app/components/ai/AIChatMessages.vue`

- [ ] **Step 1: Add virtual scroll and shrinkwrap to AIChatMessages**

Rewrite `apps/frontend/app/components/ai/AIChatMessages.vue` to conditionally use virtual scroll when messages > 50:

```vue
<script setup lang="ts">
import type { ChatMessage } from '~/stores/chatSessions'

const props = defineProps<{
  messages: ChatMessage[]
  chatStatus: 'ready' | 'streaming' | 'submitted' | 'error'
  assistantActions: Record<string, any>
  userActions: Record<string, any>
  editingMessageId: string | null
  editingContent: string
  activeConversation: { messages: ChatMessage[] } | null
}>()

const emit = defineEmits<{
  'update:editingContent': [value: string]
  confirmEdit: []
  cancelEdit: []
}>()

const editValue = computed({
  get: () => props.editingContent,
  set: (val: string) => emit('update:editingContent', val),
})

// Pretext shrinkwrap for user messages
const { shrinkWrap } = usePretext()
const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(600)

// Observe container width for shrinkwrap calculations
const resizeObserver = ref<ResizeObserver | null>(null)
watch(containerRef, (el) => {
  resizeObserver.value?.disconnect()
  if (el) {
    resizeObserver.value = new ResizeObserver(([entry]) => {
      if (entry) containerWidth.value = entry.contentRect.width
    })
    resizeObserver.value.observe(el)
    containerWidth.value = el.clientWidth
  }
}, { immediate: true })
onUnmounted(() => resizeObserver.value?.disconnect())

/** 计算用户消息气泡的最紧凑宽度 */
function getBubbleMaxWidth(message: ChatMessage): string | undefined {
  if (message.role !== 'user' || !message.content) return undefined
  const maxW = containerWidth.value * 0.75 // 气泡最大宽度为容器的 75%
  const shrunk = shrinkWrap(message.content, maxW)
  if (shrunk < maxW - 20) {
    return `${shrunk + 32}px` // +32 for padding
  }
  return undefined
}

// 判断是否是正在流式的最后一条消息
function isStreamingLast(message: ChatMessage): boolean {
  return props.chatStatus === 'streaming'
    && message.id === props.activeConversation?.messages[props.activeConversation.messages.length - 1]?.id
}
</script>

<template>
  <div ref="containerRef" class="flex-1 overflow-y-auto min-h-0">
    <UContainer class="flex flex-col h-full">
      <ClientOnly>
        <UChatMessages
          :messages="(messages as any)"
          :status="chatStatus"
          should-auto-scroll
          :spacing-offset="160"
          :assistant="assistantActions"
          :user="userActions"
          class="flex-1 pb-4"
        >
          <template #content="{ message }">
            <div v-if="editingMessageId === message.id" class="flex flex-col gap-2">
              <UTextarea
                v-model="editValue"
                autoresize
                :rows="2"
                class="w-full"
              />
              <div class="flex gap-1.5">
                <UButton size="xs" label="保存" @click="emit('confirmEdit')" />
                <UButton size="xs" label="取消" color="neutral" variant="ghost" @click="emit('cancelEdit')" />
              </div>
            </div>
            <template v-else-if="message.role === 'assistant' && message.content">
              <StreamingMarkdown
                v-if="isStreamingLast(message)"
                :content="message.content"
                :streaming="true"
              />
              <MDC
                v-else
                :value="message.content"
                class="prose prose-sm dark:prose-invert max-w-none *:first:mt-0 *:last:mb-0"
              />
            </template>
            <p
              v-else
              class="whitespace-pre-wrap"
              :style="getBubbleMaxWidth(message) ? { maxWidth: getBubbleMaxWidth(message) } : {}"
            >
              {{ message.content }}
            </p>
          </template>
        </UChatMessages>
      </ClientOnly>
    </UContainer>
  </div>
</template>
```

Note: Full virtual scroll (replacing UChatMessages entirely) is deferred — the shrinkwrap alone provides immediate visual improvement. Virtual scroll can be added later when performance profiling shows it's needed for 100+ message conversations.

- [ ] **Step 2: Manual test**

Run: `source ~/.zshrc && pnpm nx dev frontend`
1. 发送短消息（如"好的"、"收到"），验证气泡宽度自动收窄
2. 发送长消息，验证气泡保持正常宽度
3. 验证流式 Markdown 仍然正常工作
4. 验证编辑消息功能正常

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/components/ai/AIChatMessages.vue
git commit -m "feat: add Pretext-powered bubble shrinkwrap to AI chat messages"
```

---

## Task 8: 同传面板虚拟化

**Files:**
- Modify: `apps/frontend/app/components/interpreter/TranscriptPanel.vue`

- [ ] **Step 1: Add virtual scroll to TranscriptPanel**

Rewrite `apps/frontend/app/components/interpreter/TranscriptPanel.vue` to use virtual scroll when items > 100:

```vue
<script setup lang="ts">
interface TranscriptItem {
  id: string
  text: string
  corrected: string
  translation: string
  timestamp: number
  isFinal: boolean
  cutReason?: string
}

const props = defineProps<{
  transcripts: TranscriptItem[]
  type: 'source' | 'translation'
  isRecording?: boolean
  calibratingId?: string | null
  getTranslation?: (id: string) => string | undefined
}>()

const emit = defineEmits<{
  calibrate: [id: string, text: string]
}>()

const isSource = computed(() => props.type === 'source')

// Virtual scroll setup
const { measureHeight } = usePretext()
const scrollContainerRef = ref<HTMLElement | null>(null)
const useVirtual = computed(() => props.transcripts.length > 100)

const ITEM_FONT = '14px "Noto Sans SC", "Inter", sans-serif'
const ITEM_LINE_HEIGHT = 22
const ITEM_PADDING = 24 // p-3 = 12px * 2
const TIMESTAMP_HEIGHT = 18 // text-[10px] + margin

function estimateItemHeight(index: number): number {
  const item = props.transcripts[index]
  if (!item) return 60
  const text = isSource.value
    ? item.text
    : (props.getTranslation?.(item.id) || item.translation || '等待翻译...')
  const containerWidth = scrollContainerRef.value?.clientWidth ?? 400
  const textWidth = containerWidth - ITEM_PADDING - (isSource.value ? 80 : 0) // gap for timestamp + button
  const textHeight = measureHeight(text, textWidth, ITEM_FONT, ITEM_LINE_HEIGHT)
  return textHeight + ITEM_PADDING + (isSource.value ? 0 : TIMESTAMP_HEIGHT)
}

const virtualScroll = useVirtualScroll({
  itemCount: computed(() => props.transcripts.length),
  estimateHeight: estimateItemHeight,
  containerRef: scrollContainerRef,
  overscan: 10,
})

// Auto-scroll to bottom when new items arrive
watch(() => props.transcripts.length, () => {
  nextTick(() => virtualScroll.scrollToBottom())
})
</script>

<template>
  <div class="group/panel">
    <div class="flex items-center gap-2 mb-3 px-1">
      <div
        class="flex items-center justify-center size-7 rounded-lg"
        :class="isSource ? 'bg-primary-500/10' : 'bg-sky-500/10'"
      >
        <UIcon
          :name="isSource ? 'i-lucide-text' : 'i-lucide-languages'"
          class="size-4"
          :class="isSource ? 'text-primary-500' : 'text-sky-500'"
        />
      </div>
      <span class="text-sm font-semibold text-highlighted">{{ isSource ? '原文转写' : '翻译结果' }}</span>
      <ClientOnly>
        <UBadge v-if="isSource && isRecording" color="error" size="xs" variant="subtle" class="animate-pulse">
          <span class="flex items-center gap-1">
            <span class="size-1.5 rounded-full bg-red-500" />
            录音中
          </span>
        </UBadge>
      </ClientOnly>
    </div>
    <UCard class="!hover:shadow-none">
      <div ref="scrollContainerRef" class="space-y-1 min-h-[350px] max-h-[500px] overflow-y-auto scrollbar-thin">
        <ClientOnly>
          <template v-if="transcripts.length">
            <!-- 虚拟滚动模式 -->
            <template v-if="useVirtual">
              <div :style="{ height: `${virtualScroll.totalHeight.value}px`, position: 'relative' }">
                <div
                  v-for="vItem in virtualScroll.visibleItems.value"
                  :key="transcripts[vItem.index]!.id"
                  :style="{ position: 'absolute', top: `${vItem.offsetTop}px`, left: 0, right: 0 }"
                >
                  <!-- 原文条目 -->
                  <div
                    v-if="isSource"
                    class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-all duration-200"
                    :class="vItem.index === transcripts.length - 1 ? 'bg-primary-500/5 dark:bg-primary-500/8' : ''"
                  >
                    <div class="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                      <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(transcripts[vItem.index]!.timestamp).toLocaleTimeString() }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm text-highlighted leading-relaxed">{{ transcripts[vItem.index]!.text }}</p>
                    </div>
                    <UButton
                      icon="i-lucide-languages"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                      :loading="calibratingId === transcripts[vItem.index]!.id"
                      title="AI校准翻译"
                      @click="emit('calibrate', transcripts[vItem.index]!.id, transcripts[vItem.index]!.text)"
                    />
                  </div>
                  <!-- 翻译条目 -->
                  <div
                    v-else
                    class="p-3 rounded-lg hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all duration-200"
                    :class="vItem.index === transcripts.length - 1 ? 'bg-sky-500/5 dark:bg-sky-500/8' : ''"
                  >
                    <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(transcripts[vItem.index]!.timestamp).toLocaleTimeString() }}</span>
                    <p class="text-sm text-highlighted mt-1 leading-relaxed">
                      {{ getTranslation?.(transcripts[vItem.index]!.id) || transcripts[vItem.index]!.translation || '等待翻译...' }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- 普通模式（< 100 条） -->
            <template v-else>
              <template v-if="isSource">
                <div
                  v-for="(t, idx) in transcripts"
                  :key="t.id"
                  class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-primary-500/5 dark:hover:bg-primary-500/10 transition-all duration-200"
                  :class="idx === transcripts.length - 1 ? 'bg-primary-500/5 dark:bg-primary-500/8' : ''"
                >
                  <div class="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-highlighted leading-relaxed">{{ t.text }}</p>
                  </div>
                  <UButton
                    icon="i-lucide-languages"
                    size="xs"
                    color="neutral"
                    variant="ghost"
                    class="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"
                    :loading="calibratingId === t.id"
                    title="AI校准翻译"
                    @click="emit('calibrate', t.id, t.text)"
                  />
                </div>
              </template>
              <template v-else>
                <div
                  v-for="(t, idx) in transcripts"
                  :key="t.id"
                  class="p-3 rounded-lg hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all duration-200"
                  :class="idx === transcripts.length - 1 ? 'bg-sky-500/5 dark:bg-sky-500/8' : ''"
                >
                  <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                  <p class="text-sm text-highlighted mt-1 leading-relaxed">
                    {{ getTranslation?.(t.id) || t.translation || '等待翻译...' }}
                  </p>
                </div>
              </template>
            </template>
          </template>
          <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
            <div class="relative mb-4">
              <div
                class="absolute inset-0 rounded-full animate-pulse scale-150"
                :class="isSource ? 'bg-primary-500/10' : 'bg-sky-500/10'"
              />
              <div
                class="relative flex items-center justify-center size-16 rounded-full border"
                :class="isSource
                  ? 'bg-gradient-to-br from-primary-500/20 to-sky-500/20 border-primary-500/20'
                  : 'bg-gradient-to-br from-sky-500/20 to-primary-500/20 border-sky-500/20'"
              >
                <UIcon
                  :name="isSource ? 'i-lucide-mic' : 'i-lucide-languages'"
                  class="size-7"
                  :class="isSource ? 'text-primary-500' : 'text-sky-500'"
                />
              </div>
            </div>
            <p class="text-sm font-medium text-highlighted mb-1">{{ isSource ? '准备就绪' : '等待翻译' }}</p>
            <p class="text-xs text-muted">{{ isSource ? '点击「开始录音」进行语音转写' : '翻译结果将在此实时显示' }}</p>
          </div>
        </ClientOnly>
      </div>
    </UCard>
  </div>
</template>
```

- [ ] **Step 2: Manual test**

Run: `source ~/.zshrc && pnpm nx dev frontend`
1. 打开同声传译页面
2. 少量条目时（< 100），验证正常渲染
3. 如果能模拟大量条目，验证虚拟滚动生效（只有可见区域的 DOM 节点）

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/app/components/interpreter/TranscriptPanel.vue
git commit -m "feat: add Pretext-powered virtual scroll to transcript panel for 100+ items"
```
