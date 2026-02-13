<script setup lang="ts">
const toast = useToast()
const config = useRuntimeConfig()
const loading = ref(true)
const saving = ref(false)

// LandPPT connection status
const landpptStatus = ref<'connected' | 'disconnected' | 'checking'>('checking')

// AI Provider config
interface ProviderConfig {
  name: string
  label: string
  apiKey: string
  baseUrl: string
  model: string
  available: boolean
}

const providers = ref<ProviderConfig[]>([])
const defaultProvider = ref('')
const availableProviders = ref<string[]>([])

// General settings
const generalSettings = ref({
  max_tokens: 16384,
  temperature: 0.7,
  enable_parallel_generation: false,
  parallel_slides_count: 3,
  enable_streaming: true,
})

async function checkLandPPTStatus() {
  landpptStatus.value = 'checking'
  try {
    const landpptBase = config.public.landpptBase as string
    await $fetch(`${landpptBase}/api/auth/check`, { timeout: 5000 })
    landpptStatus.value = 'connected'
  }
  catch {
    landpptStatus.value = 'disconnected'
  }
}

async function loadConfig() {
  loading.value = true
  try {
    const landpptBase = config.public.landpptBase as string

    // First do SSO login as admin
    const landppt = useLandPPT()
    await landppt.ssoLogin()

    // Fetch current config from LandPPT
    const configRes = await $fetch<any>(`${landpptBase}/api/config/ai`, {
      credentials: 'include',
      headers: landppt.sessionId.value
        ? { Cookie: `session_id=${landppt.sessionId.value}` }
        : {},
    })

    if (configRes.success !== false) {
      const data = configRes.data || configRes

      // Map providers
      if (data.providers) {
        providers.value = Object.entries(data.providers).map(([name, cfg]: [string, any]) => ({
          name,
          label: getProviderLabel(name),
          apiKey: cfg.api_key ? '••••••••' : '',
          baseUrl: cfg.base_url || '',
          model: cfg.model || '',
          available: cfg.available ?? false,
        }))
      }

      defaultProvider.value = data.default_provider || 'openai'
      availableProviders.value = data.available_providers || []

      if (data.settings) {
        generalSettings.value = { ...generalSettings.value, ...data.settings }
      }
    }
  }
  catch (err) {
    console.error('Failed to load LandPPT config:', err)
    toast.add({ title: '加载配置失败', description: '请确认LandPPT服务已启动', color: 'error' })
  }
  finally {
    loading.value = false
  }
}

function getProviderLabel(name: string): string {
  const labels: Record<string, string> = {
    openai: 'OpenAI',
    deepseek: 'DeepSeek',
    kimi: 'Kimi (Moonshot)',
    minimax: 'MiniMax',
    anthropic: 'Anthropic',
    google: 'Google Gemini',
    ollama: 'Ollama (本地)',
    '302ai': '302.AI',
  }
  return labels[name] || name
}

async function saveConfig() {
  saving.value = true
  try {
    const landpptBase = config.public.landpptBase as string
    const landppt = useLandPPT()

    // Build update payload - only send non-masked API keys
    const providerUpdates: Record<string, any> = {}
    for (const p of providers.value) {
      const update: Record<string, string> = {}
      if (p.apiKey && !p.apiKey.includes('••••')) {
        update.api_key = p.apiKey
      }
      if (p.baseUrl) update.base_url = p.baseUrl
      if (p.model) update.model = p.model
      if (Object.keys(update).length > 0) {
        providerUpdates[p.name] = update
      }
    }

    await $fetch(`${landpptBase}/api/config/ai`, {
      method: 'POST',
      credentials: 'include',
      headers: landppt.sessionId.value
        ? { Cookie: `session_id=${landppt.sessionId.value}` }
        : {},
      body: {
        default_provider: defaultProvider.value,
        providers: providerUpdates,
        settings: generalSettings.value,
      },
    })

    toast.add({ title: '配置已保存', color: 'success' })
  }
  catch (err) {
    toast.add({ title: '保存失败', description: (err as Error).message, color: 'error' })
  }
  finally {
    saving.value = false
  }
}

