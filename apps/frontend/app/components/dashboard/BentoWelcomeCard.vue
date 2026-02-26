<script setup lang="ts">
import gsap from 'gsap'

const props = defineProps<{
  prepareDays?: number
  totalSessions?: number
  loading?: boolean
}>()

const userStore = useUserStore()

const roleIcon = computed(() => {
  switch (userStore.userInfo.role) {
    case '2': return 'i-lucide-user'
    case '3': return 'i-lucide-shield'
    case '4': return 'i-lucide-crown'
    case '0': return 'i-lucide-graduation-cap'
    default: return 'i-lucide-user'
  }
})

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return '早上好'
  if (hour >= 12 && hour < 18) return '下午好'
  return '晚上好'
})

const animatedDays = ref(0)
const animatedSessions = ref(0)

watch(() => props.prepareDays, (val) => {
  if (val != null) {
    gsap.to(animatedDays, { value: val, duration: 1, ease: 'power2.out', roundProps: 'value' })
  }
}, { immediate: true })

watch(() => props.totalSessions, (val) => {
  if (val != null) {
    gsap.to(animatedSessions, { value: val, duration: 1, ease: 'power2.out', roundProps: 'value' })
  }
}, { immediate: true })
</script>

<template>
  <div class="rounded-xl border border-[var(--ui-border)] bg-gradient-to-br from-primary-500/10 via-indigo-500/5 to-transparent p-5">
    <template v-if="loading">
      <div class="flex items-center gap-4">
        <USkeleton class="w-12 h-12 rounded-full" />
        <div class="space-y-2 flex-1">
          <USkeleton class="h-5 w-40" />
          <USkeleton class="h-4 w-16" />
        </div>
        <div class="flex gap-4">
          <USkeleton class="h-10 w-16" />
          <USkeleton class="h-10 w-16" />
        </div>
      </div>
    </template>
    <template v-else>
      <div class="flex items-center gap-4">
        <UAvatar
          v-if="userStore.userInfo.avatar"
          :src="userStore.userInfo.avatar"
          :alt="userStore.userInfo.name"
          size="lg"
        />
        <div
          v-else
          class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0"
        >
          <UIcon :name="roleIcon" class="text-xl text-primary" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-semibold text-highlighted truncate">
            {{ greeting }}，{{ userStore.userInfo.name || '用户' }}
          </h2>
          <UBadge variant="subtle" size="sm" class="mt-0.5">
            {{ userStore.roleLabel }}
          </UBadge>
        </div>
        <div class="flex gap-5 shrink-0">
          <div class="text-center">
            <div class="text-xl font-bold text-highlighted">
              {{ animatedDays }}
            </div>
            <div class="text-xs text-muted">
              备课天数
            </div>
          </div>
          <div class="text-center">
            <div class="text-xl font-bold text-highlighted">
              {{ animatedSessions }}
            </div>
            <div class="text-xs text-muted">
              备课次数
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
