<script setup lang="ts">
import type { Question } from '~/types/question'

defineProps<{
  isStreaming: boolean
  rawContent: string
  parsedQuestions: Question[]
  expandedIds: Set<string>
}>()

const emit = defineEmits<{
  'toggle-expand': [id: string]
  'add-one-to-bank': [question: Question]
}>()
</script>

<template>
  <div class="lg:col-span-2 space-y-4">
    <!-- 流式输出 -->
    <div v-if="isStreaming || (rawContent && !parsedQuestions.length)" class="relative overflow-hidden rounded-xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-transparent">
      <div class="p-5 space-y-3">
        <div class="flex items-center gap-2.5">
          <div v-if="isStreaming" class="relative flex items-center justify-center size-6">
            <span class="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
            <UIcon name="i-lucide-sparkles" class="size-4 text-teal-500 relative z-10 animate-pulse" />
          </div>
          <span class="text-sm font-medium" :class="isStreaming ? 'text-teal-600 dark:text-teal-400' : 'text-muted'">
            {{ isStreaming ? 'AI 正在生成题目...' : '生成内容' }}
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

      <TopicQuestionCard
        v-for="(q, idx) in parsedQuestions"
        :key="q.id"
        :question="q"
        :index="idx"
        :expanded="expandedIds.has(q.id)"
        @toggle-expand="emit('toggle-expand', $event)"
        @add-to-bank="emit('add-one-to-bank', $event)"
      />
    </template>

    <!-- 空状态 -->
    <div v-else-if="!isStreaming && !rawContent" class="flex flex-col items-center justify-center py-24">
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
</template>
