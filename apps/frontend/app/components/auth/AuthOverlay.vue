<script setup lang="ts">
defineProps<{
  isRegisterMode: boolean
}>()

const emit = defineEmits<{
  toggleToRegister: []
  toggleToLogin: []
}>()
</script>

<template>
  <div
    class="absolute top-0 left-0 h-full w-1/2 overflow-hidden transition-all duration-700 ease-in-out z-50 hidden lg:block"
    :class="[isRegisterMode ? 'translate-x-0 rounded-r-[80px] rounded-l-[24px]' : 'translate-x-full rounded-l-[80px] rounded-r-[24px]']"
  >
    <div class="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 text-white h-full w-full">
      <!-- Decorative circles -->
      <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10" />
      <div class="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10" />
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/5" />

      <!-- "还没有账号？注册" panel -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-all duration-700 ease-in-out"
        :class="[!isRegisterMode ? 'translate-x-0 pointer-events-auto opacity-100' : 'translate-x-[20%] opacity-0 pointer-events-none']"
      >
        <div class="mb-6">
          <NuxtImg src="/logo.png" alt="" class="h-12 w-12 mx-auto mb-4 drop-shadow-lg" />
        </div>
        <h3 class="text-2xl font-bold mb-3">
          还没有账号？
        </h3>
        <p class="mb-8 text-white/85 text-sm leading-relaxed max-w-[240px]">
          立即注册一个账号，开始探索 AI 教学助手的全部功能
        </p>
        <button class="overlay-btn" @click="emit('toggleToRegister')">
          注册账号
        </button>
      </div>

      <!-- "已有账号？登录" panel -->
      <div
        class="absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-all duration-700 ease-in-out"
        :class="[isRegisterMode ? 'translate-x-0 pointer-events-auto opacity-100' : '-translate-x-[20%] opacity-0 pointer-events-none']"
      >
        <div class="mb-6">
          <NuxtImg src="/logo.png" alt="" class="h-12 w-12 mx-auto mb-4 drop-shadow-lg" />
        </div>
        <h3 class="text-2xl font-bold mb-3">
          已有账号？
        </h3>
        <p class="mb-8 text-white/85 text-sm leading-relaxed max-w-[240px]">
          欢迎回来！请登录您的账号继续您的学习旅程
        </p>
        <button class="overlay-btn" @click="emit('toggleToLogin')">
          登录账号
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay-btn {
  padding: 0.625rem 2rem;
  color: white;
  background-color: rgba(255, 255, 255, 0.15);
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(4px);
}

.overlay-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
  border-color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.overlay-btn:active {
  transform: translateY(0);
}
</style>
