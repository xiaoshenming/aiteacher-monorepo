<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  currentModel: string
  chatStatus: 'ready' | 'streaming' | 'submitted' | 'error'
  modelOptions: Array<{ label: string, value: string, icon: string }>
  showStop?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:currentModel': [value: string]
  submit: [e: Event]
  stop: []
}>()

const inputValue = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
})

const modelVal = computed({
  get: () => props.currentModel,
  set: (val: string) => emit('update:currentModel', val),
})
</script>

<template>
  <div class="rounded-2xl border border-default bg-elevated shadow-lg ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
    <UChatPrompt
      v-model="inputValue"
      variant="subtle"
      placeholder="输入你的问题..."
      autofocus
      :ui="{ base: 'px-4 py-3' }"
      @submit="emit('submit', $event)"
    >
      <template #footer>
        <ClientOnly>
          <div class="flex items-center gap-2">
            <USelectMenu
              v-model="modelVal"
              :items="modelOptions"
              value-key="value"
              size="xs"
              variant="ghost"
              color="neutral"
              class="w-auto"
            />
          </div>
        </ClientOnly>
        <UChatPromptSubmit
          :status="chatStatus"
          color="neutral"
          size="sm"
          @stop="emit('stop')"
        />
      </template>
    </UChatPrompt>
  </div>
</template>
