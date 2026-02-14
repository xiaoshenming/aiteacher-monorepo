<script setup lang="ts">
import type { Question } from '~/types/question'

const sse = useSSE()
const { addToBank, exportQuestions } = useQuestions()
const toast = useToast()
const saving = ref(false)

const subject = ref('')
const topicInput = ref('')
const count = ref(5)
const difficulty = ref<'简单' | '中等' | '困难'>('中等')
const selectedTypes = ref<string[]>(['选择题'])

const difficultyOptions = [
  { label: '简单', value: '简单' },
  { label: '中等', value: '中等' },
  { label: '困难', value: '困难' },
]

const typeOptions = ['选择题', '填空题', '判断题', '简答题', '计算题']

const rawContent = ref('')
const parsedQuestions = ref<Question[]>([])
const expandedIds = ref<Set<string>>(new Set())
const isGenerated = ref(false)

const difficultyColor: Record<string, string> = {
  '简单': 'success',
  '中等': 'warning',
  '困难': 'error',
}

const typeIcons: Record<string, string> = {
  '选择题': 'i-lucide-list-checks',
  '填空题': 'i-lucide-text-cursor-input',
  '判断题': 'i-lucide-check-circle',
  '简答题': 'i-lucide-message-square-text',
  '计算题': 'i-lucide-calculator',
}

function toggleType(type: string) {
  const idx = selectedTypes.value.indexOf(type)
  if (idx >= 0) {
    if (selectedTypes.value.length > 1) selectedTypes.value.splice(idx, 1)
  }
  else {
    selectedTypes.value.push(type)
  }
}

async function generate() {
  if (!subject.value.trim() || !topicInput.value.trim()) {
    toast.add({ title: '请填写科目和知识点', color: 'warning' })
    return
  }

  rawContent.value = ''
  parsedQuestions.value = []
  isGenerated.value = false
  expandedIds.value = new Set()

  const prompt = `你是一位专业的出题老师。请根据以下要求生成题目：
科目：${subject.value}
知识点：${topicInput.value}
数量：${count.value}题
难度：${difficulty.value}
题型：${selectedTypes.value.join('、')}

请严格按照以下JSON数组格式输出，不要包含其他内容：
[
  {
    "type": "选择题",
    "difficulty": "${difficulty.value}",
    "subject": "${subject.value}",
    "content": "题目内容",
    "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
    "answer": "正确答案",
    "explanation": "解析说明"
  }
]
注意：options字段仅选择题需要，其他题型不需要。请直接输出JSON数组。`

  await sse.stream({
    url: 'ai/chat-stream',
    body: { prompt, model: 'deepseek-chat' },
    callbacks: {
      onMessage(chunk: string) {
        rawContent.value += chunk
      },
      onDone() {
        parseQuestions()
        isGenerated.value = true
      },
      onError(err: string) {
        toast.add({ title: '生成失败', description: err, color: 'error' })
      },
    },
  })
}

function parseQuestions() {
  try {
    // 提取 JSON 数组（可能被 markdown 代码块包裹）
    let jsonStr = rawContent.value.trim()
    const match = jsonStr.match(/\[[\s\S]*\]/)
    if (match) jsonStr = match[0]

    const arr = JSON.parse(jsonStr)
    parsedQuestions.value = arr.map((item: Record<string, unknown>) => ({
      id: crypto.randomUUID(),
      type: item.type || '选择题',
      difficulty: item.difficulty || difficulty.value,
      subject: item.subject || subject.value,
      content: item.content || '',
      options: item.options || undefined,
      answer: item.answer || '',
      explanation: item.explanation || '',
      createdAt: new Date().toISOString(),
    })) as Question[]
  }
  catch {
    toast.add({ title: '题目解析失败，请查看原始内容', color: 'warning' })
  }
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id)
  }
  else {
    expandedIds.value.add(id)
  }
}

