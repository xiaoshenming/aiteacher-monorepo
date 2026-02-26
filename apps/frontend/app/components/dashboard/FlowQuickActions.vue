<script setup lang="ts">
defineProps<{
  actions: Array<{ label: string, icon: string, to: string }>
}>()
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <h3 class="text-xs font-medium text-[var(--ui-text-muted)] uppercase tracking-wider mb-3">
      快捷入口
    </h3>
    <div class="space-y-0.5">
      <NuxtLink
        v-for="action in actions"
        :key="action.to"
        :to="action.to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors group"
      >
        <UIcon :name="action.icon" class="text-base text-[var(--ui-text-muted)] group-hover:text-primary transition-colors" />
        <span class="text-sm text-[var(--ui-text-highlighted)] flex-1">{{ action.label }}</span>
        <UIcon name="i-lucide-chevron-right" class="text-xs text-[var(--ui-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
      </NuxtLink>
    </div>
  </div>
</template>
