<script setup lang="ts">
const {
  subject, topicInput, count, difficulty, selectedTypes,
  rawContent, parsedQuestions, expandedIds, isGenerated, saving, isStreaming,
  toggleType, generate, stopGenerate, toggleExpand,
  addAllToBank, addOneToBank, handleExport,
} = useTopicGenerator()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="AI智能出题">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div v-if="isGenerated && parsedQuestions.length" class="flex items-center gap-1.5">
            <UButton
              icon="i-lucide-database"
              label="加入题库"
              size="sm"
              variant="soft"
              :loading="saving"
              @click="addAllToBank"
            />
            <UButton
              icon="i-lucide-download"
              label="导出JSON"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('json')"
            />
            <UButton
              icon="i-lucide-file-text"
              label="导出文本"
              size="sm"
              color="neutral"
              variant="ghost"
              @click="handleExport('text')"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="px-6 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TopicConfigPanel
            v-model:subject="subject"
            v-model:topic-input="topicInput"
            v-model:count="count"
            v-model:difficulty="difficulty"
            :selected-types="selectedTypes"
            :is-streaming="isStreaming"
            @toggle-type="toggleType"
            @generate="generate"
            @stop="stopGenerate"
          />
          <TopicResultPanel
            :is-streaming="isStreaming"
            :raw-content="rawContent"
            :parsed-questions="parsedQuestions"
            :expanded-ids="expandedIds"
            @toggle-expand="toggleExpand"
            @add-one-to-bank="addOneToBank"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
