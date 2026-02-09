<script setup lang="ts">
import gsap from 'gsap'

definePageMeta({
  layout: false,
})

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const { apiFetch } = useApi()

// Animation refs
const containerRef = ref<HTMLElement>()
const loginFormRef = ref<HTMLElement>()
const registerFormRef = ref<HTMLElement>()
const particle1 = ref<HTMLElement>()
const particle2 = ref<HTMLElement>()
const particle3 = ref<HTMLElement>()
const particle4 = ref<HTMLElement>()
const particle5 = ref<HTMLElement>()

// UI state
const isRegisterMode = ref(route.query.tab === 'register')
const isAnimating = ref(false)

// Login form
const loginForm = reactive({
  account: '',
  password: '',
  rememberMe: false,
})

// Register form
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  verifyCode: '',
})

const loading = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null
let particleAnimations: gsap.core.Timeline[] = []

// Toggle animations with debounce
function toggleToRegister() {
  if (isAnimating.value || isRegisterMode.value) return
  isAnimating.value = true
  isRegisterMode.value = true
  setTimeout(() => { isAnimating.value = false }, 800)
}

function toggleToLogin() {
  if (isAnimating.value || !isRegisterMode.value) return
  isAnimating.value = true
  isRegisterMode.value = false
  setTimeout(() => { isAnimating.value = false }, 800)
}

// GSAP particle animation
function setupParticles() {
  const particles = [particle1.value, particle2.value, particle3.value, particle4.value, particle5.value]

  particles.forEach((particle) => {
    if (!particle) return

    gsap.set(particle, {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      opacity: Math.random() * 0.5 + 0.2,
    })

    const tl = gsap.timeline({ repeat: -1, yoyo: true })
    const duration = 12 + Math.random() * 18

    tl.to(particle, {
      x: `+=${Math.random() * 250 - 125}`,
      y: `+=${Math.random() * 250 - 125}`,
      opacity: Math.random() * 0.3 + 0.1,
      duration: duration / 2,
      ease: 'sine.inOut',
    }).to(particle, {
      x: `+=${Math.random() * 250 - 125}`,
      y: `+=${Math.random() * 250 - 125}`,
      opacity: Math.random() * 0.5 + 0.2,
      duration: duration / 2,
      ease: 'sine.inOut',
    })

    particleAnimations.push(tl)
  })
}

// Login handler with GSAP feedback
async function handleLogin() {
  if (!loginForm.account || !loginForm.password) {
    toast.add({ title: '请填写账号和密码', color: 'error' })
    shakeForm(loginFormRef.value)
    return
  }

  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: { token: string, role?: string }, msg?: string }>('/pc/login', {
      method: 'POST',
      body: {
        account: loginForm.account,
        password: loginForm.password,
      },
    })

    if (res.code === 200 && res.data?.token) {
      userStore.setToken(res.data.token)
      toast.add({ title: '登录成功', color: 'success' })

      // Success animation then navigate
      if (loginFormRef.value) {
        gsap.to(loginFormRef.value, {
          y: -20,
          opacity: 0,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            const roleMap: Record<string, string> = {
              '0': '/student',
              '1': '/home',
              '2': '/user',
              '3': '/admin',
              '4': '/superadmin',
            }
            navigateTo(roleMap[res.data.role || ''] || '/dashboard')
          },
        })
      }
      else {
        navigateTo('/dashboard')
      }
    }
    else {
      toast.add({ title: res.msg || '登录失败', color: 'error' })
      shakeForm(loginFormRef.value)
    }
  }
  catch {
    toast.add({ title: '网络错误，请稍后重试', color: 'error' })
    shakeForm(loginFormRef.value)
  }
  finally {
    loading.value = false
  }
}

async function sendVerifyCode() {
  if (!registerForm.email) {
    toast.add({ title: '请输入邮箱', color: 'error' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
    toast.add({ title: '请输入有效的邮箱地址', color: 'warning' })
    return
  }
  if (countdown.value > 0) return

  try {
    const res = await apiFetch<{ code: number, msg?: string }>('/send-verification-code', {
      method: 'POST',
      body: { email: registerForm.email },
    })

    if (res.code === 200) {
      toast.add({ title: '验证码已发送', color: 'success' })
      countdown.value = 60
      countdownTimer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }, 1000)
    }
    else {
      toast.add({ title: res.msg || '发送失败', color: 'error' })
    }
  }
  catch {
    toast.add({ title: '网络错误', color: 'error' })
  }
}

