<script setup lang="ts">
const landppt = useLandPPT()
const config = useRuntimeConfig()
const loading = ref(true)

const iframeSrc = computed(() => landppt.getIframeUrl('/ai-config'))

function onIframeLoad() {
  loading.value = false
}

// 连接状态
const landpptStatus = ref<'connected' | 'disconnected' | 'checking'>('checking')
const retryCountdown = ref(0)
let retryTimer: ReturnType<typeof setInterval> | null = null

function startAutoRetry() {
  if (retryTimer) return
  retryCountdown.value = 30
  retryTimer = setInterval(() => {
    retryCountdown.value--
    if (retryCountdown.value <= 0) {
      clearInterval(retryTimer!)
      retryTimer = null
      initConnection()
    }
  }, 1000)
}

function stopAutoRetry() {
  if (retryTimer) {
    clearInterval(retryTimer)
    retryTimer = null
  }
  retryCountdown.value = 0
}

async function initConnection() {
  stopAutoRetry()
  landpptStatus.value = 'checking'
  try {
    await landppt.ssoLogin()
    if (landppt.ssoReady.value) {
      landpptStatus.value = 'connected'
    }
    else {
      landpptStatus.value = 'disconnected'
      startAutoRetry()
    }
  }
  catch {
    landpptStatus.value = 'disconnected'
    startAutoRetry()
  }
}

onMounted(initConnection)

onUnmounted(() => {
  stopAutoRetry()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="PPT 服务管理">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <span
            class="flex items-center gap-1.5 text-xs"
            :class="landpptStatus === 'connected' ? 'text-green-500' : landpptStatus === 'disconnected' ? 'text-red-400' : 'text-zinc-400'"
          >
            <span class="size-2 rounded-full" :class="landpptStatus === 'connected' ? 'bg-green-500' : landpptStatus === 'disconnected' ? 'bg-red-400' : 'bg-zinc-400 animate-pulse'" />
            {{ landpptStatus === 'connected' ? '已连接' : landpptStatus === 'disconnected' ? '未连接' : '检测中...' }}
          </span>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- 未连接状态 -->
      <div v-if="landpptStatus === 'disconnected'" class="p-6 space-y-6 max-w-3xl mx-auto">
        <div class="flex items-start gap-4 p-5 rounded-xl bg-primary/5 border border-primary/10">
          <div class="shrink-0 size-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <UIcon name="i-lucide-presentation" class="size-5 text-primary" />
          </div>
          <div>
            <h3 class="font-semibold text-highlighted text-base">
              AI PPT 生成服务
            </h3>
            <p class="text-sm text-muted mt-1">
              通过 LandPPT 服务，教师可以使用 AI 自动生成教学 PPT。连接后可在此管理模板、配置 AI 提供商等。
            </p>
          </div>
        </div>

        <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 overflow-hidden">
          <div class="flex items-center gap-3 px-5 py-4 border-b border-amber-200 dark:border-amber-800">
            <div class="size-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <UIcon name="i-lucide-unplug" class="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p class="font-semibold text-amber-700 dark:text-amber-400">
                LandPPT 服务未连接
              </p>
              <p class="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">
                服务地址：{{ config.public.landpptBase || 'http://localhost:10006' }}
              </p>
            </div>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <p class="text-sm font-medium text-highlighted mb-2">
                启动步骤
              </p>
              <ol class="space-y-2 text-sm text-muted">
                <li class="flex items-start gap-2">
                  <span class="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">1</span>
                  <span>进入 LandPPT 项目目录</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">2</span>
                  <span>安装依赖：<code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">pnpm install</code></span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="shrink-0 size-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium mt-0.5">3</span>
                  <span>启动服务：<code class="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs">pnpm dev</code>（默认端口 10006）</span>
                </li>
              </ol>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <UButton label="重试连接" icon="i-lucide-refresh-cw" size="sm" variant="soft" @click="initConnection" />
              <span v-if="retryCountdown > 0" class="text-xs text-muted">
                {{ retryCountdown }}s 后自动重试
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 检测中 -->
      <div v-else-if="landpptStatus === 'checking'" class="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
        <p class="text-sm text-muted">
          正在连接 LandPPT 服务...
        </p>
      </div>

      <!-- 已连接 - iframe 嵌入 -->
      <div v-else class="relative w-full h-full min-h-[calc(100vh-8rem)]">
        <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 z-10">
          <UIcon name="i-lucide-loader-2" class="size-6 text-primary animate-spin" />
        </div>
        <iframe
          ref="iframeRef"
          :src="iframeSrc"
          class="w-full h-full min-h-[calc(100vh-8rem)] border-0"
          allow="clipboard-write; clipboard-read"
          @load="onIframeLoad"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
