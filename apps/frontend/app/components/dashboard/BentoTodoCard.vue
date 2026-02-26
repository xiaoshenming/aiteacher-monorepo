<script setup lang="ts">
defineProps<{
  pendingAssignments: number
  unreadMessages: number
  loading?: boolean
}>()
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <template v-if="loading">
      <div class="space-y-3">
        <USkeleton class="h-5 w-24" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-lucide-list-checks" class="text-lg text-primary" />
        <span class="font-semibold text-highlighted">今日待办</span>
      </div>
      <div class="space-y-3">
        <NuxtLink
          to="/user/assignment"
          class="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="pendingAssignments > 0 ? 'bg-amber-500' : 'bg-emerald-500'"
            />
            <span class="text-sm">待批改作业</span>
          </div>
          <UBadge
            v-if="pendingAssignments > 0"
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ pendingAssignments }}
          </UBadge>
          <span v-else class="text-sm text-muted">0</span>
        </NuxtLink>
        <NuxtLink
          to="/user/messages"
          class="flex items-center justify-between p-2.5 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors"
        >
          <div class="flex items-center gap-2.5">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="unreadMessages > 0 ? 'bg-rose-500' : 'bg-emerald-500'"
            />
            <span class="text-sm">未读消息</span>
          </div>
          <UBadge
            v-if="unreadMessages > 0"
            color="error"
            variant="subtle"
            size="sm"
          >
            {{ unreadMessages }}
          </UBadge>
          <span v-else class="text-sm text-muted">0</span>
        </NuxtLink>
      </div>
      <div
        v-if="pendingAssignments === 0 && unreadMessages === 0"
        class="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-[var(--ui-border)]"
      >
        <UIcon name="i-lucide-check-circle" class="text-emerald-500" />
        <span class="text-sm text-emerald-600 dark:text-emerald-400">全部完成</span>
      </div>
    </template>
  </div>
</template>
