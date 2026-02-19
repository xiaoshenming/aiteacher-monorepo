<script setup lang="ts">
const props = defineProps<{
  sidebarOpen: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

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
      { label: '云盘', icon: 'i-lucide-cloud', to: '/user/clouddisk' },
    ]
    case '3': return [
      { label: '用户管理', icon: 'i-lucide-users', to: '/admin/teachers' },
      { label: 'AI助手', icon: 'i-lucide-bot', to: '/admin/ai' },
    ]
    case '4': return [
      { label: '用户管理', icon: 'i-lucide-users', to: '/superadmin/users' },
      { label: '系统监控', icon: 'i-lucide-activity', to: '/superadmin/monitor' },
      { label: '系统日志', icon: 'i-lucide-scroll-text', to: '/superadmin/logs' },
    ]
    case '0': return [
      { label: '我的课程', icon: 'i-lucide-book-open', to: '/student/courses' },
      { label: '作业中心', icon: 'i-lucide-clipboard-list', to: '/student/assignments' },
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
    label: '个人设置',
    icon: 'i-lucide-user-cog',
    onSelect: () => navigateTo(`/${userStore.rolePath}/settings`),
  }, {
    label: '返回首页',
    icon: 'i-lucide-home',
    onSelect: () => navigateTo('/'),
  }],
  [{
    label: '退出登录',
    icon: 'i-lucide-log-out',
    onSelect: () => {
      userStore.logout()
      navigateTo('/login')
    },
  }],
])

// 全屏切换
const isFullscreen = ref(false)
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 滚动响应 — header 阴影
const scrolled = ref(false)
function onMainScroll() {
  if (!import.meta.client) return
  const main = headerRef.value?.parentElement?.querySelector('main')
  scrolled.value = (main?.scrollTop ?? 0) > 10
}
onMounted(() => {
  const main = headerRef.value?.parentElement?.querySelector('main')
  main?.addEventListener('scroll', onMainScroll, { passive: true })
})
</script>

<template>
  <header
    ref="headerRef"
    class="dashboard-header flex items-center gap-2 px-3 h-14 border-b border-default transition-shadow"
    :class="[
      layoutStore.headerDynamicBg ? 'header-dynamic-bg' : 'bg-elevated/80 backdrop-blur-sm',
      scrolled ? 'shadow-md' : '',
    ]"
    :style="gradientStyle"
    @mousemove="onMouseMove"
  >
    <!-- 侧边栏切换按钮 -->
    <UButton
      :icon="sidebarOpen ? 'i-lucide-panel-left-close' : 'i-lucide-panel-left-open'"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="sidebarOpen ? '收起侧边栏' : '展开侧边栏'"
      class="sidebar-toggle shrink-0"
      @click="emit('toggleSidebar')"
    />

    <!-- 分隔线 -->
    <div class="w-px h-5 bg-default/60 hidden sm:block" />

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
    <div class="hidden lg:flex items-center gap-0.5">
      <UTooltip v-for="action in quickActions" :key="action.label" :text="action.label">
        <UButton
          :icon="action.icon"
          color="neutral"
          variant="ghost"
          size="xs"
          :to="action.to"
          :aria-label="action.label"
        />
      </UTooltip>
    </div>

    <!-- 分隔线 -->
    <div class="w-px h-5 bg-default/60 hidden sm:block" />

    <!-- 全屏 -->
    <UTooltip :text="isFullscreen ? '退出全屏' : '全屏'">
      <UButton
        :icon="isFullscreen ? 'i-lucide-minimize' : 'i-lucide-maximize'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="hidden md:flex"
        :aria-label="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      />
    </UTooltip>

    <!-- 通知 -->
    <div class="relative">
      <UTooltip text="通知">
        <UButton
          icon="i-lucide-bell"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="通知"
          @click="isNotificationsSlideoverOpen = true"
        />
      </UTooltip>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-[var(--ui-bg)]"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </div>

    <!-- 暗色模式切换（独立按钮） -->
    <UTooltip :text="nextTheme === 'light' ? '切换亮色' : '切换暗色'">
      <UButton
        :icon="nextTheme === 'light' ? 'i-lucide-sun' : 'i-lucide-moon'"
        color="neutral"
        variant="ghost"
        size="sm"
        class="color-mode-btn"
        :aria-label="nextTheme === 'light' ? '切换亮色模式' : '切换暗色模式'"
        @click="startViewTransitionFromCenter"
      />
    </UTooltip>

    <!-- 设置按钮 -->
    <UTooltip text="界面设置">
      <UButton
        icon="i-lucide-settings"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="界面设置"
        class="settings-gear"
        @click="layoutStore.toggleSettingsDrawer()"
      />
    </UTooltip>

    <!-- 用户菜单 -->
    <ClientOnly>
      <UDropdownMenu :items="userMenuItems">
        <UButton
          :avatar="userStore.userInfo.avatar ? { src: userStore.userInfo.avatar, alt: userStore.userInfo.name } : undefined"
          :icon="!userStore.userInfo.avatar ? 'i-lucide-circle-user' : undefined"
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

    <!-- 搜索弹窗 -->
    <LayoutSearchModal v-model:open="isSearchOpen" />
  </header>
</template>

<style scoped>
.header-dynamic-bg {
  background: rgba(var(--ui-bg-rgb, 255 255 255), 0.72);
  backdrop-filter: blur(16px) saturate(1.8);
  position: relative;
  overflow: hidden;
}

.header-dynamic-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(var(--ui-primary-rgb, 20 184 166), 0.1),
    transparent 60%
  );
  pointer-events: none;
  transition: background 0.15s ease;
}

:deep(.dark) .header-dynamic-bg,
.dark .header-dynamic-bg {
  background: rgba(var(--ui-bg-rgb, 24 24 27), 0.72);
}

:deep(.dark) .header-dynamic-bg::before,
.dark .header-dynamic-bg::before {
  background: radial-gradient(
    350px circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
    rgba(var(--ui-primary-rgb, 20 184 166), 0.15),
    transparent 60%
  );
}

.settings-gear {
  transition: transform var(--layout-transition-duration, 0.3s) ease;
}
.settings-gear:hover {
  transform: rotate(60deg);
}

.color-mode-btn {
  transition: transform var(--layout-transition-duration, 0.3s) cubic-bezier(0.34, 1.56, 0.64, 1);
}
.color-mode-btn:hover {
  transform: rotate(15deg) scale(1.1);
}

.sidebar-toggle {
  transition: transform var(--layout-transition-duration, 0.3s) cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sidebar-toggle:active {
  transform: scale(0.9);
}
</style>
