<template>
  <div
    class="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50
           hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md
           hover:-translate-y-0.5 transition-all duration-200 p-4"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-2">
          <UBadge :color="typeColor" variant="subtle" size="xs">
            {{ typeLabel }}
          </UBadge>
          <UBadge v-if="resource.permission" variant="subtle" size="xs" color="neutral">
            {{ resource.permission === 'copy' ? '可复制' : '仅查看' }}
          </UBadge>
        </div>
        <h3 class="text-sm font-medium text-highlighted truncate">
          {{ resource.resource_name || resource.title || '未命名资源' }}
        </h3>
        <div class="flex items-center gap-3 mt-2 text-xs text-muted">
          <span v-if="resource.sharer_name" class="flex items-center gap-1">
            <UIcon name="i-lucide-user" class="w-3 h-3" />
            {{ resource.sharer_name }}
          </span>
          <span v-if="resource.share_scope" class="flex items-center gap-1">
            <UIcon :name="scopeIcon" class="w-3 h-3" />
            {{ scopeLabel }}
          </span>
          <span v-if="resource.created_at" class="flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-3 h-3" />
            {{ formatTime(resource.created_at) }}
          </span>
        </div>
      </div>
      <div v-if="showActions" class="flex items-center gap-1 shrink-0">
        <ShareFavoriteButton
          :resource-type="resource.resource_type"
          :resource-id="resource.resource_id"
          :favorited="resource._favorited || false"
          @toggle="$emit('toggleFavorite', resource)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  resource: any
  showActions?: boolean
}>(), { showActions: true })

defineEmits<{
  toggleFavorite: [resource: any]
}>()

const typeMap: Record<string, { label: string, color: string }> = {
  lesson_plan: { label: '教案', color: 'primary' },
  question: { label: '题目', color: 'info' },
  assignment: { label: '作业', color: 'warning' },
  resource: { label: '资源', color: 'success' },
}

const typeLabel = computed(() => typeMap[props.resource.resource_type]?.label || '其他')
const typeColor = computed(() => (typeMap[props.resource.resource_type]?.color || 'neutral') as any)

const scopeMap: Record<string, { label: string, icon: string }> = {
  public: { label: '公开', icon: 'i-lucide-globe' },
  school: { label: '校内', icon: 'i-lucide-school' },
  specific: { label: '指定用户', icon: 'i-lucide-user-check' },
}

const scopeLabel = computed(() => scopeMap[props.resource.share_scope]?.label || '')
const scopeIcon = computed(() => scopeMap[props.resource.share_scope]?.icon || 'i-lucide-share-2')

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>
