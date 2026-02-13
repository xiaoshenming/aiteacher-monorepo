<script setup lang="ts">
const landppt = useLandPPT()
const toast = useToast()
const loading = ref(true)
const iframeRef = ref<HTMLIFrameElement | null>(null)

// Active tab for LandPPT navigation
const activeTab = ref('home')
const tabs = [
  { label: '首页', value: 'home', icon: 'i-lucide-home', path: '/home' },
  { label: '场景选择', value: 'scenarios', icon: 'i-lucide-layout-grid', path: '/scenarios' },
  { label: '项目列表', value: 'projects', icon: 'i-lucide-folder-open', path: '/projects' },
  { label: '模板管理', value: 'templates', icon: 'i-lucide-palette', path: '/global-master-templates' },
  { label: '图床', value: 'gallery', icon: 'i-lucide-images', path: '/image-gallery' },
]

const iframeSrc = computed(() => landppt.getIframeUrl(
  tabs.find(t => t.value === activeTab.value)?.path || '/home',
))

function switchTab(tab: string) {
  activeTab.value = tab
  loading.value = true
}

function onIframeLoad() {
  loading.value = false
}

onMounted(async () => {
  try {
    await landppt.ssoLogin()
    if (!landppt.ssoReady.value) {
      toast.add({ title: 'PPT服务连接失败', description: landppt.ssoError.value || '请稍后重试', color: 'error' })
    }
  }
  catch {
    toast.add({ title: 'PPT服务不可用', description: '请确认LandPPT服务已启动', color: 'error' })
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="PPT工具">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-1">
            <button
              v-for="tab in tabs"
              :key="tab.value"
              class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              :class="activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
              @click="switchTab(tab.value)"
            >
              <UIcon :name="tab.icon" class="size-3.5" />
              <span class="hidden md:inline">{{ tab.label }}</span>
            </button>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- SSO loading state -->
      <div v-if="!landppt.ssoReady.value" class="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
        <template v-if="landppt.ssoError.value">
          <UIcon name="i-lucide-alert-circle" class="size-12 text-red-400" />
          <p class="text-sm text-muted">PPT服务连接失败</p>
          <p class="text-xs text-dimmed">{{ landppt.ssoError.value }}</p>
          <UButton label="重试" icon="i-lucide-refresh-cw" size="sm" @click="landppt.ssoLogin()" />
        </template>
        <template v-else>
          <UIcon name="i-lucide-loader-2" class="size-8 text-primary animate-spin" />
          <p class="text-sm text-muted">正在连接PPT服务...</p>
        </template>
      </div>

      <!-- LandPPT iframe -->
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