onMounted(async () => {
  await checkLandPPTStatus()
  if (landpptStatus.value === 'connected') {
    await loadConfig()
  }
  else {
    loading.value = false
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="PPT 服务配置">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <span
              class="flex items-center gap-1.5 text-xs"
              :class="landpptStatus === 'connected' ? 'text-green-500' : landpptStatus === 'disconnected' ? 'text-red-400' : 'text-zinc-400'"
            >
              <span class="size-2 rounded-full" :class="landpptStatus === 'connected' ? 'bg-green-500' : landpptStatus === 'disconnected' ? 'bg-red-400' : 'bg-zinc-400 animate-pulse'" />
              {{ landpptStatus === 'connected' ? 'LandPPT 已连接' : landpptStatus === 'disconnected' ? 'LandPPT 未连接' : '检测中...' }}
            </span>
            <UButton
              label="保存配置"
              icon="i-lucide-save"
              size="sm"
              :loading="saving"
              :disabled="landpptStatus !== 'connected'"
              @click="saveConfig"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6 max-w-4xl">
        <!-- Disconnected warning -->
        <div
          v-if="landpptStatus === 'disconnected'"
          class="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10"
        >
          <div class="flex items-center gap-2 mb-2">
            <UIcon name="i-lucide-alert-triangle" class="size-5 text-amber-500" />
            <span class="font-medium text-amber-700 dark:text-amber-400">LandPPT 服务未连接</span>
          </div>
          <p class="text-sm text-amber-600 dark:text-amber-500">
            请确认 LandPPT 服务已在端口 10006 启动。启动后点击重试。
          </p>
          <UButton label="重试连接" icon="i-lucide-refresh-cw" size="sm" class="mt-3" variant="outline" @click="checkLandPPTStatus" />
        </div>

        <template v-if="landpptStatus === 'connected'">
          <!-- Default provider -->
          <UCard>
            <template #header>
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-settings" class="size-5 text-primary" />
                <span class="font-semibold">默认 AI 提供商</span>
              </div>
            </template>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-highlighted mb-1.5">默认提供商</label>
                <select
                  v-model="defaultProvider"
                  class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                >
                  <option v-for="p in providers" :key="p.name" :value="p.name">
                    {{ p.label }}
                  </option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">Max Tokens</label>
                  <UInput v-model.number="generalSettings.max_tokens" type="number" size="sm" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-highlighted mb-1.5">Temperature</label>
                  <UInput v-model.number="generalSettings.temperature" type="number" step="0.1" min="0" max="2" size="sm" />
                </div>
              </div>
            </div>
          </UCard>

          <!-- Provider configs -->
          <UCard v-for="provider in providers" :key="provider.name">
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-bot" class="size-5 text-primary" />
                  <span class="font-semibold">{{ provider.label }}</span>
                </div>
                <span
                  class="text-xs px-2 py-0.5 rounded-full"
                  :class="provider.available ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'"
                >
                  {{ provider.available ? '已配置' : '未配置' }}
                </span>
              </div>
            </template>
            <div class="space-y-3">
              <div v-if="provider.name !== 'ollama'">
                <label class="block text-xs font-medium text-muted mb-1">API Key</label>
                <UInput
                  v-model="provider.apiKey"
                  type="password"
                  size="sm"
                  placeholder="输入 API Key"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted mb-1">Base URL</label>
                <UInput v-model="provider.baseUrl" size="sm" placeholder="API Base URL" />
              </div>
              <div>
                <label class="block text-xs font-medium text-muted mb-1">模型</label>
                <UInput v-model="provider.model" size="sm" placeholder="模型名称" />
              </div>
            </div>
          </UCard>
        </template>
      </div>
    </template>
  </UDashboardPanel>
</template>
