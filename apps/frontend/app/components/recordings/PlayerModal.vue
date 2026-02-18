<script setup lang="ts">
defineProps<{
  title: string
  url: string
}>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UModal v-model:open="open" :title="title">
    <template #content>
      <div class="p-4 space-y-3">
        <div class="rounded-lg overflow-hidden border border-[var(--ui-border)] bg-black">
          <video
            v-if="open && url"
            :src="url"
            controls
            autoplay
            class="w-full bg-black"
            style="max-height: 65vh;"
          >
            您的浏览器不支持视频播放
          </video>
        </div>
        <div class="flex justify-end">
          <UButton variant="ghost" label="关闭" size="sm" @click="open = false" />
        </div>
      </div>
    </template>
  </UModal>
</template>
