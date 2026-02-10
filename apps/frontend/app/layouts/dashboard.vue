<script setup lang="ts">
const { open, navItems, roleTitle } = useDashboardNav()
const { isNotificationsSlideoverOpen } = useDashboard()
const userStore = useUserStore()
const { colorMode, nextTheme, startViewTransitionFromCenter } = useColorModeTransition()

const userMenuItems = computed(() => [
  [{
    label: userStore.userInfo.name || '用户',
    slot: 'account' as const,
    disabled: true,
  }],
  [{
    label: '通知',
    icon: 'i-lucide-bell',
    onSelect: () => {
      isNotificationsSlideoverOpen.value = true
    },
  }, {
    label: nextTheme.value === 'light' ? '浅色模式' : '深色模式',
    icon: nextTheme.value === 'light' ? 'i-lucide-sun' : 'i-lucide-moon',
    onSelect: startViewTransitionFromCenter,
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
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="dashboard"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
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
          <UNavigationMenu
            :collapsed="collapsed"
            :items="navItems[0]"
            orientation="vertical"
            tooltip
          />

          <UNavigationMenu
            v-if="navItems[1]?.length"
            :collapsed="collapsed"
            :items="navItems[1]"
            orientation="vertical"
            tooltip
            class="mt-auto"
          />
        </ClientOnly>
      </template>

      <template #footer="{ collapsed }">
        <ClientOnly>
          <UDropdownMenu :items="userMenuItems">
            <UButton
              :avatar="userStore.userInfo.avatar ? { src: userStore.userInfo.avatar, alt: userStore.userInfo.name } : undefined"
              :icon="!userStore.userInfo.avatar ? 'i-lucide-user' : undefined"
              :label="collapsed ? undefined : userStore.userInfo.name || '用户'"
              :class="collapsed ? 'justify-center' : ''"
              color="neutral"
              variant="ghost"
              block
              :ui="{ trailingIcon: 'ms-auto' }"
              :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
            />

            <template #account>
              <div class="text-left">
                <p class="font-medium text-highlighted truncate">
                  {{ userStore.userInfo.name || '用户' }}
                </p>
                <p class="text-xs text-muted truncate">
                  {{ userStore.userInfo.email || userStore.roleLabel }}
                </p>
              </div>
            </template>
          </UDropdownMenu>
        </ClientOnly>
      </template>
    </UDashboardSidebar>

    <slot />

    <ClientOnly>
      <NotificationsSlideover />
    </ClientOnly>
  </UDashboardGroup>
</template>