async function handleRegister() {
  if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.verifyCode) {
    toast.add({ title: '请填写所有字段', color: 'error' })
    shakeForm(registerFormRef.value)
    return
  }
  if (registerForm.password.length < 6) {
    toast.add({ title: '密码长度不能少于6个字符', color: 'error' })
    shakeForm(registerFormRef.value)
    return
  }

  loading.value = true
  try {
    const res = await apiFetch<{ code: number, msg?: string }>('/register', {
      method: 'POST',
      body: {
        name: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        code: registerForm.verifyCode,
      },
    })

    if (res.code === 201 || res.code === 200) {
      toast.add({ title: '注册成功，请登录', color: 'success' })

      // Success animation
      if (registerFormRef.value) {
        gsap.to(registerFormRef.value, {
          y: -10,
          opacity: 0.8,
          duration: 0.3,
          ease: 'power2.out',
          onComplete: () => {
            gsap.to(registerFormRef.value!, {
              y: 0,
              opacity: 1,
              duration: 0.3,
              delay: 0.1,
            })
            setTimeout(() => toggleToLogin(), 600)
          },
        })
      }

      // Clear form
      registerForm.username = ''
      registerForm.email = ''
      registerForm.password = ''
      registerForm.verifyCode = ''
    }
    else {
      toast.add({ title: res.msg || '注册失败', color: 'error' })
      shakeForm(registerFormRef.value)
    }
  }
  catch {
    toast.add({ title: '网络错误', color: 'error' })
    shakeForm(registerFormRef.value)
  }
  finally {
    loading.value = false
  }
}

// GSAP shake animation for error feedback
function shakeForm(el?: HTMLElement) {
  if (!el) return
  gsap.fromTo(el, { x: 0 }, {
    x: 10,
    duration: 0.08,
    repeat: 3,
    yoyo: true,
    ease: 'power2.inOut',
  })
}

onMounted(() => {
  setupParticles()

  // Container entrance animation
  if (containerRef.value) {
    gsap.from(containerRef.value, {
      y: 60,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
    })
  }
})

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
  particleAnimations.forEach(tl => tl.kill())
  particleAnimations = []
})
</script>

