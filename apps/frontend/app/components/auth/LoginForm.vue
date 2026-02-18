<script setup lang="ts">
defineProps<{
  loginForm: { account: string, password: string, rememberMe: boolean }
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
  toggleToRegister: []
}>()
</script>

<template>
  <div class="w-full max-w-sm mx-auto">
    <!-- Logo -->
    <div class="flex items-center gap-2 mb-2">
      <NuxtImg src="/logo.png" alt="AI教学助手" class="h-7 w-7" />
      <span class="text-sm font-medium text-muted">AI教学助手</span>
    </div>

    <h2 id="login-heading" class="text-2xl font-bold mb-1 text-default">
      欢迎回来
    </h2>
    <p class="text-sm text-muted mb-6">
      登录您的账号继续使用
    </p>

    <form class="space-y-4" aria-labelledby="login-heading" @submit.prevent="emit('submit')">
      <div class="space-y-1.5">
        <label for="login-account" class="text-sm font-medium text-default">账号</label>
        <div class="input-group relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <UIcon name="i-lucide-user" class="text-teal-500 dark:text-teal-400 text-lg" />
          </div>
          <input
            id="login-account"
            :value="loginForm.account"
            type="text"
            placeholder="邮箱或手机号"
            autocomplete="username"
            class="auth-input"
            aria-label="账号"
            aria-required="true"
            @input="loginForm.account = ($event.target as HTMLInputElement).value"
          >
        </div>
      </div>

      <div class="space-y-1.5">
        <label for="login-password" class="text-sm font-medium text-default">密码</label>
        <div class="input-group relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <UIcon name="i-lucide-lock" class="text-teal-500 dark:text-teal-400 text-lg" />
          </div>
          <input
            id="login-password"
            :value="loginForm.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="current-password"
            class="auth-input"
            aria-label="密码"
            aria-required="true"
            @input="loginForm.password = ($event.target as HTMLInputElement).value"
          >
        </div>
      </div>

      <div class="flex justify-between items-center">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            :checked="loginForm.rememberMe"
            type="checkbox"
            class="w-4 h-4 rounded text-teal-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-teal-500"
            @change="loginForm.rememberMe = ($event.target as HTMLInputElement).checked"
          >
          <span class="text-sm text-muted">记住我</span>
        </label>
        <a href="#" class="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:underline transition-colors">忘记密码？</a>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="auth-btn w-full"
      >
        <UIcon v-if="loading" name="i-lucide-loader-2" class="animate-spin mr-2" />
        登录
      </button>
    </form>

    <!-- Mobile toggle link -->
    <p class="mt-6 text-center text-sm text-muted lg:hidden">
      还没有账号？
      <button class="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer" @click="emit('toggleToRegister')">
        立即注册
      </button>
    </p>
  </div>
</template>
