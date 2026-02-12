<script setup lang="ts">
const { apiFetch } = useApi()
const toast = useToast()

// 页面设置
const orientation = ref<'portrait' | 'landscape'>('portrait')
const fontSize = ref<'small' | 'medium' | 'large'>('medium')

const orientationOptions = [
  { label: '纵向', value: 'portrait', icon: 'i-lucide-file' },
  { label: '横向', value: 'landscape', icon: 'i-lucide-file-text' },
]
const fontSizeOptions = [
  { label: '小', value: 'small' },
  { label: '中', value: 'medium' },
  { label: '大', value: 'large' },
]
const fontSizeMap = { small: '12px', medium: '14px', large: '16px' }

// 模板
const templates: Record<string, { label: string, icon: string, content: string }> = {
  quiz: {
    label: '课堂测验',
    icon: 'i-lucide-file-question',
    content: `<h1 style="text-align:center; margin-bottom:20px;">课堂测验</h1>
<p><strong>科目：</strong>高等数学 &nbsp;&nbsp; <strong>班级：</strong>_______ &nbsp;&nbsp; <strong>姓名：</strong>_______ &nbsp;&nbsp; <strong>日期：</strong>${new Date().toLocaleDateString()}</p>
<hr/>
<p><strong>一、选择题（每题5分，共20分）</strong></p>
<p>1. 函数 f(x) = x² 的导数为：</p>
<p>&nbsp;&nbsp;A. x &nbsp;&nbsp; B. 2x &nbsp;&nbsp; C. x² &nbsp;&nbsp; D. 2x²</p>
<p>2. ∫x dx = </p>
<p>&nbsp;&nbsp;A. x &nbsp;&nbsp; B. x²/2 + C &nbsp;&nbsp; C. x² &nbsp;&nbsp; D. 2x</p>
<p><strong>二、填空题（每题5分，共10分）</strong></p>
<p>1. lim(x→0) sin(x)/x = ______</p>
<p>2. e^0 = ______</p>`,
  },
  midterm: {
    label: '期中考试',
    icon: 'i-lucide-graduation-cap',
    content: `<h1 style="text-align:center; margin-bottom:10px;">期中考试试卷</h1>
<p style="text-align:center; margin-bottom:20px;">（考试时间：120分钟 &nbsp; 满分：100分）</p>
<p><strong>科目：</strong>_______ &nbsp;&nbsp; <strong>班级：</strong>_______ &nbsp;&nbsp; <strong>姓名：</strong>_______ &nbsp;&nbsp; <strong>学号：</strong>_______</p>
<hr/>
<table style="width:100%; border-collapse:collapse; margin:15px 0;" border="1">
<tr style="background:#f5f5f5;"><th>题号</th><th>一</th><th>二</th><th>三</th><th>四</th><th>总分</th></tr>
<tr><th>得分</th><td></td><td></td><td></td><td></td><td></td></tr>
</table>
<p><strong>一、选择题（每题3分，共30分）</strong></p>
<p>1. _______________________________________________</p>
<p>&nbsp;&nbsp;A. &nbsp;&nbsp; B. &nbsp;&nbsp; C. &nbsp;&nbsp; D. </p>
<p><strong>二、填空题（每题4分，共20分）</strong></p>
<p>1. ______________________________</p>
<p><strong>三、简答题（每题10分，共30分）</strong></p>
<p>1. </p>
<p><strong>四、计算题（每题10分，共20分）</strong></p>
<p>1. </p>`,
  },
  exercise: {
    label: '课堂练习',
    icon: 'i-lucide-pencil',
    content: `<h1 style="text-align:center; margin-bottom:20px;">课堂练习</h1>
<p><strong>科目：</strong>_______ &nbsp;&nbsp; <strong>班级：</strong>_______ &nbsp;&nbsp; <strong>日期：</strong>${new Date().toLocaleDateString()}</p>
<hr/>
<p><strong>练习要求：</strong>请在规定时间内完成以下练习，可以参考课本。</p>
<br/>
<p><strong>1.</strong> </p>
<br/><br/>
<p><strong>2.</strong> </p>
<br/><br/>
<p><strong>3.</strong> </p>
<br/><br/>
<p><strong>4.</strong> </p>
<br/><br/>
<p><strong>5.</strong> </p>`,
  },
  notice: {
    label: '通知公告',
    icon: 'i-lucide-megaphone',
    content: `<h1 style="text-align:center; margin-bottom:20px;">通 知</h1>
<p>各位同学：</p>
<br/>
<p>&nbsp;&nbsp;&nbsp;&nbsp;兹通知如下事项：</p>
<br/>
<p>&nbsp;&nbsp;&nbsp;&nbsp;一、_______________________________________________</p>
<br/>
<p>&nbsp;&nbsp;&nbsp;&nbsp;二、_______________________________________________</p>
<br/>
<p>&nbsp;&nbsp;&nbsp;&nbsp;请各位同学相互转告，按时参加。</p>
<br/><br/>
<p style="text-align:right;">教务处</p>
<p style="text-align:right;">${new Date().toLocaleDateString()}</p>`,
  },
  report: {
    label: '成绩单',
    icon: 'i-lucide-bar-chart',
    content: `<h1 style="text-align:center; margin-bottom:20px;">学生成绩单</h1>
<p><strong>班级：</strong>_______ &nbsp;&nbsp; <strong>学期：</strong>2025-2026 第二学期</p>
<hr/>
<table style="width:100%; border-collapse:collapse; margin:15px 0; text-align:center;" border="1">
<tr style="background:#f5f5f5;">
  <th style="padding:8px;">姓名</th><th>语文</th><th>数学</th><th>英语</th><th>物理</th><th>化学</th><th>总分</th><th>排名</th>
</tr>
<tr><td style="padding:8px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td style="padding:8px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td style="padding:8px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td style="padding:8px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
<tr><td style="padding:8px;"></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
</table>
<p><strong>班主任签字：</strong>_____________ &nbsp;&nbsp; <strong>日期：</strong>_____________</p>`,
  },
}

