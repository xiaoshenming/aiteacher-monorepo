<script setup lang="ts">
const {
  orientation,
  fontSize,
  orientationOptions,
  fontSizeOptions,
  fontSizeMap,
  templates,
  activeTemplate,
  printContent,
  selectTemplate,
  aiPrompt,
  aiLoading,
  handleAiGenerate,
  handlePrint,
  sanitize,
} = useHiprint()
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
                v-html="sanitize(printContent)"
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
