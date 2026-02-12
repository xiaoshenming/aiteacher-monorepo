<script setup lang="ts">
const faqs = [
  { q: '如何查看我的课程？', a: '点击左侧菜单"我的课程"，即可查看已加入的所有课程。' },
  { q: '如何提交作业？', a: '进入"作业中心"，找到对应作业，点击提交按钮上传作业文件。' },
  { q: '如何查看成绩？', a: '在"作业中心"可以查看已批改作业的成绩，在"学情数据"可以查看成绩趋势。' },
  { q: '如何联系老师？', a: '可以通过课程详情页面查看教师信息，或使用平台消息功能联系老师。' },
  { q: '忘记密码怎么办？', a: '在登录页面点击"忘记密码"，通过注册邮箱重置密码。' },
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
