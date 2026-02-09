<script setup lang="ts">
const userStore = useUserStore()

const roleIcon = computed(() => {
  switch (userStore.userInfo.role) {
    case '2': return 'i-lucide-user'
    case '3': return 'i-lucide-shield'
    case '4': return 'i-lucide-crown'
    case '0': return 'i-lucide-graduation-cap'
    default: return 'i-lucide-user'
  }
})
</script>

<template>
  <div class="flex items-center gap-4">
    <UAvatar
      v-if="userStore.userInfo.avatar"
      :src="userStore.userInfo.avatar"
      :alt="userStore.userInfo.name"
      size="xl"
    />
    <div
      v-else
      class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
    >
      <UIcon :name="roleIcon" class="text-2xl text-primary" />
    </div>
    <div class="min-w-0">
      <h2 class="text-xl font-semibold text-highlighted truncate">
        {{ userStore.userInfo.name || '用户' }}
      </h2>
      <p class="text-sm text-muted">
        {{ userStore.roleLabel }}
      </p>
    </div>
  </div>
</template>
