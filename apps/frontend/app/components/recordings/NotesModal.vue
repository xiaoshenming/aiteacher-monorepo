<script setup lang="ts">
const {
  showNotesModal: open,
  notesLoading,
  notesTitle,
  notesData,
  parsedKeywords,
  parsedOutline,
  parsedKeyPoints,
  parsedQuiz,
  handleRegenerateNotes,
} = useAINotes()

defineExpose({ open })
</script>

<template>
  <UModal v-model:open="open" :title="'AI笔记 - ' + notesTitle">
    <template #content>
      <div class="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-sparkles" class="text-amber-500" />
          <h3 class="text-sm font-semibold truncate">{{ notesTitle }}</h3>
        </div>

        <div v-if="notesLoading" class="flex items-center justify-center py-10 gap-2">
          <UIcon name="i-lucide-sparkles" class="animate-pulse text-xl text-amber-500" />
          <span class="text-sm text-[var(--ui-text-dimmed)]">加载中...</span>
        </div>
        <template v-else-if="notesData">
          <!-- Processing -->
          <div v-if="notesData.status === 'pending' || notesData.status === 'processing' || notesData.status === 'waiting'" class="flex flex-col items-center py-10 gap-3">
            <UIcon name="i-lucide-sparkles" class="text-2xl text-amber-500 animate-pulse" />
            <p class="text-sm text-[var(--ui-text-dimmed)]">AI 正在归纳笔记...</p>
          </div>

          <!-- Failed -->
          <div v-else-if="notesData.status === 'failed'" class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
            <UIcon name="i-lucide-circle-x" class="text-2xl text-red-500" />
            <p class="text-sm">笔记生成失败</p>
            <p class="text-xs">{{ notesData.error_message || '未知错误' }}</p>
          </div>

          <!-- Completed -->
          <template v-else-if="notesData.status === 'completed'">
            <div v-if="parsedKeywords.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">关键词</h4>
              <div class="flex flex-wrap gap-1.5">
                <UBadge v-for="(kw, i) in parsedKeywords" :key="i" color="primary" variant="subtle" size="sm">{{ kw }}</UBadge>
              </div>
            </div>

            <div v-if="notesData.summary" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">摘要</h4>
              <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg text-sm leading-relaxed">{{ notesData.summary }}</div>
            </div>

            <div v-if="parsedOutline" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">大纲</h4>
              <div class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg text-sm leading-relaxed whitespace-pre-wrap">{{ parsedOutline }}</div>
            </div>

            <div v-if="parsedKeyPoints.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">知识点</h4>
              <ul class="space-y-1.5">
                <li v-for="(point, i) in parsedKeyPoints" :key="i" class="flex gap-2 text-sm p-2 bg-[var(--ui-bg-elevated)] rounded-lg">
                  <span class="text-teal-600 dark:text-teal-400 font-bold shrink-0">{{ i + 1 }}.</span>
                  <span>{{ point }}</span>
                </li>
              </ul>
            </div>

            <div v-if="parsedQuiz.length" class="space-y-2">
              <h4 class="text-xs font-semibold text-[var(--ui-text-dimmed)] uppercase tracking-wider">测验</h4>
              <div v-for="(q, i) in parsedQuiz" :key="i" class="p-3 bg-[var(--ui-bg-elevated)] rounded-lg space-y-2">
                <p class="text-sm font-medium">{{ i + 1 }}. {{ q.question }}</p>
                <div v-for="(opt, j) in q.options" :key="j" class="text-sm pl-4 text-[var(--ui-text-dimmed)]">
                  {{ String.fromCharCode(65 + j) }}. {{ opt }}
                </div>
                <details>
                  <summary class="text-xs text-teal-600 dark:text-teal-400 cursor-pointer">查看答案</summary>
                  <p class="text-sm mt-1 pl-4">参考答案: {{ q.answer }}</p>
                </details>
              </div>
            </div>
          </template>
        </template>

        <div v-else class="flex flex-col items-center py-8 gap-2 text-[var(--ui-text-dimmed)]">
          <UIcon name="i-lucide-notebook-pen" class="text-2xl" />
          <p class="text-sm">暂无 AI 笔记</p>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-[var(--ui-border)]">
          <UButton
            v-if="notesData && (notesData.status === 'completed' || notesData.status === 'failed')"
            variant="soft"
            icon="i-lucide-refresh-cw"
            label="重新生成"
            size="sm"
            @click="handleRegenerateNotes"
          />
          <UButton variant="ghost" label="关闭" size="sm" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
