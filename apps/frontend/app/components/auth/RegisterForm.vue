<script setup lang="ts">
defineProps<{
  registerForm: { username: string, email: string, password: string, verifyCode: string }
  loading: boolean
  countdown: number
}>()

const emit = defineEmits<{
  submit: []
  sendCode: []
  toggleToLogin: []
}>()
</script>

<template>
  <div class="w-full max-w-sm mx-auto">
    <h2 id="register-heading" class="text-2xl font-bold mb-1 text-default">
      创建账号
    </h2>
    <p class="text-sm text-muted mb-5">
      注册一个新账号开始使用
    </p>

    <form class="space-y-3.5" aria-labelledby="register-heading" @submit.prevent="emit('submit')">
      <div class="space-y-1">
        <label for="register-username" class="text-sm font-medium text-default">用户名</label>
        <div class="input-group relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <UIcon name="i-lucide-user" class="text-teal-500 dark:text-teal-400 text-lg" />
          </div>
          <input
            id="register-username"
            :value="registerForm.username"
            type="text"
            placeholder="请输入用户名"
            class="auth-input"
            aria-label="用户名"
            aria-required="true"
            @input="registerForm.username = ($event.target as HTMLInputElement).value"
          >
        </div>
      </div>

      <div class="space-y-1">
        <label for="register-email" class="text-sm font-medium text-default">邮箱</label>
        <div class="input-group relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <UIcon name="i-lucide-mail" class="text-teal-500 dark:text-teal-400 text-lg" />
          </div>
          <input
            id="register-email"
            :value="registerForm.email"
            type="email"
            placeholder="请输入邮箱"
            class="auth-input"
            aria-label="邮箱"
            aria-required="true"
            @input="registerForm.email = ($event.target as HTMLInputElement).value"
          >
        </div>
      </div>

      <div class="space-y-1">
        <label for="register-password" class="text-sm font-medium text-default">密码</label>
        <div class="input-group relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
            <UIcon name="i-lucide-lock" class="text-teal-500 dark:text-teal-400 text-lg" />
          </div>
          <input
            id="register-password"
            :value="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            class="auth-input"
            aria-label="密码"
            aria-required="true"
            @input="registerForm.password = ($event.target as HTMLInputElement).value"
          >
        </div>
      </div>

      <div class="space-y-1">
        <label for="register-code" class="text-sm font-medium text-default">验证码</label>
        <div class="flex gap-2">
          <div class="input-group relative flex-1">
            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
              <UIcon name="i-lucide-shield-check" class="text-teal-500 dark:text-teal-400 text-lg" />
            </div>
            <input
              id="register-code"
              :value="registerForm.verifyCode"
              type="text"
              placeholder="请输入验证码"
              class="auth-input"
              aria-label="验证码"
              aria-required="true"
              @input="registerForm.verifyCode = ($event.target as HTMLInputElement).value"
            >
          </div>
          <button
            type="button"
            :disabled="countdown > 0"
            class="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
            :class="countdown > 0
              ? 'bg-gray-100 dark:bg-gray-700 text-muted cursor-not-allowed'
              : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-700'"
            aria-label="获取验证码"
            @click="emit('sendCode')"
          >
            {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="auth-btn w-full"
      >
        <UIcon v-if="loading" name="i-lucide-loader-2" class="animate-spin mr-2" />
        注册
      </button>
    </form>

    <!-- Mobile toggle link -->
    <p class="mt-4 text-center text-sm text-muted lg:hidden">
      已有账号？
      <button class="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer" @click="emit('toggleToLogin')">
        立即登录
      </button>
    </p>
  </div>
</template>
