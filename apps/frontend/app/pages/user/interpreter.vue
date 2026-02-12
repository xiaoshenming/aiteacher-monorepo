<script setup lang="ts">
const interpreter = useInterpreter()
const toast = useToast()

const sourceLang = ref('中文')
const targetLang = ref('英文')
const summaryContent = ref('')
const isGeneratingSummary = ref(false)
const calibratingId = ref<string | null>(null)

const langOptions = ['中文', '英文', '日文', '韩文', '法文', '德文', '西班牙文']

onMounted(() => {
  // WebSocket and Web Audio API only run on client
})

onBeforeUnmount(() => {
  interpreter.cleanup()
})

function toggleRecording() {
  if (interpreter.isRecording.value) {
    interpreter.stopRecording()
  }
  else {
    interpreter.startRecording()
  }
}

async function calibrateTranslation(id: string, text: string) {
  calibratingId.value = id
  try {
    const result = await interpreter.translateText(text, sourceLang.value, targetLang.value)
    if (result) {
      interpreter.updateTranslation(id, result)
      toast.add({ title: '校准完成', color: 'success' })
    }
  }
  catch {
    toast.add({ title: '校准失败', color: 'error' })
  }
  finally {
    calibratingId.value = null
  }
}

async function generateSummary() {
  if (!interpreter.transcripts.value.length) {
    toast.add({ title: '暂无转写内容', color: 'warning' })
    return
  }

  isGeneratingSummary.value = true
  try {
    summaryContent.value = await interpreter.generateSummary()
    toast.add({ title: '纪要生成完成', color: 'success' })
  }
  catch {
    toast.add({ title: '生成失败', color: 'error' })
  }
  finally {
    isGeneratingSummary.value = false
  }
}

function exportTranscripts() {
  const lines = interpreter.transcripts.value.map((t) => {
    const time = new Date(t.timestamp).toLocaleTimeString()
    const translation = interpreter.getTranslation(t.id) || t.translation
    return `[${time}] ${t.text}${translation ? `\n  -> ${translation}` : ''}`
  })

  if (summaryContent.value) {
    lines.push('\n--- 会议纪要 ---\n' + summaryContent.value)
  }

  const blob = new Blob([lines.join('\n\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `同传记录_${new Date().toLocaleDateString()}.txt`
  a.click()
  URL.revokeObjectURL(url)
  toast.add({ title: '导出成功', color: 'success' })
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="AI同传助手">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-1.5">
            <UButton
              v-if="interpreter.transcripts.value.length"
              icon="i-lucide-file-text"
              label="会议纪要"
              size="sm"
              variant="soft"
              :loading="isGeneratingSummary"
              @click="generateSummary"
            />
            <UButton
              v-if="interpreter.transcripts.value.length"
              icon="i-lucide-download"
              label="导出"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="exportTranscripts"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <!-- 控制栏 -->
        <UCard>
          <div class="flex flex-wrap items-center gap-4">
            <!-- 录音按钮 -->
            <ClientOnly>
              <UButton
                :icon="interpreter.isRecording.value ? 'i-lucide-mic-off' : 'i-lucide-mic'"
                :label="interpreter.isRecording.value ? '停止录音' : '开始录音'"
                :color="interpreter.isRecording.value ? 'error' : 'primary'"
                size="lg"
                @click="toggleRecording"
              />
            </ClientOnly>

            <!-- 连接状态 -->
            <ClientOnly>
              <div class="flex items-center gap-1.5 text-sm">
                <span
                  class="size-2 rounded-full"
                  :class="interpreter.isConnected.value ? 'bg-green-500' : 'bg-neutral-300'"
                />
                <span class="text-muted">{{ interpreter.isConnected.value ? '已连接' : '未连接' }}</span>
              </div>
            </ClientOnly>

            <div class="flex-1" />

            <!-- 语言选择 -->
            <div class="flex items-center gap-2">
              <USelectMenu
                v-model="sourceLang"
                :items="langOptions"
                placeholder="源语言"
                class="w-28"
                size="sm"
              />
              <UIcon name="i-lucide-arrow-right" class="size-4 text-muted" />
              <USelectMenu
                v-model="targetLang"
                :items="langOptions"
                placeholder="目标语言"
                class="w-28"
                size="sm"
              />
            </div>

            <!-- 清空 -->
            <UButton
              icon="i-lucide-trash-2"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="() => { interpreter.clearTranscripts(); summaryContent = '' }"
            />
          </div>
        </UCard>

        <!-- 转写面板 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 左侧：原文 -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-text" class="size-4" />
                <span class="text-sm font-medium">原文转写</span>
                <ClientOnly>
                  <UBadge v-if="interpreter.isRecording.value" label="录音中" color="error" size="xs" variant="subtle" />
                </ClientOnly>
              </div>
            </template>
            <div class="space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto">
              <ClientOnly>
                <template v-if="interpreter.transcripts.value.length">
                  <div
                    v-for="t in interpreter.transcripts.value"
                    :key="t.id"
                    class="group flex items-start gap-2 p-2 rounded-lg hover:bg-elevated transition-colors"
                  >
                    <span class="text-xs text-muted shrink-0 mt-0.5">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                    <p class="text-sm text-highlighted flex-1">{{ t.text }}</p>
                    <UButton
                      icon="i-lucide-languages"
                      size="xs"
                      color="neutral"
                      variant="ghost"
                      class="opacity-0 group-hover:opacity-100 shrink-0"
                      :loading="calibratingId === t.id"
                      title="AI校准翻译"
                      @click="calibrateTranslation(t.id, t.text)"
                    />
                  </div>
                </template>
                <div v-else class="flex flex-col items-center justify-center py-16 text-muted">
                  <UIcon name="i-lucide-mic" class="size-8 mb-2" />
                  <span class="text-sm">点击"开始录音"进行语音转写</span>
                </div>
              </ClientOnly>
            </div>
          </UCard>

          <!-- 右侧：翻译 -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-languages" class="size-4" />
                <span class="text-sm font-medium">翻译结果</span>
              </div>
            </template>
            <div class="space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto">
              <ClientOnly>
                <template v-if="interpreter.transcripts.value.length">
                  <div
                    v-for="t in interpreter.transcripts.value"
                    :key="t.id"
                    class="p-2 rounded-lg hover:bg-elevated transition-colors"
                  >
                    <span class="text-xs text-muted">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                    <p class="text-sm text-highlighted mt-0.5">
                      {{ interpreter.getTranslation(t.id) || t.translation || '等待翻译...' }}
                    </p>
                  </div>
                </template>
                <div v-else class="flex flex-col items-center justify-center py-16 text-muted">
                  <UIcon name="i-lucide-languages" class="size-8 mb-2" />
                  <span class="text-sm">翻译结果将在此显示</span>
                </div>
              </ClientOnly>
            </div>
          </UCard>
        </div>

        <!-- 会议纪要 -->
        <UCard v-if="summaryContent">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-scroll-text" class="size-4" />
              <span class="text-sm font-medium">会议纪要</span>
            </div>
          </template>
          <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {{ summaryContent }}
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
