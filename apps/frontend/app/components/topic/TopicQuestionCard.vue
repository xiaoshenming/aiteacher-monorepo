<script setup lang="ts">
import type { Question } from '~/types/question'
import { difficultyColor } from '~/composables/useTopicGenerator'

defineProps<{
  question: Question
  index: number
  expanded: boolean
}>()

const emit = defineEmits<{
  'toggle-expand': [id: string]
  'add-to-bank': [question: Question]
}>()
</script>

<template>
  <div class="group relative overflow-hidden rounded-xl border border-[var(--ui-border)] hover:border-primary-500/30 bg-[var(--ui-bg)] transition-all duration-200 hover:shadow-md">
    <!-- 题号色条 -->
    <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" :class="{
      'bg-emerald-500': question.difficulty === '简单',
      'bg-amber-500': question.difficulty === '中等',
      'bg-red-500': question.difficulty === '困难',
    }" />

    <div class="p-4 pl-5 space-y-3">
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2">
            <span class="flex items-center justify-center size-6 rounded-full bg-primary-500/10 text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0">
              {{ index + 1 }}
            </span>
            <UBadge :label="question.type" size="xs" variant="subtle" />
            <UBadge
              :label="question.difficulty"
              size="xs"
              variant="subtle"
              :color="(difficultyColor[question.difficulty] as any) || 'neutral'"
            />
          </div>
          <p class="text-sm text-highlighted leading-relaxed">{{ question.content }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <UButton
            :icon="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="emit('toggle-expand', question.id)"
          />
          <UButton
            icon="i-lucide-plus"
            size="xs"
            variant="ghost"
            title="加入题库"
            @click="emit('add-to-bank', question)"
          />
        </div>
      </div>

      <!-- 选项 -->
      <div v-if="question.options?.length" class="pl-8 space-y-1.5">
        <div
          v-for="(opt, optIdx) in question.options"
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
        <div v-if="expanded" class="mt-1 pt-3 border-t border-dashed border-[var(--ui-border)] space-y-2 pl-8">
          <div class="flex items-start gap-2">
            <UIcon name="i-lucide-check-circle" class="size-4 text-emerald-500 shrink-0 mt-0.5" />
            <p class="text-sm"><span class="font-semibold text-emerald-600 dark:text-emerald-400">答案：</span>{{ question.answer }}</p>
          </div>
          <div v-if="question.explanation" class="flex items-start gap-2">
            <UIcon name="i-lucide-info" class="size-4 text-sky-500 shrink-0 mt-0.5" />
            <p class="text-sm text-muted leading-relaxed"><span class="font-semibold text-highlighted">解析：</span>{{ question.explanation }}</p>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
