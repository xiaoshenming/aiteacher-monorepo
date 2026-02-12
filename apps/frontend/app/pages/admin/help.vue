<script setup lang="ts">
const faqs = [
  {
    question: '如何审批教师认证申请？',
    answer: '进入「系统管理」页面，在认证审核列表中可以查看所有待审核的申请。点击「通过」或「拒绝」按钮即可完成审批。',
  },
  {
    question: '如何查看本校教师信息？',
    answer: '进入「本校教师表」页面，可以查看所有教师的基本信息。支持按姓名、用户名、邮箱、学校进行搜索。',
  },
  {
    question: '如何发送通知？',
    answer: '进入「消息通知」页面，切换到「发送通知」标签页。支持三种发送方式：单发（指定一个用户）、群发（指定多个用户）、广播（发送给所有用户）。',
  },
  {
    question: '服务健康状态显示异常怎么办？',
    answer: '首页的服务健康状态卡片会实时显示各服务的运行状态。如果某个服务显示异常，请检查对应服务是否正常运行，或联系运维人员排查。',
  },
  {
    question: '管理员有哪些权限？',
    answer: '管理员（角色等级 3）可以管理本校教师、审批认证申请、发送通知、查看系统状态和平台统计数据。超级管理员（角色等级 4）拥有更高权限。',
  },
  {
    question: '如何查看平台数据统计？',
    answer: '管理员首页展示了平台的核心统计数据，包括用户数、教师数、学生数、课程数等，以及用户分布和资源统计图表。',
  },
]
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
      <div class="p-6 max-w-3xl space-y-6">
        <div>
          <h2 class="text-lg font-semibold text-highlighted mb-1">管理员使用指南</h2>
          <p class="text-sm text-muted">以下是管理后台的常见问题与操作说明。</p>
        </div>

        <div class="space-y-3">
          <UCard v-for="(faq, i) in faqs" :key="i">
            <div>
              <div class="flex items-start gap-3">
                <div class="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <UIcon name="i-lucide-help-circle" class="text-primary" />
                </div>
                <div>
                  <p class="text-sm font-medium text-highlighted">{{ faq.question }}</p>
                  <p class="text-sm text-muted mt-1">{{ faq.answer }}</p>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <USeparator />

        <div class="text-sm text-muted">
          <p>如需更多帮助，请联系系统管理员或技术支持团队。</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
