<script setup lang="ts">
const settings = reactive({
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  maxLoginAttempts: 5,
  lockoutDuration: 30,
  sessionTimeout: 120,
  twoFactorEnabled: false,
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="安全中心">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-6">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-key-round" class="text-primary" />
              <span class="font-semibold text-highlighted">密码策略</span>
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm">最小密码长度</span>
              <UInput v-model.number="settings.minPasswordLength" type="number" class="w-24" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">要求大写字母</span>
              <UCheckbox v-model="settings.requireUppercase" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">要求数字</span>
              <UCheckbox v-model="settings.requireNumber" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">要求特殊字符</span>
              <UCheckbox v-model="settings.requireSpecialChar" />
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield" class="text-primary" />
              <span class="font-semibold text-highlighted">登录限制</span>
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm">最大登录尝试次数</span>
              <UInput v-model.number="settings.maxLoginAttempts" type="number" class="w-24" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">锁定时长（分钟）</span>
              <UInput v-model.number="settings.lockoutDuration" type="number" class="w-24" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">会话超时（分钟）</span>
              <UInput v-model.number="settings.sessionTimeout" type="number" class="w-24" />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm">启用双因素认证</span>
              <UCheckbox v-model="settings.twoFactorEnabled" />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
