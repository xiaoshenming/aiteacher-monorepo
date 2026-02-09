<script setup lang="ts">
definePageMeta({
  layout: false,
})

const route = useRoute()
const toast = useToast()
const userStore = useUserStore()
const { apiFetch } = useApi()

const isLogin = ref(route.query.tab !== 'register')

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

function toggleMode() {
  isLogin.value = !isLogin.value
}

async function handleLogin() {
  if (!loginForm.account || !loginForm.password) {
    toast.add({ title: '请填写账号和密码', color: 'error' })
    return
  }

  loading.value = true
  try {
    const res = await apiFetch<{ code: number, data: { token: string }, msg?: string }>('/login', {
      method: 'POST',
      body: {
        account: loginForm.account,
        password: loginForm.password,
      },
    })

    if (res.code === 200 && res.data?.token) {
      userStore.setToken(res.data.token)
      toast.add({ title: '登录成功', color: 'success' })
      navigateTo('/dashboard')
    }
    else {
      toast.add({ title: res.msg || '登录失败', color: 'error' })
    }
  }
  catch {
    toast.add({ title: '网络错误，请稍后重试', color: 'error' })
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
  if (countdown.value > 0) return

  try {
    const res = await apiFetch<{ code: number, msg?: string }>('/send-code', {
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
    return
  }

  loading.value = true
  try {
    const res = await apiFetch<{ code: number, msg?: string }>('/register', {
      method: 'POST',
      body: {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password,
        verifyCode: registerForm.verifyCode,
      },
    })

    if (res.code === 200) {
      toast.add({ title: '注册成功，请登录', color: 'success' })
      isLogin.value = true
    }
    else {
      toast.add({ title: res.msg || '注册失败', color: 'error' })
    }
  }
  catch {
    toast.add({ title: '网络错误', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-(--ui-bg) px-4">
    <!-- Background decoration -->
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <div
        class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-5"
        style="background: radial-gradient(circle, var(--color-teal-400), transparent 70%)"
      />
      <div
        class="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full opacity-5"
        style="background: radial-gradient(circle, var(--color-teal-600), transparent 70%)"
      />
    </div>

    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-2">
          <img src="/favicon.svg" alt="AI教学助手" class="h-8 w-8">
          <span class="text-xl font-bold">AI教学助手</span>
        </NuxtLink>
      </div>

      <UCard :ui="{ root: 'shadow-lg' }">
        <!-- Tabs -->
        <div class="flex border-b border-default mb-6">
          <button
            class="flex-1 pb-3 text-sm font-medium transition-colors duration-200 cursor-pointer"
            :class="isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-default'"
            @click="isLogin = true"
          >
            登录
          </button>
          <button
            class="flex-1 pb-3 text-sm font-medium transition-colors duration-200 cursor-pointer"
            :class="!isLogin ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-default'"
            @click="isLogin = false"
          >
            注册
          </button>
        </div>

        <!-- Login Form -->
        <form v-if="isLogin" class="flex flex-col gap-4" @submit.prevent="handleLogin">
          <UFormField label="账号">
            <UInput
              v-model="loginForm.account"
              placeholder="邮箱或手机号"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="密码">
            <UInput
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="loginForm.rememberMe" label="记住我" />
            <UButton
              label="忘记密码？"
              variant="link"
              color="primary"
              size="sm"
              class="cursor-pointer"
            />
          </div>

          <UButton
            type="submit"
            label="登录"
            color="primary"
            size="lg"
            block
            :loading="loading"
            class="cursor-pointer mt-2"
          />
        </form>

        <!-- Register Form -->
        <form v-else class="flex flex-col gap-4" @submit.prevent="handleRegister">
          <UFormField label="用户名">
            <UInput
              v-model="registerForm.username"
              placeholder="请输入用户名"
              icon="i-lucide-user"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="邮箱">
            <UInput
              v-model="registerForm.email"
              type="email"
              placeholder="请输入邮箱"
              icon="i-lucide-mail"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="密码">
            <UInput
              v-model="registerForm.password"
              type="password"
              placeholder="请输入密码"
              icon="i-lucide-lock"
              size="lg"
              class="w-full"
            />
          </UFormField>

          <UFormField label="验证码">
            <div class="flex gap-2">
              <UInput
                v-model="registerForm.verifyCode"
                placeholder="请输入验证码"
                icon="i-lucide-shield-check"
                size="lg"
                class="flex-1"
              />
              <UButton
                :label="countdown > 0 ? `${countdown}s` : '发送验证码'"
                color="neutral"
                variant="outline"
                size="lg"
                :disabled="countdown > 0"
                class="cursor-pointer shrink-0"
                @click="sendVerifyCode"
              />
            </div>
          </UFormField>

          <UButton
            type="submit"
            label="注册"
            color="primary"
            size="lg"
            block
            :loading="loading"
            class="cursor-pointer mt-2"
          />
        </form>

        <!-- Footer -->
        <div class="mt-6 text-center text-sm text-muted">
          <template v-if="isLogin">
            还没有账号？
            <UButton
              label="立即注册"
              variant="link"
              color="primary"
              size="sm"
              class="cursor-pointer"
              @click="toggleMode"
            />
          </template>
          <template v-else>
            已有账号？
            <UButton
              label="立即登录"
              variant="link"
              color="primary"
              size="sm"
              class="cursor-pointer"
              @click="toggleMode"
            />
          </template>
        </div>
      </UCard>
    </div>
  </div>
</template>
