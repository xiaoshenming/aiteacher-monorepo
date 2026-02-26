<script setup lang="ts">
import gsap from 'gsap'

const props = defineProps<{
  activeDays: number
  totalSessions: number
  totalMinutes: number
  formatMinutes: (n: number) => string
  actions: Array<{ label: string, icon: string, to: string }>
  loading?: boolean
}>()

const userStore = useUserStore()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 18) return '下午好'
  return '晚上好'
})

const roleIcon = computed(() => {
  switch (userStore.userInfo.role) {
    case '2': return 'i-lucide-user'
    case '3': return 'i-lucide-shield'
    case '4': return 'i-lucide-crown'
    case '0': return 'i-lucide-graduation-cap'
    default: return 'i-lucide-user'
  }
})

const today = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

const animDays = ref(0)
const animSessions = ref(0)
const animMinutes = ref(0)

watch(() => props.activeDays, (v) => {
  if (v != null) gsap.to(animDays, { value: v, duration: 1, ease: 'power2.out', roundProps: 'value' })
}, { immediate: true })
watch(() => props.totalSessions, (v) => {
  if (v != null) gsap.to(animSessions, { value: v, duration: 1, ease: 'power2.out', roundProps: 'value' })
}, { immediate: true })
watch(() => props.totalMinutes, (v) => {
  if (v != null) gsap.to(animMinutes, { value: v, duration: 1, ease: 'power2.out', roundProps: 'value' })
}, { immediate: true })
</script>

<template>
  <div
    class="relative rounded-xl border border-primary-200/60 dark:border-primary-500/15 overflow-hidden
           bg-gradient-to-br from-primary-500/[0.08] via-indigo-500/[0.04] to-violet-500/[0.02]
           dark:from-primary-500/[0.12] dark:via-indigo-500/[0.06] dark:to-transparent
           p-5 lg:p-6"
  >
    <!-- 装饰光斑 -->
    <div class="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary-400/10 dark:bg-primary-400/5 blur-3xl pointer-events-none" />
    <div class="absolute -bottom-16 -left-16 w-40 h-40 rounded-full bg-indigo-400/[0.08] dark:bg-indigo-400/5 blur-2xl pointer-events-none" />

    <template v-if="loading">
      <div class="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <USkeleton class="w-14 h-14 rounded-full shrink-0" />
        <div class="space-y-2 flex-1">
          <USkeleton class="h-4 w-20" />
          <USkeleton class="h-6 w-32" />
          <USkeleton class="h-4 w-40" />
        </div>
        <div class="flex gap-6">
          <USkeleton v-for="i in 3" :key="i" class="h-12 w-16" />
        </div>
      </div>
    </template>

    <template v-else>
      <div class="relative">
        <!-- 上半部分：用户信息 + 统计 -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
          <UAvatar
            v-if="userStore.userInfo.avatar"
            :src="userStore.userInfo.avatar"
            :alt="userStore.userInfo.name"
            size="xl"
          />
          <div
            v-else
            class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
          >
            <UIcon :name="roleIcon" class="text-2xl text-primary" />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-[var(--ui-text-muted)]">{{ greeting }}</p>
            <h2 class="text-xl font-bold text-[var(--ui-text-highlighted)] truncate">
              {{ userStore.userInfo.name || '用户' }}
            </h2>
            <div class="flex items-center gap-2 mt-1">
              <UBadge variant="subtle" size="sm">{{ userStore.roleLabel }}</UBadge>
              <span class="text-xs text-[var(--ui-text-muted)]">{{ today }}</span>
            </div>
          </div>

          <div class="flex gap-6 shrink-0">
            <div class="text-center">
              <div class="text-2xl font-extrabold text-[var(--ui-text-highlighted)] tabular-nums">{{ animDays }}</div>
              <div class="text-xs text-[var(--ui-text-muted)] mt-0.5 font-medium">活跃天数</div>
            </div>
            <div class="w-px bg-[var(--ui-border)] self-stretch my-1" />
            <div class="text-center">
              <div class="text-2xl font-extrabold text-[var(--ui-text-highlighted)] tabular-nums">{{ animSessions }}</div>
              <div class="text-xs text-[var(--ui-text-muted)] mt-0.5 font-medium">备课次数</div>
            </div>
            <div class="w-px bg-[var(--ui-border)] self-stretch my-1" />
            <div class="text-center">
              <div class="text-2xl font-extrabold text-[var(--ui-text-highlighted)] tabular-nums">{{ formatMinutes(animMinutes) }}</div>
              <div class="text-xs text-[var(--ui-text-muted)] mt-0.5 font-medium">{{ totalMinutes >= 60 ? '小时' : '分钟' }}</div>
            </div>
          </div>
        </div>

        <!-- 下半部分：快捷入口 -->
        <div class="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-5 pt-4 border-t border-[var(--ui-border)]/50">
          <NuxtLink
            v-for="action in actions"
            :key="action.to"
            :to="action.to"
            class="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg text-center
                   hover:bg-white/60 dark:hover:bg-white/5 transition-colors"
          >
            <UIcon :name="action.icon" class="text-lg text-[var(--ui-text-muted)]" />
            <span class="text-xs text-[var(--ui-text-highlighted)] font-medium">{{ action.label }}</span>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>
