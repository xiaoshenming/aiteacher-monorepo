<script setup lang="ts">
const layoutStore = useLayoutStore()
const userStore = useUserStore()
const { breadcrumbs } = useBreadcrumb()
const { isNotificationsSlideoverOpen } = useDashboard()
const { nextTheme, startViewTransitionFromCenter } = useColorModeTransition()

// 鼠标跟随光斑
const headerRef = ref<HTMLElement>()
const mouseX = ref(0)
const mouseY = ref(0)

function onMouseMove(e: MouseEvent) {
  if (!layoutStore.headerDynamicBg || !headerRef.value) return
  const rect = headerRef.value.getBoundingClientRect()
  mouseX.value = e.clientX - rect.left
  mouseY.value = e.clientY - rect.top
}

const gradientStyle = computed(() => {
  if (!layoutStore.headerDynamicBg) return {}
  return {
    '--mouse-x': `${mouseX.value}px`,
    '--mouse-y': `${mouseY.value}px`,
  }
})

// 搜索弹窗
const isSearchOpen = ref(false)

// Ctrl+K 快捷键
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    isSearchOpen.value = true
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

// 通知未读数
const { fetchCount } = useNotifications()
const unreadCount = ref(0)
async function loadUnreadCount() {
  try {
    const res = await fetchCount()
    unreadCount.value = res.count
  } catch {}
}
onMounted(loadUnreadCount)

// 角色快捷操作
const quickActions = computed(() => {
  const role = userStore.userInfo.role
  switch (role) {
    case '2': return [
      { label: '新建课程', icon: 'i-lucide-plus-circle', to: '/user/courses' },
      { label: 'AI问答', icon: 'i-lucide-bot', to: '/user/ai' },
    ]
    case '3': return [
      { label: '用户管理', icon: 'i-lucide-users', to: '/admin/teachers' },
    ]
    case '4': return [
      { label: '用户管理', icon: 'i-lucide-users', to: '/superadmin/users' },
      { label: '系统监控', icon: 'i-lucide-activity', to: '/superadmin/monitor' },
    ]
    case '0': return [
      { label: '我的课程', icon: 'i-lucide-book-open', to: '/student/courses' },
    ]
    default: return []
  }
})

// 用户菜单
const userMenuItems = computed(() => [
  [{
    label: userStore.userInfo.name || '用户',
    slot: 'account' as const,
    disabled: true,
  }],
  [{
    label: nextTheme.value === 'light' ? '浅色模式' : '深色模式',
    icon: nextTheme.value === 'light' ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: startViewTransitionFromCenter,
  }],
  [{
    label: '返回首页',
    icon: 'i-lucide-home',
    onSelect: () => navigateTo('/'),
  }, {
    label: '退出登录',
    icon: 'i-lucide-log-out',
    onSelect: () => {
      userStore.logout()
      navigateTo('/login')
    },
  }],
])
</script>

<template>
  <header
    ref="headerRef"
    class="dashboard-header sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-default"
    :class="[
      layoutStore.headerDynamicBg ? 'header-dynamic-bg' : 'bg-elevated/80 backdrop-blur-sm',
    ]"
    :style="gradientStyle"
    @mousemove="onMouseMove"
  >
    <!-- 面包屑 -->
    <nav class="flex items-center gap-1.5 text-sm min-w-0">
      <template v-for="(crumb, i) in breadcrumbs" :key="i">
        <UIcon v-if="i > 0" name="i-lucide-chevron-right" class="text-muted shrink-0 text-xs" />
        <NuxtLink
          v-if="crumb.to && i < breadcrumbs.length - 1"
          :to="crumb.to"
          class="flex items-center gap-1 text-muted hover:text-highlighted transition-colors"
        >
          <UIcon v-if="crumb.icon" :name="crumb.icon" class="text-sm" />
          <span class="truncate">{{ crumb.label }}</span>
        </NuxtLink>
        <span v-else class="flex items-center gap-1 text-highlighted font-medium truncate">
          <UIcon v-if="crumb.icon" :name="crumb.icon" class="text-sm" />
          <span class="truncate">{{ crumb.label }}</span>
        </span>
      </template>
    </nav>

    <div class="flex-1" />

    <!-- 搜索按钮 -->
    <UButton
      icon="i-lucide-search"
      color="neutral"
      variant="ghost"
      size="sm"
      class="hidden sm:flex"
      @click="isSearchOpen = true"
    >
      <template #trailing>
        <UKbd>⌘K</UKbd>
      </template>
    </UButton>

    <!-- 快捷操作 -->
    <div class="hidden md:flex items-center gap-1">
      <UButton
        v-for="action in quickActions"
        :key="action.label"
        :icon="action.icon"
        :label="action.label"
        color="neutral"
        variant="ghost"
        size="xs"
        :to="action.to"
      />
    </div>

    <!-- 通知 -->
    <div class="relative">
      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="通知"
        @click="isNotificationsSlideoverOpen = true"
      />
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>

    <!-- 用户菜单 -->
    <ClientOnly>
      <UDropdownMenu :items="userMenuItems">
        <UButton
          :avatar="userStore.userInfo.avatar ? { src: userStore.userInfo.avatar, alt: userStore.userInfo.name } : undefined"
          :icon="!userStore.userInfo.avatar ? 'i-lucide-user' : undefined"
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-full"
        />
        <template #account>
          <div class="text-left">
            <p class="font-medium text-highlighted truncate">{{ userStore.userInfo.name || '用户' }}</p>
            <p class="text-xs text-muted truncate">{{ userStore.userInfo.email || userStore.roleLabel }}</p>
          </div>
        </template>
      </UDropdownMenu>
    </ClientOnly>

    <!-- 设置按钮 -->
    <UButton
      icon="i-lucide-settings"
      color="neutral"
      variant="ghost"
      size="sm"
      aria-label="界面设置"
      class="settings-gear"
      @click="layoutStore.toggleSettingsDrawer()"
    />

    <!-- 搜索弹窗 -->
    <LayoutSearchModal v-model:open="isSearchOpen" />
  </header>
</template>

<style scoped>
.header-dynamic-bg {
  background: rgba(var(--ui-bg-rgb, 255 255 255), 0.75);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
}

.header-dynamic-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(var(--ui-primary-rgb, 20 184 166), 0.08),
    transparent 60%
  );
  pointer-events: none;
  transition: background var(--layout-transition-duration, 0.3s) ease;
}

.dark .header-dynamic-bg {
  background: rgba(var(--ui-bg-rgb, 24 24 27), 0.75);
}

.dark .header-dynamic-bg::before {
  background: radial-gradient(
    300px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(var(--ui-primary-rgb, 20 184 166), 0.12),
    transparent 60%
  );
}

.settings-gear {
  transition: transform var(--layout-transition-duration, 0.3s) ease;
}
.settings-gear:hover {
  transform: rotate(45deg);
}
</style>
