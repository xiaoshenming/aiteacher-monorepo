<script setup lang="ts">
import { ref } from 'vue'

const needRefresh = ref(false)
let updateSW: (() => Promise<void>) | undefined

if (import.meta.client) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    updateSW = registerSW({
      onNeedRefresh() { needRefresh.value = true },
    })
  })
}

function update() { updateSW?.() }
function close() { needRefresh.value = false }
</script>

<template>
  <div v-if="needRefresh" class="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800">
    <span class="text-sm">发现新版本</span>
    <UButton size="xs" @click="update">更新</UButton>
    <UButton size="xs" variant="ghost" @click="close">关闭</UButton>
  </div>
</template>
