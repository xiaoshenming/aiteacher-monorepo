<script setup lang="ts">
const { apiFetch } = useApi()

interface OverviewData {
  totalUsers: number
  todayRegistered: number
  activeSessions: number
  pendingAuth: number
  uptimeDays: number
}

interface LoginActivity {
  username: string
  email: string
  role: string
  loginTime: string
  status: string
}

interface RateLimitRule {
  windowMs: number
  max: number
  description: string
}

const overview = ref<OverviewData | null>(null)
const rateLimits = ref<Record<string, RateLimitRule>>({})
const activities = ref<LoginActivity[]>([])
const activityTotal = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)

async function fetchOverview() {
  try {
    const res = await apiFetch<{ code: number, data: OverviewData }>('admin/security/overview')
    overview.value = res.data
  } catch {}
}

async function fetchRateLimits() {
  try {
    const res = await apiFetch<{ code: number, data: Record<string, RateLimitRule> }>('admin/security/rate-limits')
    rateLimits.value = res.data
  } catch {}
}

async function fetchLoginActivity() {
  try {
    const res = await apiFetch<{ code: number, data: { total: number, activities: LoginActivity[] } }>(
      `admin/security/login-activity?page=${page.value}&pageSize=${pageSize}`
    )
    activities.value = res.data.activities
    activityTotal.value = res.data.total
  } catch {}
}

async function refreshAll() {
  loading.value = true
  await Promise.all([fetchOverview(), fetchRateLimits(), fetchLoginActivity()])
  loading.value = false
}

function changePage(p: number) {
  page.value = p
  fetchLoginActivity()
}

function formatTime(time: string) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const overviewCards = computed(() => {
  if (!overview.value) return []
  return [
    { label: '总用户数', value: overview.value.totalUsers, icon: 'i-lucide-users' },
    { label: '今日注册', value: overview.value.todayRegistered, icon: 'i-lucide-user-plus' },
    { label: '活跃会话', value: overview.value.activeSessions, icon: 'i-lucide-activity' },
    { label: '待审核认证', value: overview.value.pendingAuth, icon: 'i-lucide-clock' },
    { label: '系统运行天数', value: overview.value.uptimeDays, icon: 'i-lucide-server' },
  ]
})

const rateLimitLabels: Record<string, string> = {
  global: '全局请求',
  auth: '登录/注册',
  ai: 'AI 接口',
  captcha: '验证码',
}

const totalPages = computed(() => Math.ceil(activityTotal.value / pageSize))

onMounted(() => refreshAll())
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="安全中心">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #trailing>
          <UButton icon="i-lucide-refresh-cw" variant="ghost" :loading="loading" @click="refreshAll" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <!-- 安全概览 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <UCard v-for="card in overviewCards" :key="card.label">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-primary/10">
                <UIcon :name="card.icon" class="text-xl text-primary" />
              </div>
              <div>
                <p class="text-xs text-muted">{{ card.label }}</p>
                <p class="text-lg font-semibold text-highlighted">{{ card.value ?? '-' }}</p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- 限流配置 -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="text-primary" />
              <span class="font-semibold text-highlighted">限流配置</span>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="(rule, key) in rateLimits"
              :key="key"
              class="p-4 rounded-lg border border-default"
            >
              <p class="text-sm font-medium text-highlighted">{{ rateLimitLabels[key as string] || key }}</p>
              <p class="text-xs text-muted mt-1">{{ rule.description }}</p>
              <div class="mt-2 flex items-center gap-2">
                <UBadge color="primary" variant="subtle" size="xs">
                  {{ rule.max }} 次 / {{ Math.round(rule.windowMs / 60000) }} 分钟
                </UBadge>
              </div>
            </div>
          </div>
        </UCard>

        <!-- 最近登录活动 -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-log-in" class="text-primary" />
                <span class="font-semibold text-highlighted">最近登录活动</span>
              </div>
              <span class="text-xs text-muted">共 {{ activityTotal }} 条记录</span>
            </div>
          </template>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-default">
                  <th class="text-left py-2 px-3 text-muted font-medium">用户名</th>
                  <th class="text-left py-2 px-3 text-muted font-medium">邮箱</th>
                  <th class="text-left py-2 px-3 text-muted font-medium">角色</th>
                  <th class="text-left py-2 px-3 text-muted font-medium">登录时间</th>
                  <th class="text-left py-2 px-3 text-muted font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in activities" :key="idx" class="border-b border-default last:border-0">
                  <td class="py-2 px-3 text-highlighted">{{ item.username }}</td>
                  <td class="py-2 px-3 text-muted">{{ item.email || '-' }}</td>
                  <td class="py-2 px-3">
                    <UBadge variant="subtle" size="xs">{{ item.role }}</UBadge>
                  </td>
                  <td class="py-2 px-3 text-muted">{{ formatTime(item.loginTime) }}</td>
                  <td class="py-2 px-3">
                    <UBadge color="success" variant="subtle" size="xs">{{ item.status === 'success' ? '成功' : item.status }}</UBadge>
                  </td>
                </tr>
                <tr v-if="activities.length === 0">
                  <td colspan="5" class="py-8 text-center text-muted">暂无登录记录</td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- 分页 -->
          <div v-if="totalPages > 1" class="flex justify-center items-center gap-2 pt-4">
            <UButton
              size="xs"
              variant="ghost"
              :disabled="page <= 1"
              @click="changePage(page - 1)"
            >
              上一页
            </UButton>
            <span class="text-xs text-muted">{{ page }} / {{ totalPages }}</span>
            <UButton
              size="xs"
              variant="ghost"
              :disabled="page >= totalPages"
              @click="changePage(page + 1)"
            >
              下一页
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
