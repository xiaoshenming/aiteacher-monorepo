<script setup lang="ts">
const faqs = [
  { q: '如何创建课程？', a: '进入"课程管理"页面，点击"新建课程"按钮，填写课程名称和描述后提交。' },
  { q: '如何管理班级学生？', a: '在"课程管理"中选择课程，进入课程详情后可以添加或移除班级和学生。' },
  { q: '如何使用AI助手？', a: '点击左侧菜单"AI助手"，可以进行智能对话、生成教案、出题等操作。' },
  { q: '如何上传文件到云盘？', a: '进入"云盘"页面，点击上传按钮或直接拖拽文件到上传区域。' },
  { q: '如何发布作业？', a: '进入"作业发布"页面，点击"发布作业"按钮，填写作业信息后提交。' },
  { q: '如何查看学情数据？', a: '进入"学情分析"页面，可以查看成绩分布、趋势和科目对比等数据。' },
  { q: '如何使用课堂录制？', a: '进入"课堂录制"页面，可以查看录制列表、管理录制文件和发起转录。' },
  { q: '如何导出题库？', a: '进入"题库管理"页面，点击右上角"导出"按钮，将题库导出为JSON文件。' },
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
