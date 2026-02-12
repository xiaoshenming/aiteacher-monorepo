<script setup lang="ts">
const faqs = [
  { q: '如何添加新用户？', a: '进入"用户管理"页面，点击右上角"新增用户"按钮，填写用户信息后提交即可。' },
  { q: '如何修改用户角色？', a: '在"用户管理"页面找到目标用户，点击编辑按钮，在弹窗中修改角色后保存。' },
  { q: '如何查看系统日志？', a: '进入"系统日志"页面，可以按日志级别筛选查看不同类型的日志记录。' },
  { q: '如何创建数据备份？', a: '进入"数据备份"页面，点击"创建备份"按钮即可手动创建备份。系统也会每日自动备份。' },
  { q: '如何配置安全策略？', a: '进入"安全中心"页面，可以配置密码策略、登录限制等安全相关设置。' },
  { q: '如何查看性能监控？', a: '进入"性能监控"页面，可以查看 CPU、内存、磁盘等系统资源的使用情况。' },
  { q: '忘记管理员密码怎么办？', a: '请联系超级管理员重置密码，或通过数据库直接修改密码哈希值。' },
]

const openIndex = ref<number | null>(null)

function toggle(index: number) {
  openIndex.value = openIndex.value === index ? null : index
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="帮助与支持">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-3xl mx-auto space-y-2">
        <div
          v-for="(faq, i) in faqs"
          :key="i"
          class="border border-default rounded-lg overflow-hidden"
        >
          <button
            class="w-full flex items-center justify-between p-4 text-left hover:bg-elevated transition-colors"
            @click="toggle(i)"
          >
            <span class="font-medium text-highlighted">{{ faq.q }}</span>
            <UIcon
              :name="openIndex === i ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="text-muted"
            />
          </button>
          <div v-if="openIndex === i" class="px-4 pb-4 text-sm text-muted">
            {{ faq.a }}
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
