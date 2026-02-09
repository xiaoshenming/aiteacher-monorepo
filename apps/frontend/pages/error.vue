<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div class="text-center space-y-4">
      <div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
        <UIcon name="i-lucide-shield-x" class="text-3xl text-red-600 dark:text-red-400" />
      </div>
      <h1 class="text-2xl font-bold text-default">
        访问受限
      </h1>
      <p class="text-muted">
        您没有权限访问此页面。
      </p>
      <div class="flex gap-3 justify-center pt-4">
        <button
          class="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-default hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          @click="navigateTo('/')"
        >
          返回首页
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
          @click="navigateTo('/login')"
        >
          重新登录
        </button>
      </div>
    </div>
  </div>
</template>
