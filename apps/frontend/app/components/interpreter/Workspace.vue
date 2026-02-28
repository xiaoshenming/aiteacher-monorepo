<script setup lang="ts">
const interpreter = useInterpreter()
const toast = useToast()

const sourceLang = ref('中文')
const targetLang = ref('英文')
const summaryContent = ref('')
const isGeneratingSummary = ref(false)
const calibratingId = ref<string | null>(null)

const langOptions = ['中文', '英文', '日文', '韩文', '法文', '德文', '西班牙文']

// 语言显示名 → 代码的映射
const langCodeMap: Record<string, string> = {
  '中文': 'zh',
  '英文': 'en',
  '日文': 'ja',
  '韩文': 'ko',
  '法文': 'fr',
  '德文': 'de',
  '西班牙文': 'es',
}

// 当语言切换时，同步更新 composable 内部的配置并通知 WebSocket
watch([sourceLang, targetLang], ([src, tgt]) => {
  const srcCode = langCodeMap[src] || 'zh'
  const tgtCode = langCodeMap[tgt] || 'en'
  interpreter.language.value = srcCode
  interpreter.translationMode.value = `${srcCode}2${tgtCode}`
  // 如果正在录音，实时推送新配置到后端
  interpreter.sendLanguageConfig()
}, { immediate: true })

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
    const srcCode = langCodeMap[sourceLang.value] || 'zh'
    const tgtCode = langCodeMap[targetLang.value] || 'en'
    const result = await interpreter.translateText(text, srcCode, tgtCode)
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

function handleClear() {
  interpreter.clearTranscripts()
  summaryContent.value = ''
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
        <!-- 控制栏 -->
        <InterpreterControlBar
          :is-recording="interpreter.isRecording.value"
          :is-connected="interpreter.isConnected.value"
          :source-lang="sourceLang"
          :target-lang="targetLang"
          :lang-options="langOptions"
          @toggle-recording="toggleRecording"
          @update:source-lang="sourceLang = $event"
          @update:target-lang="targetLang = $event"
          @clear="handleClear"
        />

        <!-- 转写面板 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InterpreterTranscriptPanel
            :transcripts="[...interpreter.transcripts.value]"
            type="source"
            :is-recording="interpreter.isRecording.value"
            :calibrating-id="calibratingId"
            @calibrate="calibrateTranslation"
          />
          <InterpreterTranscriptPanel
            :transcripts="[...interpreter.transcripts.value]"
            type="translation"
            :get-translation="interpreter.getTranslation"
          />
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
