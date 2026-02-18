<script setup lang="ts">
const userStore = useUserStore()

// 自动跳转到角色对应的后台首页
if (userStore.isLoggedIn && userStore.roleHome !== '/dashboard') {
  await navigateTo(userStore.roleHome, { replace: true })
}
</script>

<template>
  <section class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900" aria-label="仪表盘">
    <div class="text-center space-y-4">
      <UIcon name="i-lucide-loader-circle" class="text-4xl text-primary animate-spin" />
      <p class="text-muted">
        正在跳转...
      </p>
    </div>
  </section>
</template>
