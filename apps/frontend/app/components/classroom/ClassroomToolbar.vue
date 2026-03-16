<template>
  <div class="flex items-center gap-2 flex-wrap">
    <UButton icon="i-lucide-shuffle" color="primary" variant="soft" @click="$emit('random-pick')">
      随机点名
    </UButton>
    <UButton icon="i-lucide-bar-chart-2" color="neutral" variant="soft" @click="$emit('start-poll')">
      课堂投票
    </UButton>
    <UButton icon="i-lucide-clipboard-check" color="neutral" variant="soft" @click="$emit('start-quiz')">
      随堂测验
    </UButton>
    <UButton icon="i-lucide-timer" color="neutral" variant="soft" @click="$emit('start-timer')">
      倒计时
    </UButton>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'random-pick': []
  'start-poll': []
  'start-quiz': []
  'start-timer': []
}>()
</script>
