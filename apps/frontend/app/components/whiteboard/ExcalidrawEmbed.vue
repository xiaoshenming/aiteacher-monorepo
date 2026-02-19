<script setup lang="ts">
const props = withDefaults(defineProps<{
  roomId: string
  roomKey: string
  mode?: 'fullscreen' | 'panel'
}>(), {
  mode: 'panel',
})

const EXCALIDRAW_ORIGIN = 'http://localhost:10007'
const TIMEOUT_MS = 15000

const userStore = useUserStore()
const iframeRef = ref<HTMLIFrameElement | null>(null)
const status = ref<'loading' | 'ready' | 'error'>('loading')
const errorMessage = ref('')

let timeoutTimer: ReturnType<typeof setTimeout> | null = null

function sendToIframe(type: string, payload: Record<string, unknown> = {}) {
  iframeRef.value?.contentWindow?.postMessage(
    { source: 'aiteacher-nuxt', type, payload, requestId: crypto.randomUUID() },
    EXCALIDRAW_ORIGIN,
  )
}

function onMessage(event: MessageEvent) {
  if (event.origin !== EXCALIDRAW_ORIGIN) return

  const { type } = event.data || {}

  if (type === 'ready') {
    // Excalidraw is ready, send auth
    sendToIframe('auth:init', {
      token: userStore.token,
      user: {
        id: userStore.userInfo.id,
        name: userStore.userInfo.name,
        avatar: userStore.userInfo.avatar,
      },
    })
    // Join room
    sendToIframe('room:join', {
      roomId: props.roomId,
      roomKey: props.roomKey,
    })
    status.value = 'ready'
    if (timeoutTimer) {
      clearTimeout(timeoutTimer)
      timeoutTimer = null
    }
  }

  if (type === 'token-refresh-request') {
    sendToIframe('auth:init', {
      token: userStore.token,
      user: {
        id: userStore.userInfo.id,
        name: userStore.userInfo.name,
        avatar: userStore.userInfo.avatar,
      },
    })
  }
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  timeoutTimer = setTimeout(() => {
    if (status.value === 'loading') {
      status.value = 'error'
      errorMessage.value = '白板加载超时，请检查 Excalidraw 服务是否已启动'
    }
  }, TIMEOUT_MS)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
  if (timeoutTimer) {
    clearTimeout(timeoutTimer)
  }
})

function retry() {
  status.value = 'loading'
  errorMessage.value = ''
  // Force iframe reload
  const iframe = iframeRef.value
  if (iframe) {
    iframe.src = `${EXCALIDRAW_ORIGIN}?t=${Date.now()}`
  }
  timeoutTimer = setTimeout(() => {
    if (status.value === 'loading') {
      status.value = 'error'
      errorMessage.value = '白板加载超时，请检查 Excalidraw 服务是否已启动'
    }
  }, TIMEOUT_MS)
}

const containerClass = computed(() =>
  props.mode === 'fullscreen'
    ? 'w-full h-screen'
    : 'w-full h-full min-h-[calc(100vh-8rem)]',
)
</script>

<template>
  <div class="relative" :class="containerClass">
    <!-- Loading overlay -->
    <div
      v-if="status === 'loading'"
      class="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10 gap-3"
    >
      <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
      <p class="text-sm text-muted">正在加载白板...</p>
    </div>

    <!-- Error state -->
    <div
      v-if="status === 'error'"
      class="absolute inset-0 flex flex-col items-center justify-center z-10 gap-4"
    >
      <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400" />
      <p class="text-sm text-muted">{{ errorMessage }}</p>
      <UButton label="重试" icon="i-lucide-refresh-cw" size="sm" @click="retry" />
    </div>

    <!-- Excalidraw iframe -->
    <iframe
      ref="iframeRef"
      :src="EXCALIDRAW_ORIGIN"
      :class="containerClass"
      class="border-0"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-downloads"
      allow="clipboard-read; clipboard-write"
    />
  </div>
</template>