<template>
  <ClientOnly>
    <div class="relative min-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
      <!-- Background image with gradient overlay -->
      <div class="fixed inset-0 z-0">
        <img
          src="/images/gallery/pexels-mountain-lake.jpeg"
          alt=""
          class="absolute inset-0 w-full h-full object-cover"
        >
        <div class="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-gray-900/70 to-teal-800/80" />
      </div>

      <!-- Floating particles -->
      <div class="absolute inset-0 z-1 pointer-events-none">
        <div ref="particle1" class="absolute w-2 h-2 rounded-full bg-teal-400/70 blur-sm" />
        <div ref="particle2" class="absolute w-3 h-3 rounded-full bg-cyan-400/60 blur-sm" />
        <div ref="particle3" class="absolute w-2 h-2 rounded-full bg-emerald-400/70 blur-sm" />
        <div ref="particle4" class="absolute w-4 h-4 rounded-full bg-teal-300/50 blur-md" />
        <div ref="particle5" class="absolute w-2.5 h-2.5 rounded-full bg-sky-400/60 blur-sm" />
      </div>

      <!-- Main container -->
      <div class="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div
          ref="containerRef"
          class="auth-container relative w-[900px] h-[560px] rounded-[24px] overflow-hidden bg-white dark:bg-gray-800 shadow-2xl transition-colors duration-300"
        >
          <!-- Login Form (Left Side) -->
          <div
            ref="loginFormRef"
            class="absolute top-0 left-0 h-full w-1/2 p-10 transition-all duration-700 ease-in-out z-10 flex flex-col justify-center"
            :class="[!isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-[20%] pointer-events-none']"
          >
            <div class="w-full max-w-sm mx-auto">
              <!-- Logo -->
              <div class="flex items-center gap-2 mb-2">
                <img src="/favicon.svg" alt="AI教学助手" class="h-7 w-7">
                <span class="text-sm font-medium text-muted">AI教学助手</span>
              </div>

              <h2 class="text-2xl font-bold mb-1 text-default">
                欢迎回来
              </h2>
              <p class="text-sm text-muted mb-6">
                登录您的账号继续使用
              </p>

              <form class="space-y-4" @submit.prevent="handleLogin">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-default">账号</label>
                  <div class="input-group relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                      <UIcon name="i-lucide-user" class="text-teal-500 dark:text-teal-400 text-lg" />
                    </div>
                    <input
                      v-model="loginForm.account"
                      type="text"
                      placeholder="邮箱或手机号"
                      autocomplete="username"
                      class="auth-input"
                    >
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-default">密码</label>
                  <div class="input-group relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                      <UIcon name="i-lucide-lock" class="text-teal-500 dark:text-teal-400 text-lg" />
                    </div>
                    <input
                      v-model="loginForm.password"
                      type="password"
                      placeholder="请输入密码"
                      autocomplete="current-password"
                      class="auth-input"
                    >
                  </div>
                </div>

                <div class="flex justify-between items-center">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input v-model="loginForm.rememberMe" type="checkbox" class="w-4 h-4 rounded text-teal-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-teal-500">
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
                <button class="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer" @click="toggleToRegister">
                  立即注册
                </button>
              </p>
            </div>
          </div>

          <!-- Register Form (Right Side) -->
          <div
            ref="registerFormRef"
            class="absolute top-0 right-0 h-full w-1/2 p-10 transition-all duration-700 ease-in-out z-10 flex flex-col justify-center"
            :class="[isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-[20%] pointer-events-none']"
          >
            <div class="w-full max-w-sm mx-auto">
              <h2 class="text-2xl font-bold mb-1 text-default">
                创建账号
              </h2>
              <p class="text-sm text-muted mb-5">
                注册一个新账号开始使用
              </p>

              <form class="space-y-3.5" @submit.prevent="handleRegister">
                <div class="space-y-1">
                  <label class="text-sm font-medium text-default">用户名</label>
                  <div class="input-group relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                      <UIcon name="i-lucide-user" class="text-teal-500 dark:text-teal-400 text-lg" />
                    </div>
                    <input
                      v-model="registerForm.username"
                      type="text"
                      placeholder="请输入用户名"
                      class="auth-input"
                    >
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-sm font-medium text-default">邮箱</label>
                  <div class="input-group relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                      <UIcon name="i-lucide-mail" class="text-teal-500 dark:text-teal-400 text-lg" />
                    </div>
                    <input
                      v-model="registerForm.email"
                      type="email"
                      placeholder="请输入邮箱"
                      class="auth-input"
                    >
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-sm font-medium text-default">密码</label>
                  <div class="input-group relative">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                      <UIcon name="i-lucide-lock" class="text-teal-500 dark:text-teal-400 text-lg" />
                    </div>
                    <input
                      v-model="registerForm.password"
                      type="password"
                      placeholder="请输入密码（至少6位）"
                      class="auth-input"
                    >
                  </div>
                </div>

                <div class="space-y-1">
                  <label class="text-sm font-medium text-default">验证码</label>
                  <div class="flex gap-2">
                    <div class="input-group relative flex-1">
                      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                        <UIcon name="i-lucide-shield-check" class="text-teal-500 dark:text-teal-400 text-lg" />
                      </div>
                      <input
                        v-model="registerForm.verifyCode"
                        type="text"
                        placeholder="请输入验证码"
                        class="auth-input"
                      >
                    </div>
                    <button
                      type="button"
                      :disabled="countdown > 0"
                      class="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                      :class="countdown > 0
                        ? 'bg-gray-100 dark:bg-gray-700 text-muted cursor-not-allowed'
                        : 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-700'"
                      @click="sendVerifyCode"
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
                <button class="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer" @click="toggleToLogin">
                  立即登录
                </button>
              </p>
            </div>
          </div>

          <!-- Sliding Overlay -->
          <div
            class="absolute top-0 left-0 h-full w-1/2 overflow-hidden transition-all duration-700 ease-in-out z-50 hidden lg:block"
            :class="[isRegisterMode ? 'translate-x-0 rounded-r-[80px] rounded-l-[24px]' : 'translate-x-full rounded-l-[80px] rounded-r-[24px]']"
          >
            <div class="absolute inset-0 bg-gradient-to-br from-teal-500 to-emerald-600 text-white h-full w-full">
              <!-- Decorative circles -->
              <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10" />
              <div class="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10" />
              <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-white/5" />

              <!-- "还没有账号？注册" panel: show when login mode (overlay on right side) -->
              <div
                class="absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-all duration-700 ease-in-out"
                :class="[!isRegisterMode ? 'translate-x-0 pointer-events-auto opacity-100' : 'translate-x-[20%] opacity-0 pointer-events-none']"
              >
                <div class="mb-6">
                  <img src="/favicon.svg" alt="" class="h-12 w-12 mx-auto mb-4 drop-shadow-lg">
                </div>
                <h3 class="text-2xl font-bold mb-3">
                  还没有账号？
                </h3>
                <p class="mb-8 text-white/85 text-sm leading-relaxed max-w-[240px]">
                  立即注册一个账号，开始探索 AI 教学助手的全部功能
                </p>
                <button class="overlay-btn" @click="toggleToRegister">
                  注册账号
                </button>
              </div>

              <!-- "已有账号？登录" panel: show when register mode (overlay on left side) -->
              <div
                class="absolute inset-0 flex flex-col items-center justify-center px-10 text-center transition-all duration-700 ease-in-out"
                :class="[isRegisterMode ? 'translate-x-0 pointer-events-auto opacity-100' : '-translate-x-[20%] opacity-0 pointer-events-none']"
              >
                <div class="mb-6">
                  <img src="/favicon.svg" alt="" class="h-12 w-12 mx-auto mb-4 drop-shadow-lg">
                </div>
                <h3 class="text-2xl font-bold mb-3">
                  已有账号？
                </h3>
                <p class="mb-8 text-white/85 text-sm leading-relaxed max-w-[240px]">
                  欢迎回来！请登录您的账号继续您的学习旅程
                </p>
                <button class="overlay-btn" @click="toggleToLogin">
                  登录账号
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="fixed bottom-0 left-0 right-0 py-4 text-center text-white/70 text-xs z-10">
        &copy; {{ new Date().getFullYear() }} AI教学助手 &middot; 让教育更智能
      </footer>
    </div>
  </ClientOnly>
