<script setup lang="ts">
const route = useRoute()

// Animation refs
const containerRef = ref<HTMLElement>()
const loginFormRef = ref<HTMLElement>()
const registerFormRef = ref<HTMLElement>()
const particleBgRef = ref<InstanceType<typeof import('./ParticleBackground.vue').default>>()

// UI state
const isRegisterMode = ref(route.query.tab === 'register')
const isAnimating = ref(false)

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

// Composables
const { loginForm, loading: loginLoading, handleLogin } = useLoginForm(loginFormRef)
const {
  registerForm,
  loading: registerLoading,
  countdown,
  sendVerifyCode,
  handleRegister,
  cleanup: cleanupRegister,
} = useRegisterForm(registerFormRef, toggleToLogin)

const { init: initAnimation, cleanup: cleanupAnimation } = useLoginAnimation(
  containerRef,
  {
    particle1: computed(() => particleBgRef.value?.particle1) as Ref<HTMLElement | undefined>,
    particle2: computed(() => particleBgRef.value?.particle2) as Ref<HTMLElement | undefined>,
    particle3: computed(() => particleBgRef.value?.particle3) as Ref<HTMLElement | undefined>,
    particle4: computed(() => particleBgRef.value?.particle4) as Ref<HTMLElement | undefined>,
    particle5: computed(() => particleBgRef.value?.particle5) as Ref<HTMLElement | undefined>,
  },
)

onMounted(() => {
  initAnimation()
})

onUnmounted(() => {
  cleanupRegister()
  cleanupAnimation()
})
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
    <!-- Background image with gradient overlay -->
    <div class="fixed inset-0 z-0">
      <img
        src="/images/gallery/pexels-mountain-lake.jpeg"
        alt="登录页背景"
        class="absolute inset-0 w-full h-full object-cover"
      >
      <div class="absolute inset-0 bg-gradient-to-br from-teal-900/80 via-gray-900/70 to-teal-800/80" />
    </div>

    <!-- Floating particles -->
    <AuthParticleBackground ref="particleBgRef" />

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
          <AuthLoginForm
            :login-form="loginForm"
            :loading="loginLoading"
            @submit="handleLogin"
            @toggle-to-register="toggleToRegister"
          />
        </div>

        <!-- Register Form (Right Side) -->
        <div
          ref="registerFormRef"
          class="absolute top-0 right-0 h-full w-1/2 p-10 transition-all duration-700 ease-in-out z-10 flex flex-col justify-center"
          :class="[isRegisterMode ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-[20%] pointer-events-none']"
        >
          <AuthRegisterForm
            :register-form="registerForm"
            :loading="registerLoading"
            :countdown="countdown"
            @submit="handleRegister"
            @send-code="sendVerifyCode"
            @toggle-to-login="toggleToLogin"
          />
        </div>

        <!-- Sliding Overlay -->
        <AuthOverlay
          :is-register-mode="isRegisterMode"
          @toggle-to-register="toggleToRegister"
          @toggle-to-login="toggleToLogin"
        />
      </div>
    </div>

    <!-- Footer -->
    <footer class="fixed bottom-0 left-0 right-0 py-4 text-center text-white/70 text-xs z-10">
      &copy; {{ new Date().getFullYear() }} AI教学助手 &middot; 让教育更智能
    </footer>
  </div>
</template>

<style scoped>
.auth-container {
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* Input styling */
:deep(.auth-input) {
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

:deep(.auth-input)::placeholder {
  color: var(--color-gray-400);
}

:deep(.auth-input):focus {
  border-color: var(--color-teal-500);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  background: white;
}

:is(.dark) :deep(.auth-input) {
  background: var(--color-gray-700);
  border-color: var(--color-gray-600);
  color: white;
}

:is(.dark) :deep(.auth-input)::placeholder {
  color: var(--color-gray-400);
}

:is(.dark) :deep(.auth-input):focus {
  border-color: var(--color-teal-400);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  background: var(--color-gray-700);
}

/* Icon scale on focus */
:deep(.input-group):focus-within .text-teal-500,
:deep(.input-group):focus-within .text-teal-400 {
  transform: scale(1.15);
  transition: transform 0.2s ease;
}

/* Primary button */
:deep(.auth-btn) {
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

:deep(.auth-btn):hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(20, 184, 166, 0.4);
}

:deep(.auth-btn):active:not(:disabled) {
  transform: translateY(0);
}

:deep(.auth-btn):disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Autofill fix */
:deep(input):-webkit-autofill,
:deep(input):-webkit-autofill:hover,
:deep(input):-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px white inset;
  transition: background-color 5000s ease-in-out 0s;
}

:is(.dark) :deep(input):-webkit-autofill,
:is(.dark) :deep(input):-webkit-autofill:hover,
:is(.dark) :deep(input):-webkit-autofill:focus {
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
