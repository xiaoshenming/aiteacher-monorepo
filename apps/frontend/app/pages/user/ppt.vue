<script setup lang="ts">
const sse = useSSE()
const toast = useToast()

const step = ref(1)
const topic = ref('')
const requirements = ref('')
const outline = ref('')
const editableMarkdown = ref('')
const isDownloading = ref(false)

const steps = [
  { label: '输入主题', icon: 'i-lucide-pencil' },
  { label: '生成大纲', icon: 'i-lucide-sparkles' },
  { label: '精调内容', icon: 'i-lucide-settings-2' },
  { label: '下载PPT', icon: 'i-lucide-download' },
]

async function generateOutline() {
  if (!topic.value.trim()) {
    toast.add({ title: '请输入PPT主题', color: 'warning' })
    return
  }

  step.value = 2
  outline.value = ''

  const prompt = `请为以下主题生成一份PPT的Markdown大纲，包含标题页、目录页和各章节内容页。每页用 --- 分隔。
主题：${topic.value}
${requirements.value ? `要求：${requirements.value}` : ''}
请直接输出Markdown内容，不要包含代码块标记。`

  await sse.stream({
    url: 'ai/chat-stream',
    body: { prompt, model: 'deepseek-chat' },
    callbacks: {
      onMessage(chunk: string) {
        outline.value += chunk
      },
      onDone() {
        editableMarkdown.value = outline.value
        step.value = 3
      },
      onError(err: string) {
        toast.add({ title: '生成失败', description: err, color: 'error' })
        step.value = 1
      },
    },
  })
}

function goToEdit() {
  editableMarkdown.value = outline.value
  step.value = 3
}

async function downloadPPT() {
  if (!editableMarkdown.value.trim()) {
    toast.add({ title: '内容为空，无法生成PPT', color: 'warning' })
    return
  }

  step.value = 4
  isDownloading.value = true

  try {
    const config = useRuntimeConfig()
    const userStore = useUserStore()
    const response = await fetch(`${config.public.apiBase}ppt/generateAndDownloadPpt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userStore.token}`,
        'deviceType': 'pc',
      },
      body: JSON.stringify({ markdown: editableMarkdown.value }),
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${topic.value || 'presentation'}.pptx`
    a.click()
    URL.revokeObjectURL(url)

    toast.add({ title: 'PPT下载成功', color: 'success' })
  }
  catch (err) {
    toast.add({ title: '下载失败', description: (err as Error).message, color: 'error' })
  }
  finally {
    isDownloading.value = false
  }
}

function reset() {
  step.value = 1
  topic.value = ''
  requirements.value = ''
  outline.value = ''
  editableMarkdown.value = ''
  sse.abort()
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="PPT工具">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="step > 1"
            icon="i-lucide-rotate-ccw"
            label="重新开始"
            size="sm"
            color="neutral"
            variant="ghost"
            @click="reset"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <!-- 步骤指示器 -->
        <div class="flex items-center justify-center gap-2">
          <template v-for="(s, i) in steps" :key="i">
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors"
              :class="step > i + 1
                ? 'bg-primary/10 text-primary'
                : step === i + 1
                  ? 'bg-primary text-white'
                  : 'bg-elevated text-muted'"
            >
              <UIcon :name="s.icon" class="size-4" />
              <span class="hidden sm:inline">{{ s.label }}</span>
            </div>
            <UIcon v-if="i < steps.length - 1" name="i-lucide-chevron-right" class="size-4 text-muted" />
          </template>
        </div>

        <!-- 步骤1：输入主题 -->
        <div v-if="step === 1" class="space-y-4">
          <UCard>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">PPT主题</label>
                <UInput
                  v-model="topic"
                  placeholder="例如：人工智能在教育中的应用"
                  size="lg"
                  icon="i-lucide-presentation"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">额外要求（可选）</label>
                <UTextarea
                  v-model="requirements"
                  placeholder="例如：面向高中生，包含案例分析，约15页"
                  :rows="3"
                  autoresize
                />
              </div>
              <UButton
                label="生成大纲"
                icon="i-lucide-sparkles"
                size="lg"
                block
                @click="generateOutline"
              />
            </div>
          </UCard>
        </div>

        <!-- 步骤2：生成中 -->
        <div v-else-if="step === 2" class="space-y-4">
          <UCard>
            <div class="space-y-3">
              <div class="flex items-center gap-2 text-sm text-muted">
                <UIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
                <span>正在生成大纲...</span>
              </div>
              <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap min-h-[200px] p-3 bg-elevated rounded-lg">
                {{ outline || '等待生成...' }}
              </div>
              <div class="flex gap-2">
                <UButton
                  label="停止生成"
                  icon="i-lucide-square"
                  color="neutral"
                  variant="outline"
                  @click="() => { sse.abort(); goToEdit() }"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- 步骤3：精调 -->
        <div v-else-if="step === 3" class="space-y-4">
          <UCard>
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium text-highlighted">编辑Markdown内容</span>
                <span class="text-xs text-muted">用 --- 分隔每页</span>
              </div>
              <UTextarea
                v-model="editableMarkdown"
                :rows="16"
                autoresize
                class="font-mono text-sm"
              />
              <div class="flex gap-2 justify-end">
                <UButton
                  label="重新生成"
                  icon="i-lucide-refresh-cw"
                  color="neutral"
                  variant="outline"
                  @click="() => { step = 1 }"
                />
                <UButton
                  label="生成PPT"
                  icon="i-lucide-download"
                  @click="downloadPPT"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- 步骤4：下载 -->
        <div v-else-if="step === 4" class="space-y-4">
          <UCard>
            <div class="flex flex-col items-center justify-center py-12 gap-4">
              <template v-if="isDownloading">
                <UIcon name="i-lucide-loader-2" class="size-12 text-primary animate-spin" />
                <p class="text-muted">正在生成PPT文件...</p>
              </template>
              <template v-else>
                <UIcon name="i-lucide-check-circle" class="size-12 text-primary" />
                <p class="text-highlighted font-medium">PPT已生成</p>
                <div class="flex gap-2">
                  <UButton
                    label="重新下载"
                    icon="i-lucide-download"
                    variant="outline"
                    @click="downloadPPT"
                  />
                  <UButton
                    label="制作新PPT"
                    icon="i-lucide-plus"
                    @click="reset"
                  />
                </div>
              </template>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
