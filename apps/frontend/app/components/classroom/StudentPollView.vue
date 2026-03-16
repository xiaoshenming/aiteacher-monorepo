<template>
  <div class="space-y-4">
    <h4 class="font-medium text-highlighted">{{ question }}</h4>
    <div v-if="!voted" class="grid grid-cols-1 gap-2">
      <button v-for="(opt, i) in options" :key="i"
        class="p-3 text-left rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all duration-200"
        @click="handleVote(opt)">
        {{ opt }}
      </button>
    </div>
    <div v-else class="flex items-center gap-2 text-primary">
      <UIcon name="i-lucide-check-circle" />
      <span>已投票：{{ selectedOption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  question: string
  options: string[]
  interactionId: number
}>()

const emit = defineEmits<{ vote: [option: string] }>()
const voted = ref(false)
const selectedOption = ref('')

function handleVote(opt: string) {
  voted.value = true
  selectedOption.value = opt
  emit('vote', opt)
}
</script>