const activeTemplate = ref('quiz')
const printContent = ref(templates.quiz.content)

function selectTemplate(key: string) {
  activeTemplate.value = key
  printContent.value = templates[key].content
}

// AI 生成
const aiPrompt = ref('')
const aiLoading = ref(false)

async function handleAiGenerate() {
  if (!aiPrompt.value.trim()) {
    toast.add({ title: '请输入内容描述', color: 'warning' })
    return
  }
  aiLoading.value = true
  try {
    const res = await apiFetch<{ data: { content: string } }>('/ai/generate-print', {
      method: 'POST',
      body: { prompt: aiPrompt.value, template_type: activeTemplate.value },
    })
    printContent.value = res.data.content
    toast.add({ title: 'AI 生成完成', color: 'success' })
  }
  catch {
    toast.add({ title: 'AI 生成失败，请稍后重试', color: 'error' })
  }
  finally {
    aiLoading.value = false
  }
}

// 打印 — 动态注入 @page 方向
function handlePrint() {
  const style = document.createElement('style')
  style.id = 'print-orientation'
  style.textContent = `@page { size: ${orientation.value === 'landscape' ? 'A4 landscape' : 'A4 portrait'}; }`
  document.head.appendChild(style)
  window.print()
  style.remove()
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="打印设计器">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <!-- 页面设置 -->
            <USelectMenu
              v-model="orientation"
              :items="orientationOptions"
              value-key="value"
              class="w-28"
            />
            <USelectMenu
              v-model="fontSize"
              :items="fontSizeOptions"
              value-key="value"
              class="w-20"
            >
              <template #leading>
                <UIcon name="i-lucide-type" class="size-4" />
              </template>
            </USelectMenu>
            <ClientOnly>
              <UButton icon="i-lucide-printer" label="打印" @click="handlePrint" />
            </ClientOnly>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 space-y-4">
        <!-- 模板选择 -->
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="(tpl, key) in templates"
            :key="key"
            :icon="tpl.icon"
            :label="tpl.label"
            :variant="activeTemplate === key ? 'solid' : 'outline'"
            size="sm"
            @click="selectTemplate(key as string)"
          />
        </div>

        <!-- AI 生成 -->
        <div class="flex gap-2 items-start">
          <UTextarea
            v-model="aiPrompt"
            placeholder="描述你想生成的内容，如：生成一份高等数学第三章的测验题，包含5道选择题和3道填空题"
            :rows="2"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-sparkles"
            label="AI 生成"
            color="primary"
            :loading="aiLoading"
            class="shrink-0 mt-0.5"
            @click="handleAiGenerate"
          />
        </div>

        <!-- 编辑器 + 预览 -->
        <ClientOnly>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label class="text-sm font-medium text-highlighted mb-2 block">编辑内容（HTML）</label>
              <UTextarea v-model="printContent" :rows="20" class="font-mono text-sm" />
            </div>
            <div>
              <label class="text-sm font-medium text-highlighted mb-2 block">预览</label>
              <div
                class="border border-default rounded-lg p-6 bg-white text-black min-h-[400px] print-area"
                :style="{ fontSize: fontSizeMap[fontSize] }"
                v-html="printContent"
              />
            </div>
          </div>
        </ClientOnly>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style>
@media print {
  body * {
    visibility: hidden;
  }
  .print-area,
  .print-area * {
    visibility: visible;
  }
  .print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    border: none !important;
  }
}

</style>
