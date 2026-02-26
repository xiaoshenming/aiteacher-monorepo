<script setup lang="ts">
const userStore = useUserStore()

defineProps<{
  loading?: boolean
}>()

const roleIcon = computed(() => {
  switch (userStore.userInfo.role) {
    case '2': return 'i-lucide-user'
    case '3': return 'i-lucide-shield'
    case '4': return 'i-lucide-crown'
    case '0': return 'i-lucide-graduation-cap'
    default: return 'i-lucide-user'
  }
})

const roleBadgeColor = computed(() => {
  switch (userStore.userInfo.role) {
    case '3': return 'warning'
    case '4': return 'error'
    default: return 'primary'
  }
})
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5">
    <template v-if="loading">
      <div class="flex flex-col items-center gap-3">
        <USkeleton class="w-16 h-16 rounded-full" />
        <USkeleton class="h-5 w-24" />
        <USkeleton class="h-5 w-16" />
      </div>
    </template>
    <template v-else>
      <div class="flex flex-col items-center text-center">
        <UAvatar
          v-if="userStore.userInfo.avatar"
          :src="userStore.userInfo.avatar"
          :alt="userStore.userInfo.name"
          size="xl"
        />
        <div
          v-else
          class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <UIcon :name="roleIcon" class="text-2xl text-primary" />
        </div>
        <h3 class="text-base font-semibold text-[var(--ui-text-highlighted)] mt-3">
          {{ userStore.userInfo.name || '用户' }}
        </h3>
        <UBadge :color="roleBadgeColor" variant="subtle" size="sm" class="mt-1.5">
          {{ userStore.roleLabel }}
        </UBadge>
        <p v-if="userStore.userInfo.email" class="text-xs text-[var(--ui-text-muted)] mt-2 truncate max-w-full">
          {{ userStore.userInfo.email }}
        </p>
      </div>
    </template>
  </div>
</template>
