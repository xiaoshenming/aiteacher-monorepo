<script setup lang="ts">
const { nextTheme, startViewTransitionFromEvent } = useColorModeTransition()
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-label="`切换到${nextTheme === 'dark' ? '亮色' : '暗色'}模式`"
      :icon="`i-lucide-${nextTheme === 'dark' ? 'sun' : 'moon'}`"
      color="neutral"
      variant="ghost"
      size="sm"
      class="cursor-pointer rounded-full"
      @click="startViewTransitionFromEvent"
    />
    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