async function addAllToBank() {
  if (!parsedQuestions.value.length || saving.value) return
  saving.value = true
  try {
    const result = await addToBank(parsedQuestions.value)
    toast.add({ title: `已添加 ${result.count} 道题到题库`, color: 'success' })
  }
  catch {
    toast.add({ title: '添加失败，请重试', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

async function addOneToBank(q: Question) {
  if (saving.value) return
  saving.value = true
  try {
    await addToBank([q])
    toast.add({ title: '已添加到题库', color: 'success' })
  }
  catch {
    toast.add({ title: '添加失败，请重试', color: 'error' })
  }
  finally {
    saving.value = false
  }
}

function handleExport(format: 'json' | 'text') {
  const content = exportQuestions(parsedQuestions.value as unknown as Array<Record<string, unknown>>, format)
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `题库导出.${format === 'json' ? 'json' : 'txt'}`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: '导出成功', color: 'success' })
}

function stopGenerate() {
  sse.abort()
  parseQuestions()
  isGenerated.value = true
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="AI智能出题">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div v-if="isGenerated && parsedQuestions.length" class="flex items-center gap-1.5">
            <UButton
              icon="i-lucide-database"
              label="加入题库"
              size="sm"
              variant="soft"
              :loading="saving"
              @click="addAllToBank"
            />
            <UButton
              icon="i-lucide-download"
              label="导出JSON"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('json')"
            />
            <UButton
              icon="i-lucide-file-text"
              label="导出文本"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('text')"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 左侧配置面板 -->
          <div class="lg:col-span-1">
            <div class="sticky top-6 space-y-4">
              <!-- 配置卡片 — 渐变边框 -->
              <div class="relative rounded-xl p-[1px] bg-gradient-to-b from-teal-500/30 via-teal-500/10 to-transparent">
                <div class="rounded-xl bg-[var(--ui-bg)] p-5 space-y-5">
                  <!-- 标题 -->
                  <div class="flex items-center gap-2.5">
                    <div class="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-lg shadow-teal-500/20">
                      <UIcon name="i-lucide-settings-2" class="size-4 text-white" />
                    </div>
                    <div>
                      <p class="text-sm font-semibold text-highlighted">出题配置</p>
                      <p class="text-[11px] text-muted">设置参数后点击生成</p>
                    </div>
                  </div>

                  <USeparator />

                  <!-- 科目 -->
                  <div class="space-y-1.5">
                    <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                      <UIcon name="i-lucide-book-open" class="size-3.5" />
                      科目
                    </label>
                    <UInput v-model="subject" placeholder="例如：数学" />
                  </div>

                  <!-- 知识点 -->
                  <div class="space-y-1.5">
                    <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                      <UIcon name="i-lucide-lightbulb" class="size-3.5" />
                      知识点
                    </label>
                    <UTextarea v-model="topicInput" placeholder="例如：二次函数的性质与应用" :rows="2" autoresize />
                  </div>

                  <!-- 数量 -->
                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                        <UIcon name="i-lucide-hash" class="size-3.5" />
                        数量
                      </label>
                      <span class="text-sm font-bold text-teal-500 tabular-nums">{{ count }} 题</span>
                    </div>
                    <div class="relative">
                      <input
                        v-model.number="count"
                        type="range"
                        min="1"
                        max="20"
                        class="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-teal-500/15 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-teal-500/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
                      >
                      <div class="flex justify-between mt-1">
                        <span class="text-[10px] text-muted">1</span>
                        <span class="text-[10px] text-muted">20</span>
                      </div>
                    </div>
                  </div>

                  <!-- 难度 -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                      <UIcon name="i-lucide-gauge" class="size-3.5" />
                      难度
                    </label>
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="opt in difficultyOptions"
                        :key="opt.value"
                        class="flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border"
                        :class="difficulty === opt.value
                          ? opt.value === '简单'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : opt.value === '中等'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                          : 'border-[var(--ui-border)] text-muted hover:border-[var(--ui-border-hover)] hover:text-highlighted'"
                        @click="difficulty = opt.value as any"
                      >
                        {{ opt.label }}
                      </button>
                    </div>
                  </div>

                  <!-- 题型 -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                      <UIcon name="i-lucide-layout-list" class="size-3.5" />
                      题型
                    </label>
                    <div class="flex flex-wrap gap-1.5">
                      <button
                        v-for="t in typeOptions"
                        :key="t"
                        class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border"
                        :class="selectedTypes.includes(t)
                          ? 'bg-teal-500/10 border-teal-500/30 text-teal-600 dark:text-teal-400'
                          : 'border-[var(--ui-border)] text-muted hover:border-[var(--ui-border-hover)] hover:text-highlighted'"
                        @click="toggleType(t)"
                      >
                        <UIcon :name="typeIcons[t] || 'i-lucide-file-question'" class="size-3.5" />
                        {{ t }}
                      </button>
                    </div>
                  </div>

                  <USeparator />

                  <!-- 生成按钮 -->
                  <UButton
                    v-if="!sse.isStreaming.value"
                    label="开始生成"
                    icon="i-lucide-sparkles"
                    size="lg"
                    block
                    @click="generate"
                  />
                  <UButton
                    v-else
                    label="停止生成"
                    icon="i-lucide-square"
                    size="lg"
                    block
                    color="neutral"
                    variant="outline"
                    @click="stopGenerate"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧结果面板 -->
          <div class="lg:col-span-2 space-y-4">
            <!-- 流式输出 -->
            <div v-if="sse.isStreaming.value || (rawContent && !parsedQuestions.length)" class="relative overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent">
              <div class="p-5 space-y-3">
                <div class="flex items-center gap-2.5">
                  <div v-if="sse.isStreaming.value" class="relative flex items-center justify-center size-6">
                    <span class="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
                    <UIcon name="i-lucide-sparkles" class="size-4 text-teal-500 relative z-10 animate-pulse" />
                  </div>
                  <span class="text-sm font-medium" :class="sse.isStreaming.value ? 'text-teal-600 dark:text-teal-400' : 'text-muted'">
                    {{ sse.isStreaming.value ? 'AI 正在生成题目...' : '生成内容' }}
                  </span>
                </div>
                <div class="font-mono text-xs text-muted whitespace-pre-wrap p-4 bg-[var(--ui-bg-elevated)] rounded-lg min-h-[100px] max-h-[300px] overflow-y-auto scrollbar-thin leading-relaxed">
                  {{ rawContent || '等待生成...' }}
                </div>
              </div>
            </div>

            <!-- 解析后的题目列表 -->
            <template v-if="parsedQuestions.length">
              <!-- 统计栏 -->
              <div class="flex items-center gap-3 px-1">
                <span class="text-sm font-medium text-highlighted">共 {{ parsedQuestions.length }} 题</span>
                <div class="flex-1" />
                <div class="flex items-center gap-2">
                  <UBadge
                    v-for="type in [...new Set(parsedQuestions.map(q => q.type))]"
                    :key="type"
                    variant="subtle"
                    size="xs"
                  >
                    {{ type }} {{ parsedQuestions.filter(q => q.type === type).length }}
                  </UBadge>
                </div>
              </div>

              <div
                v-for="(q, idx) in parsedQuestions"
                :key="q.id"
                class="group relative overflow-hidden rounded-xl border border-[var(--ui-border)] hover:border-teal-500/30 bg-[var(--ui-bg)] transition-all duration-200 hover:shadow-md"
              >
                <!-- 题号色条 -->
                <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" :class="{
                  'bg-emerald-500': q.difficulty === '简单',
                  'bg-amber-500': q.difficulty === '中等',
                  'bg-red-500': q.difficulty === '困难',
                }" />

                <div class="p-4 pl-5 space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <!-- 题号 -->
                        <span class="flex items-center justify-center size-6 rounded-full bg-teal-500/10 text-xs font-bold text-teal-600 dark:text-teal-400 shrink-0">
                          {{ idx + 1 }}
                        </span>
                        <UBadge :label="q.type" size="xs" variant="subtle" />
                        <UBadge
                          :label="q.difficulty"
                          size="xs"
                          variant="subtle"
                          :color="(difficultyColor[q.difficulty] as any) || 'neutral'"
                        />
                      </div>
                      <p class="text-sm text-highlighted leading-relaxed">{{ q.content }}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <UButton
                        :icon="expandedIds.has(q.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                        size="xs"
                        color="neutral"
                        variant="ghost"
                        @click="toggleExpand(q.id)"
                      />
                      <UButton
                        icon="i-lucide-plus"
                        size="xs"
                        variant="ghost"
                        title="加入题库"
                        @click="addOneToBank(q)"
                      />
                    </div>
                  </div>

                  <!-- 选项 -->
                  <div v-if="q.options?.length" class="pl-8 space-y-1.5">
                    <div
                      v-for="(opt, optIdx) in q.options"
                      :key="opt"
                      class="flex items-start gap-2 text-sm text-muted py-1 px-2.5 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors"
                    >
                      <span class="flex items-center justify-center size-5 rounded-full bg-[var(--ui-bg-elevated)] text-[10px] font-medium shrink-0 mt-0.5">
                        {{ String.fromCharCode(65 + optIdx) }}
                      </span>
                      <span>{{ opt.replace(/^[A-D]\.\s*/, '') }}</span>
                    </div>
                  </div>

                  <!-- 展开的答案和解析 -->
                  <Transition
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 -translate-y-1"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-all duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-1"
                  >
                    <div v-if="expandedIds.has(q.id)" class="mt-1 pt-3 border-t border-dashed border-[var(--ui-border)] space-y-2 pl-8">
                      <div class="flex items-start gap-2">
                        <UIcon name="i-lucide-check-circle" class="size-4 text-emerald-500 shrink-0 mt-0.5" />
                        <p class="text-sm"><span class="font-semibold text-emerald-600 dark:text-emerald-400">答案：</span>{{ q.answer }}</p>
                      </div>
                      <div v-if="q.explanation" class="flex items-start gap-2">
                        <UIcon name="i-lucide-info" class="size-4 text-sky-500 shrink-0 mt-0.5" />
                        <p class="text-sm text-muted leading-relaxed"><span class="font-semibold text-highlighted">解析：</span>{{ q.explanation }}</p>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>
            </template>

            <!-- 空状态 -->
            <div v-else-if="!sse.isStreaming.value && !rawContent" class="flex flex-col items-center justify-center py-24">
              <div class="relative mb-6">
                <div class="absolute inset-0 rounded-full bg-teal-500/5 scale-[2.5]" />
                <div class="absolute inset-0 rounded-full bg-teal-500/10 scale-[1.8] animate-pulse" />
                <div class="relative flex items-center justify-center size-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-sky-500/20 border border-teal-500/20">
                  <UIcon name="i-lucide-brain" class="size-9 text-teal-500" />
                </div>
              </div>
              <p class="text-lg font-semibold text-highlighted mb-1">AI 智能出题</p>
              <p class="text-sm text-muted mb-6">在左侧配置参数，让 AI 为你生成高质量题目</p>
              <div class="flex items-center gap-4 text-xs text-muted">
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-zap" class="size-3.5 text-amber-500" />
                  秒级生成
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-target" class="size-3.5 text-emerald-500" />
                  精准出题
                </span>
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-database" class="size-3.5 text-sky-500" />
                  一键入库
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
