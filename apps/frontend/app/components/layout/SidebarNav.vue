<script setup lang="ts">
import type { DashboardNavItem } from '~/types/dashboard'

const props = defineProps<{
  items: DashboardNavItem[]
  collapsed?: boolean
}>()

const layoutStore = useLayoutStore()
const route = useRoute()

// 拖拽排序状态
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// 排序后的菜单项
const sortedItems = computed(() => {
  let items = props.items.filter(
    item => !layoutStore.hiddenNavItems.includes(item.label)
  )
  if (layoutStore.navOrder.length > 0) {
    const orderMap = new Map(layoutStore.navOrder.map((label, i) => [label, i]))
    items = [...items].sort((a, b) => {
      const ai = orderMap.get(a.label) ?? 999
      const bi = orderMap.get(b.label) ?? 999
      return ai - bi
    })
  }
  return items
})

// 当前 hover 的菜单项索引（用于 proximity effect）
const hoveredIndex = ref<number | null>(null)

function getProximityScale(index: number): number {
  if (hoveredIndex.value === null || !layoutStore.animationsEnabled) return 1
  const distance = Math.abs(index - hoveredIndex.value)
  if (distance === 0) return 1.02
  if (distance === 1) return 1.008
  return 1
}

function isActive(item: DashboardNavItem): boolean {
  if (!item.to) return false
  if (item.exact) return route.path === item.to
  return route.path.startsWith(item.to)
}

// 拖拽处理
function onDragStart(index: number) {
  dragIndex.value = index
}
function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}
function onDragEnd() {
  if (dragIndex.value !== null && dragOverIndex.value !== null && dragIndex.value !== dragOverIndex.value) {
    const items = [...sortedItems.value]
    const [moved] = items.splice(dragIndex.value, 1)
    items.splice(dragOverIndex.value, 0, moved)
    layoutStore.setNavOrder(items.map(i => i.label))
  }
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <nav class="sidebar-nav flex flex-col gap-[var(--layout-density-gap,0.5rem)] px-2 py-1" aria-label="仪表盘导航">
    <template v-for="(item, index) in sortedItems" :key="item.label">
      <NuxtLink
        v-if="item.to"
        :to="item.to"
        :draggable="!collapsed"
        class="sidebar-nav-item group relative flex items-center gap-2.5 rounded-[var(--layout-border-radius,0.5rem)] text-sm transition-all"
        :class="[
          collapsed ? 'justify-center p-2' : 'px-3 py-[var(--layout-density-padding,0.5rem)]',
          isActive(item)
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted hover:text-highlighted',
          dragOverIndex === index ? 'ring-2 ring-primary/30' : '',
        ]"
        :style="{
          transform: `scale(${getProximityScale(index)})`,
          transitionDuration: 'var(--layout-transition-duration, 0.3s)',
        }"
        :aria-current="isActive(item) ? 'page' : undefined"
        @mouseenter="hoveredIndex = index"
        @mouseleave="hoveredIndex = null"
        @dragstart="onDragStart(index)"
        @dragover="onDragOver($event, index)"
        @dragend="onDragEnd"
      >
        <!-- Hover 光晕背景 -->
        <span
          class="absolute inset-0 rounded-[var(--layout-border-radius,0.5rem)] bg-current opacity-0 group-hover:opacity-[0.06] transition-opacity"
          :style="{ transitionDuration: 'var(--layout-transition-duration, 0.3s)' }"
        />

        <!-- 图标 -->
        <UIcon
          v-if="item.icon"
          :name="item.icon"
          class="relative z-10 text-lg shrink-0 sidebar-nav-icon"
          :class="isActive(item) ? 'text-primary' : ''"
        />

        <!-- 标签 -->
        <span v-if="!collapsed" class="relative z-10 truncate">
          {{ item.label }}
        </span>

        <!-- Badge -->
        <UBadge
          v-if="item.badge && !collapsed"
          :label="item.badge"
          size="xs"
          variant="subtle"
          class="relative z-10 ml-auto"
        />

        <!-- Tooltip（折叠态） -->
        <UTooltip v-if="collapsed" :text="item.label" side="right" :delay-duration="200">
          <span class="absolute inset-0" />
        </UTooltip>
      </NuxtLink>
    </template>
  </nav>
</template>

<style scoped>
.sidebar-nav-item {
  will-change: transform;
}

/* 图标 hover 弹跳 */
.sidebar-nav-item:hover .sidebar-nav-icon {
  animation: icon-bounce var(--layout-animation-duration, 0.4s) cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes icon-bounce {
  0% { transform: scale(1); }
  40% { transform: scale(1.2); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); }
}

/* 激活项左侧指示条 */
.sidebar-nav-item[aria-current="page"]::after {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--ui-primary);
  transition: all var(--layout-transition-duration, 0.3s) cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 拖拽中的项半透明 */
.sidebar-nav-item:active {
  opacity: 0.7;
}
</style>
