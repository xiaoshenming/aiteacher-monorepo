<script setup lang="ts">
import { difficultyOptions, typeOptions, typeIcons } from '~/composables/useTopicGenerator'

const props = defineProps<{
  subject: string
  topicInput: string
  count: number
  difficulty: '简单' | '中等' | '困难'
  selectedTypes: string[]
  isStreaming: boolean
}>()

const emit = defineEmits<{
  'update:subject': [value: string]
  'update:topicInput': [value: string]
  'update:count': [value: number]
  'update:difficulty': [value: '简单' | '中等' | '困难']
  'toggleType': [type: string]
  'generate': []
  'stop': []
}>()

const localSubject = computed({
  get: () => props.subject,
  set: (v: string) => emit('update:subject', v),
})
const localTopicInput = computed({
  get: () => props.topicInput,
  set: (v: string) => emit('update:topicInput', v),
})
const localCount = computed({
  get: () => props.count,
  set: (v: number) => emit('update:count', v),
})
</script>

<template>
  <div class="lg:col-span-1">
    <div class="sticky top-6 space-y-4">
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
            <UInput v-model="localSubject" placeholder="例如：数学" />
          </div>

          <!-- 知识点 -->
          <div class="space-y-1.5">
            <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
              <UIcon name="i-lucide-lightbulb" class="size-3.5" />
              知识点
            </label>
            <UTextarea v-model="localTopicInput" placeholder="例如：二次函数的性质与应用" :rows="2" autoresize />
          </div>

          <!-- 数量 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider">
                <UIcon name="i-lucide-hash" class="size-3.5" />
                数量
              </label>
              <span class="text-sm font-bold text-teal-500 tabular-nums">{{ localCount }} 题</span>
            </div>
            <div class="relative">
              <input
                v-model.number="localCount"
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
                @click="emit('update:difficulty', opt.value as any)"
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
                @click="emit('toggleType', t)"
              >
                <UIcon :name="typeIcons[t] || 'i-lucide-file-question'" class="size-3.5" />
                {{ t }}
              </button>
            </div>
          </div>

          <USeparator />

          <!-- 生成按钮 -->
          <UButton
            v-if="!isStreaming"
            label="开始生成"
            icon="i-lucide-sparkles"
            size="lg"
            block
            @click="emit('generate')"
          />
          <UButton
            v-else
            label="停止生成"
            icon="i-lucide-square"
            size="lg"
            block
            color="neutral"
            variant="outline"
            @click="emit('stop')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
