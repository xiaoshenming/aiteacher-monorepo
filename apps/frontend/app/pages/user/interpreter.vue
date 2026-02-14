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
      <div class="px-6 py-6 space-y-6">
        <!-- 控制栏 — 渐变背景 -->
        <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-teal-500/10 via-teal-400/5 to-sky-500/10 dark:from-teal-500/15 dark:via-teal-400/5 dark:to-sky-500/15 border border-teal-500/20 p-5">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-400/10 via-transparent to-transparent pointer-events-none" />
          <div class="relative flex flex-wrap items-center gap-4">
            <!-- 录音按钮 -->
            <ClientOnly>
              <button
                class="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300"
                :class="interpreter.isRecording.value
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                  : 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 hover:-translate-y-0.5'"
                @click="toggleRecording"
              >
                <!-- 录音脉冲动画 -->
                <span v-if="interpreter.isRecording.value" class="absolute inset-0 rounded-xl animate-ping bg-red-500/20" />
                <UIcon :name="interpreter.isRecording.value ? 'i-lucide-mic-off' : 'i-lucide-mic'" class="size-4.5 relative z-10" />
                <span class="relative z-10">{{ interpreter.isRecording.value ? '停止录音' : '开始录音' }}</span>
              </button>
            </ClientOnly>

            <!-- 连接状态 -->
            <ClientOnly>
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/20">
                <span class="relative flex size-2">
                  <span
                    v-if="interpreter.isConnected.value"
                    class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
                  />
                  <span
                    class="relative inline-flex size-2 rounded-full"
                    :class="interpreter.isConnected.value ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'"
                  />
                </span>
                <span class="text-xs font-medium" :class="interpreter.isConnected.value ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'">
                  {{ interpreter.isConnected.value ? '已连接' : '未连接' }}
                </span>
              </div>
            </ClientOnly>

            <div class="flex-1" />

            <!-- 语言选择 -->
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/20">
              <UIcon name="i-lucide-globe" class="size-4 text-teal-500" />
              <USelectMenu
                v-model="sourceLang"
                :items="langOptions"
                placeholder="源语言"
                class="w-28"
                size="sm"
              />
              <div class="flex items-center justify-center size-6 rounded-full bg-teal-500/10">
                <UIcon name="i-lucide-arrow-right" class="size-3.5 text-teal-500" />
              </div>
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
        </div>

        <!-- 转写面板 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- 左侧：原文 -->
          <div class="group/panel">
            <div class="flex items-center gap-2 mb-3 px-1">
              <div class="flex items-center justify-center size-7 rounded-lg bg-teal-500/10">
                <UIcon name="i-lucide-text" class="size-4 text-teal-500" />
              </div>
              <span class="text-sm font-semibold text-highlighted">原文转写</span>
              <ClientOnly>
                <UBadge v-if="interpreter.isRecording.value" color="error" size="xs" variant="subtle" class="animate-pulse">
                  <span class="flex items-center gap-1">
                    <span class="size-1.5 rounded-full bg-red-500" />
                    录音中
                  </span>
                </UBadge>
              </ClientOnly>
            </div>
            <UCard class="!hover:shadow-none">
              <div class="space-y-1 min-h-[350px] max-h-[500px] overflow-y-auto scrollbar-thin">
                <ClientOnly>
                  <template v-if="interpreter.transcripts.value.length">
                    <div
                      v-for="(t, idx) in interpreter.transcripts.value"
                      :key="t.id"
                      class="group relative flex items-start gap-3 p-3 rounded-lg hover:bg-teal-500/5 dark:hover:bg-teal-500/10 transition-all duration-200"
                      :class="idx === interpreter.transcripts.value.length - 1 ? 'bg-teal-500/5 dark:bg-teal-500/8' : ''"
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
                        @click="calibrateTranslation(t.id, t.text)"
                      />
                    </div>
                  </template>
                  <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
                    <div class="relative mb-4">
                      <div class="absolute inset-0 rounded-full bg-teal-500/10 animate-pulse scale-150" />
                      <div class="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-teal-500/20 to-sky-500/20 border border-teal-500/20">
                        <UIcon name="i-lucide-mic" class="size-7 text-teal-500" />
                      </div>
                    </div>
                    <p class="text-sm font-medium text-highlighted mb-1">准备就绪</p>
                    <p class="text-xs text-muted">点击「开始录音」进行语音转写</p>
                  </div>
                </ClientOnly>
              </div>
            </UCard>
          </div>

          <!-- 右侧：翻译 -->
          <div class="group/panel">
            <div class="flex items-center gap-2 mb-3 px-1">
              <div class="flex items-center justify-center size-7 rounded-lg bg-sky-500/10">
                <UIcon name="i-lucide-languages" class="size-4 text-sky-500" />
              </div>
              <span class="text-sm font-semibold text-highlighted">翻译结果</span>
            </div>
            <UCard class="!hover:shadow-none">
              <div class="space-y-1 min-h-[350px] max-h-[500px] overflow-y-auto scrollbar-thin">
                <ClientOnly>
                  <template v-if="interpreter.transcripts.value.length">
                    <div
                      v-for="(t, idx) in interpreter.transcripts.value"
                      :key="t.id"
                      class="p-3 rounded-lg hover:bg-sky-500/5 dark:hover:bg-sky-500/10 transition-all duration-200"
                      :class="idx === interpreter.transcripts.value.length - 1 ? 'bg-sky-500/5 dark:bg-sky-500/8' : ''"
                    >
                      <span class="text-[10px] font-mono text-muted tabular-nums">{{ new Date(t.timestamp).toLocaleTimeString() }}</span>
                      <p class="text-sm text-highlighted mt-1 leading-relaxed">
                        {{ interpreter.getTranslation(t.id) || t.translation || '等待翻译...' }}
                      </p>
                    </div>
                  </template>
                  <div v-else class="flex flex-col items-center justify-center py-20 text-muted">
                    <div class="relative mb-4">
                      <div class="absolute inset-0 rounded-full bg-sky-500/10 animate-pulse scale-150" />
                      <div class="relative flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/20">
                        <UIcon name="i-lucide-languages" class="size-7 text-sky-500" />
                      </div>
                    </div>
                    <p class="text-sm font-medium text-highlighted mb-1">等待翻译</p>
                    <p class="text-xs text-muted">翻译结果将在此实时显示</p>
                  </div>
                </ClientOnly>
              </div>
            </UCard>
          </div>
        </div>

        <!-- 会议纪要 -->
        <div v-if="summaryContent" class="relative">
          <div class="flex items-center gap-2 mb-3 px-1">
            <div class="flex items-center justify-center size-7 rounded-lg bg-amber-500/10">
              <UIcon name="i-lucide-scroll-text" class="size-4 text-amber-500" />
            </div>
            <span class="text-sm font-semibold text-highlighted">会议纪要</span>
          </div>
          <UCard>
            <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
              {{ summaryContent }}
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
