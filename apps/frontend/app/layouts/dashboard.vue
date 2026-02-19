<script setup lang="ts">
const { open, navItems, roleTitle } = useDashboardNav()
const layoutStore = useLayoutStore()

// 初始化 CSS 变量注入
useLayoutCustomization()

// 侧边栏折叠状态同步
const sidebarCollapsed = computed(() => layoutStore.sidebarCollapsed)
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="dashboard"
      v-model:open="open"
      collapsible
      resizable
      :class="[
        layoutStore.sidebarGlassEffect ? 'backdrop-blur-md bg-elevated/50' : 'bg-elevated/25',
        layoutStore.sidebarPosition === 'right' ? 'order-last' : '',
      ]"
      :style="{ width: sidebarCollapsed ? undefined : `${layoutStore.sidebarWidth}px` }"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2" :class="collapsed ? 'justify-center' : 'px-1'">
          <UIcon name="i-lucide-graduation-cap" class="text-primary text-xl shrink-0" />
          <span v-if="!collapsed" class="font-semibold text-highlighted truncate">
            {{ roleTitle }}
          </span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <ClientOnly>
          <LayoutSidebarNav :items="navItems.flat()" :collapsed="collapsed" />
        </ClientOnly>
      </template>

      <template #footer="{ collapsed }">
        <div class="flex items-center" :class="collapsed ? 'justify-center' : 'px-2 gap-2'">
          <UIcon name="i-lucide-graduation-cap" class="text-muted text-sm shrink-0" />
          <span v-if="!collapsed" class="text-xs text-dimmed truncate">AI 教师平台</span>
        </div>
      </template>
    </UDashboardSidebar>

    <div class="flex-1 flex flex-col min-w-0" :class="layoutStore.sidebarPosition === 'right' ? 'order-first' : ''">
      <!-- 顶部栏 -->
      <LayoutDashboardHeader />

      <!-- 主内容 -->
      <main class="flex-1 overflow-auto" :style="{ fontSize: `${layoutStore.fontSize}px` }">
        <slot />
      </main>
    </div>

    <ClientOnly>
      <NotificationsSlideover />
      <LayoutSettingsDrawer />
    </ClientOnly>
  </UDashboardGroup>
</template>
