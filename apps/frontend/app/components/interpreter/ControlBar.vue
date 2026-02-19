<script setup lang="ts">
defineProps<{
  isRecording: boolean
  isConnected: boolean
  sourceLang: string
  targetLang: string
  langOptions: string[]
}>()

const emit = defineEmits<{
  toggleRecording: []
  'update:sourceLang': [value: string]
  'update:targetLang': [value: string]
  clear: []
}>()
</script>

<template>
  <div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary-500/10 via-primary-400/5 to-sky-500/10 dark:from-primary-500/15 dark:via-primary-400/5 dark:to-sky-500/15 border border-primary-500/20 p-5">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-400/10 via-transparent to-transparent pointer-events-none" />
    <div class="relative flex flex-wrap items-center gap-4">
      <!-- 录音按钮 -->
      <ClientOnly>
        <button
          class="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300"
          :class="isRecording
            ? 'bg-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
            : 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5'"
          @click="emit('toggleRecording')"
        >
          <span v-if="isRecording" class="absolute inset-0 rounded-xl animate-ping bg-red-500/20" />
          <UIcon :name="isRecording ? 'i-lucide-mic-off' : 'i-lucide-mic'" class="size-4.5 relative z-10" />
          <span class="relative z-10">{{ isRecording ? '停止录音' : '开始录音' }}</span>
        </button>
      </ClientOnly>

      <!-- 连接状态 -->
      <ClientOnly>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/20">
          <span class="relative flex size-2">
            <span
              v-if="isConnected"
              class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75"
            />
            <span
              class="relative inline-flex size-2 rounded-full"
              :class="isConnected ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'"
            />
          </span>
          <span class="text-xs font-medium" :class="isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted'">
            {{ isConnected ? '已连接' : '未连接' }}
          </span>
        </div>
      </ClientOnly>

      <div class="flex-1" />

      <!-- 语言选择 -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-white/20">
        <UIcon name="i-lucide-globe" class="size-4 text-primary-500" />
        <USelectMenu
          :model-value="sourceLang"
          :items="langOptions"
          placeholder="源语言"
          class="w-28"
          size="sm"
          @update:model-value="emit('update:sourceLang', $event)"
        />
        <div class="flex items-center justify-center size-6 rounded-full bg-primary-500/10">
          <UIcon name="i-lucide-arrow-right" class="size-3.5 text-primary-500" />
        </div>
        <USelectMenu
          :model-value="targetLang"
          :items="langOptions"
          placeholder="目标语言"
          class="w-28"
          size="sm"
          @update:model-value="emit('update:targetLang', $event)"
        />
      </div>

      <!-- 清空 -->
      <UButton
        icon="i-lucide-trash-2"
        size="sm"
        color="neutral"
        variant="ghost"
        @click="emit('clear')"
      />
    </div>
  </div>
</template>
