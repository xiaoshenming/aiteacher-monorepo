<script setup lang="ts">
const { navItems, roleTitle } = useDashboardNav()
const layoutStore = useLayoutStore()

// 初始化 CSS 变量注入
useLayoutCustomization()

// 侧边栏展开/收起
const sidebarOpen = ref(!layoutStore.sidebarCollapsed)

// 同步 store 的 collapsed 状态
watch(() => layoutStore.sidebarCollapsed, (collapsed) => {
  sidebarOpen.value = !collapsed
})

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
  layoutStore.setSidebarCollapsed(!sidebarOpen.value)
}

// 移动端遮罩
const isMobile = ref(false)
function checkMobile() {
  if (import.meta.client) isMobile.value = window.innerWidth < 1024
}
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('resize', checkMobile)
})

// 移动端点击遮罩关闭
function closeMobileSidebar() {
  if (isMobile.value) {
    sidebarOpen.value = false
    layoutStore.setSidebarCollapsed(true)
  }
}

// 侧边栏实际宽度
const sidebarWidthPx = computed(() => `${layoutStore.sidebarWidth}px`)

// 是否右侧
const isRight = computed(() => layoutStore.sidebarPosition === 'right')
</script>

<template>
  <div class="dashboard-layout relative flex h-dvh overflow-hidden">
    <!-- 移动端遮罩 -->
    <Transition name="overlay">
      <div
        v-if="isMobile && sidebarOpen"
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        @click="closeMobileSidebar"
      />
    </Transition>

    <!-- 侧边栏 -->
    <aside
      class="dashboard-sidebar fixed lg:relative z-50 lg:z-auto flex flex-col h-full border-default shrink-0 overflow-hidden"
      :class="[
        layoutStore.sidebarGlassEffect
          ? 'backdrop-blur-xl bg-elevated/60 shadow-xl'
          : 'bg-elevated shadow-sm',
        isRight ? 'right-0 border-l order-last' : 'left-0 border-r',
        sidebarOpen ? 'sidebar-open' : 'sidebar-closed',
      ]"
      :style="{
        '--sidebar-w': sidebarWidthPx,
        width: sidebarOpen ? sidebarWidthPx : '0px',
        transitionDuration: layoutStore.animationsEnabled ? '0.35s' : '0s',
      }"
    >
      <div class="flex flex-col h-full" :style="{ width: sidebarWidthPx, minWidth: sidebarWidthPx }">
        <!-- Header -->
        <div class="flex items-center gap-2 px-4 h-14 border-b border-default shrink-0">
          <UIcon name="i-lucide-graduation-cap" class="text-primary text-xl shrink-0" />
          <span class="font-semibold text-highlighted truncate flex-1">{{ roleTitle }}</span>
          <UButton
            icon="i-lucide-panel-left-close"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="收起侧边栏"
            class="shrink-0 sidebar-close-btn"
            @click="toggleSidebar"
          />
        </div>

        <!-- 导航 -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin py-2">
          <ClientOnly>
            <LayoutSidebarNav :items="navItems[0] || []" :collapsed="false" />
          </ClientOnly>
        </div>

        <!-- 底部导航 -->
        <div v-if="navItems[1]?.length" class="border-t border-default py-2 shrink-0">
          <ClientOnly>
            <LayoutSidebarNav :items="navItems[1]" :collapsed="false" />
          </ClientOnly>
        </div>

        <!-- Footer -->
        <div class="flex items-center gap-2 px-4 py-3 border-t border-default shrink-0">
          <UIcon name="i-lucide-graduation-cap" class="text-muted text-sm shrink-0" />
          <span class="text-xs text-dimmed truncate">AI 教师平台 v2.0</span>
        </div>
      </div>
    </aside>

    <!-- 主区域 -->
    <div
      class="flex-1 flex flex-col min-w-0 h-full"
      :class="isRight ? 'order-first' : ''"
    >
      <!-- 顶部栏 -->
      <LayoutDashboardHeader
        :sidebar-open="sidebarOpen"
        :class="layoutStore.headerStyle === 'fixed' ? 'sticky top-0 z-30' : ''"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- 主内容 -->
      <main
        class="flex-1 overflow-y-auto overflow-x-hidden"
        :class="[
          layoutStore.scrollbarStyle === 'thin' ? 'scrollbar-thin' : '',
          layoutStore.scrollbarStyle === 'hidden' ? 'scrollbar-hidden' : '',
        ]"
        :style="{ fontSize: `${layoutStore.fontSize}px` }"
      >
        <div
          class="mx-auto w-full"
          :style="{ maxWidth: layoutStore.contentMaxWidth === 'full' ? '100%' : `var(--layout-content-max-width)` }"
        >
          <slot />
        </div>
      </main>
    </div>

    <ClientOnly>
      <NotificationsSlideover />
      <LayoutSettingsDrawer />
    </ClientOnly>
  </div>
</template>

<style scoped>
.dashboard-sidebar {
  transition-property: width, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width, transform;
}

/* 移动端：滑入滑出 */
@media (max-width: 1023px) {
  .dashboard-sidebar {
    width: var(--sidebar-w) !important;
  }
  .dashboard-sidebar.sidebar-closed {
    transform: translateX(calc(-1 * var(--sidebar-w)));
  }
  .dashboard-sidebar.sidebar-open {
    transform: translateX(0);
  }
  /* 右侧模式 */
  .dashboard-sidebar.sidebar-closed[class*="right-0"] {
    transform: translateX(var(--sidebar-w));
  }
}

/* 桌面端：宽度动画 */
@media (min-width: 1024px) {
  .dashboard-sidebar.sidebar-closed {
    width: 0 !important;
    border-width: 0;
  }
}

/* 关闭按钮旋转 */
.sidebar-close-btn {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sidebar-closed .sidebar-close-btn {
  transform: rotate(180deg);
}

/* 遮罩动画 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