</template>

<style scoped>
.auth-container {
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Input styling */
.auth-input {
  width: 100%;
  padding: 0.625rem 0.75rem 0.625rem 2.5rem;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.75rem;
  background: var(--color-gray-50);
  color: var(--color-gray-900);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  outline: none;
}

.auth-input::placeholder {
  color: var(--color-gray-400);
}

.auth-input:focus {
  border-color: var(--color-teal-500);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  background: white;
}

:is(.dark) .auth-input {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: white;
}

:is(.dark) .auth-input::placeholder {
  color: var(--color-gray-400);
}

:is(.dark) .auth-input:focus {
  border-color: var(--color-teal-400);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  background: var(--color-gray-700);
}

/* Icon scale on focus */
.input-group:focus-within .text-teal-500,
.input-group:focus-within .text-teal-400 {
  transform: scale(1.15);
  transition: transform 0.2s ease;
}

/* Primary button */
.auth-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  background: linear-gradient(135deg, var(--color-teal-500), var(--color-emerald-600));
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

.auth-btn:active:not(:disabled) {
  transform: translateY(0);
}

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Overlay toggle button */
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

/* Autofill fix */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px white inset;
  transition: background-color 5000s ease-in-out 0s;
}

:is(.dark) input:-webkit-autofill,
:is(.dark) input:-webkit-autofill:hover,
:is(.dark) input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px var(--color-gray-700) inset;
  -webkit-text-fill-color: white;
}

/* Responsive: stack on small screens */
@media (max-width: 1023px) {
  .auth-container {
    width: 100% !important;
    max-width: 420px;
    height: auto !important;
    min-height: auto;
  }

  .auth-container > div:first-child,
  .auth-container > div:nth-child(2) {
    position: relative !important;
    width: 100% !important;
    padding: 2rem 1.5rem !important;
  }
}
</style>
