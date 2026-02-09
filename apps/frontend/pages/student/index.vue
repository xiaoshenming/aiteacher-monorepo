<script setup lang="ts">
const userStore = useUserStore()
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center space-y-4">
      <div class="w-16 h-16 mx-auto rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
        <UIcon name="i-lucide-graduation-cap" class="text-3xl text-teal-600 dark:text-teal-400" />
      </div>
      <h1 class="text-2xl font-bold text-default">
        学生中心
      </h1>
      <p class="text-muted">
        欢迎，{{ userStore.userInfo.name || '同学' }}！这里是学生仪表盘。
      </p>
      <div class="pt-4">
        <button
          class="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
          @click="userStore.logout(); navigateTo('/login')"
        >
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>
