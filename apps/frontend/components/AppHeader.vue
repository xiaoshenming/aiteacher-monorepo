<script setup lang="ts">
const route = useRoute()
const userStore = useUserStore()

const items = computed(() => [{
  label: '首页',
  to: '/',
  active: route.path === '/',
}, {
  label: '功能',
  to: '/#features',
}, {
  label: '关于',
  to: '/#about',
}])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/" class="flex items-center gap-2">
        <img src="/favicon.svg" alt="AI教学助手" class="h-6 w-6">
        <span class="font-semibold text-sm">AI教学助手</span>
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <LayoutColorModeToggle />

      <template v-if="userStore.isLoggedIn">
        <UButton
          label="进入控制台"
          color="primary"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/dashboard"
        />
        <UButton
          icon="i-lucide-layout-dashboard"
          color="primary"
          variant="ghost"
          to="/dashboard"
          class="lg:hidden"
        />
      </template>
      <template v-else>
        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />
        <UButton
          label="登录"
          color="neutral"
          variant="outline"
          to="/login"
          class="hidden lg:inline-flex"
        />
        <UButton
          label="注册"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/login?tab=register"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
      <USeparator class="my-6" />
      <template v-if="userStore.isLoggedIn">
        <UButton
          label="进入控制台"
          color="primary"
          to="/dashboard"
          block
        />
      </template>
      <template v-else>
        <UButton
          label="登录"
          color="neutral"
          variant="subtle"
          to="/login"
          block
          class="mb-3"
        />
        <UButton
          label="注册"
          color="neutral"
          to="/login?tab=register"
          block
        />
      </template>
    </template>
  </UHeader>
</template>
