<script setup lang="ts">
import type { ThemeColor, SidebarPosition, LayoutDensity, BorderRadius } from '~/types/layout'

const layoutStore = useLayoutStore()
const { navItems } = useDashboardNav()
const { startViewTransitionFromCenter, nextTheme } = useColorModeTransition()

const open = computed({
  get: () => layoutStore.settingsDrawerOpen,
  set: (v: boolean) => layoutStore.setSettingsDrawerOpen(v),
})

// 主题色选项
const themeColors: { value: ThemeColor; label: string; class: string }[] = [
  { value: 'teal', label: '青色', class: 'bg-teal-500' },
  { value: 'blue', label: '蓝色', class: 'bg-blue-500' },
  { value: 'purple', label: '紫色', class: 'bg-purple-500' },
  { value: 'rose', label: '玫红', class: 'bg-rose-500' },
  { value: 'orange', label: '橙色', class: 'bg-orange-500' },
  { value: 'amber', label: '琥珀', class: 'bg-amber-500' },
  { value: 'emerald', label: '翠绿', class: 'bg-emerald-500' },
  { value: 'indigo', label: '靛蓝', class: 'bg-indigo-500' },
]

// 密度选项
const densityOptions: { value: LayoutDensity; label: string; icon: string }[] = [
  { value: 'compact', label: '紧凑', icon: 'i-lucide-minimize-2' },
  { value: 'comfortable', label: '舒适', icon: 'i-lucide-layout-grid' },
  { value: 'spacious', label: '宽松', icon: 'i-lucide-maximize-2' },
]

// 圆角选项
const radiusOptions: { value: BorderRadius; label: string }[] = [
  { value: 'none', label: '无圆角' },
  { value: 'small', label: '小圆角' },
  { value: 'large', label: '大圆角' },
]

// 侧边栏位置选项
const positionOptions: { value: SidebarPosition; label: string; icon: string }[] = [
  { value: 'left', label: '左侧', icon: 'i-lucide-panel-left' },
  { value: 'right', label: '右侧', icon: 'i-lucide-panel-right' },
]

// 导航菜单管理
const allNavItems = computed(() => navItems.value.flat())

// 拖拽排序状态
const navDragIndex = ref<number | null>(null)
const navDragOverIndex = ref<number | null>(null)

const managedNavItems = computed(() => {
  let items = [...allNavItems.value]
  if (layoutStore.navOrder.length > 0) {
    const orderMap = new Map(layoutStore.navOrder.map((label, i) => [label, i]))
    items.sort((a, b) => {
      const ai = orderMap.get(a.label) ?? 999
      const bi = orderMap.get(b.label) ?? 999
      return ai - bi
    })
  }
  return items
})

function onNavDragStart(index: number) { navDragIndex.value = index }
function onNavDragOver(e: DragEvent, index: number) { e.preventDefault(); navDragOverIndex.value = index }
function onNavDragEnd() {
  if (navDragIndex.value !== null && navDragOverIndex.value !== null && navDragIndex.value !== navDragOverIndex.value) {
    const items = [...managedNavItems.value]
    const [moved] = items.splice(navDragIndex.value, 1)
    items.splice(navDragOverIndex.value, 0, moved)
    layoutStore.setNavOrder(items.map(i => i.label))
  }
  navDragIndex.value = null
  navDragOverIndex.value = null
}

function resetNavOrder() {
  layoutStore.setNavOrder([])
  layoutStore.state.hiddenNavItems = []
}
</script>

<template>
  <USlideover v-model:open="open" side="right" title="界面设置" :ui="{ width: 'max-w-sm' }">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-palette" class="text-primary" />
          <span class="font-semibold">界面设置</span>
        </div>
        <UButton
          label="重置"
          icon="i-lucide-rotate-ccw"
          size="xs"
          color="neutral"
          variant="ghost"
          @click="layoutStore.resetToDefaults()"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-6">

        <!-- ===== 色系主题 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-paintbrush" class="text-muted" />
            色系主题
          </h3>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="color in themeColors"
              :key="color.value"
              class="flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-all hover:scale-105"
              :class="layoutStore.themeColor === color.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-default hover:border-muted'"
              @click="layoutStore.setThemeColor(color.value)"
            >
              <span class="w-6 h-6 rounded-full shadow-sm" :class="color.class" />
              <span class="text-xs text-muted">{{ color.label }}</span>
            </button>
          </div>

          <!-- 亮暗模式 -->
          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-muted">颜色模式</span>
            <UButton
              :icon="nextTheme === 'light' ? 'i-lucide-sun' : 'i-lucide-moon'"
              :label="nextTheme === 'light' ? '切换亮色' : '切换暗色'"
              size="xs"
              color="neutral"
              variant="outline"
              @click="startViewTransitionFromCenter"
            />
          </div>
        </section>

        <USeparator />

        <!-- ===== 侧边栏设置 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-panel-left" class="text-muted" />
            侧边栏
          </h3>

          <!-- 位置 -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-muted">位置</span>
            <div class="flex gap-1">
              <UButton
                v-for="pos in positionOptions"
                :key="pos.value"
                :icon="pos.icon"
                :label="pos.label"
                size="xs"
                :color="layoutStore.sidebarPosition === pos.value ? 'primary' : 'neutral'"
                :variant="layoutStore.sidebarPosition === pos.value ? 'solid' : 'outline'"
                @click="layoutStore.setSidebarPosition(pos.value)"
              />
            </div>
          </div>

          <!-- 宽度 -->
          <div class="mb-3">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm text-muted">宽度</span>
              <span class="text-xs text-dimmed">{{ layoutStore.sidebarWidth }}px</span>
            </div>
            <input
              type="range"
              :value="layoutStore.sidebarWidth"
              min="200"
              max="320"
              step="4"
              class="w-full accent-[var(--ui-primary)]"
              @input="layoutStore.setSidebarWidth(Number(($event.target as HTMLInputElement).value))"
            />
          </div>

          <!-- 默认折叠 -->
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm text-muted">默认折叠</span>
            <USwitch
              :model-value="layoutStore.sidebarCollapsed"
              @update:model-value="layoutStore.setSidebarCollapsed($event)"
            />
          </div>

          <!-- 毛玻璃效果 -->
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted">毛玻璃效果</span>
            <USwitch
              :model-value="layoutStore.sidebarGlassEffect"
              @update:model-value="layoutStore.toggleSidebarGlass()"
            />
          </div>
        </section>

        <USeparator />

        <!-- ===== 布局密度 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-layout-grid" class="text-muted" />
            布局密度
          </h3>
          <div class="flex gap-2">
            <button
              v-for="d in densityOptions"
              :key="d.value"
              class="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all"
              :class="layoutStore.layoutDensity === d.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-default hover:border-muted'"
              @click="layoutStore.setLayoutDensity(d.value)"
            >
              <UIcon :name="d.icon" class="text-lg" />
              <span class="text-xs">{{ d.label }}</span>
            </button>
          </div>
        </section>

        <USeparator />

        <!-- ===== 字号调节 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-type" class="text-muted" />
            字号
          </h3>
          <div class="flex items-center gap-3">
            <span class="text-xs text-muted">A</span>
            <input
              type="range"
              :value="layoutStore.fontSize"
              min="12"
              max="18"
              step="1"
              class="flex-1 accent-[var(--ui-primary)]"
              @input="layoutStore.setFontSize(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="text-lg text-muted font-bold">A</span>
            <span class="text-xs text-dimmed w-8 text-right">{{ layoutStore.fontSize }}px</span>
          </div>
        </section>

        <USeparator />

        <!-- ===== 圆角 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-square" class="text-muted" />
            圆角
          </h3>
          <div class="flex gap-2">
            <button
              v-for="r in radiusOptions"
              :key="r.value"
              class="flex-1 py-2 text-center text-sm rounded-lg border transition-all"
              :class="layoutStore.borderRadius === r.value
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                : 'border-default hover:border-muted'"
              @click="layoutStore.setBorderRadius(r.value)"
            >
              {{ r.label }}
            </button>
          </div>
        </section>

        <USeparator />

        <!-- ===== 开关选项 ===== -->
        <section>
          <h3 class="text-sm font-medium text-highlighted mb-3 flex items-center gap-1.5">
            <UIcon name="i-lucide-toggle-right" class="text-muted" />
            效果开关
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">过渡动画</span>
              <USwitch
                :model-value="layoutStore.animationsEnabled"
                @update:model-value="layoutStore.toggleAnimations()"
              />
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted">顶部栏动态背景</span>
              <USwitch
                :model-value="layoutStore.headerDynamicBg"
                @update:model-value="layoutStore.toggleHeaderDynamicBg()"
              />
            </div>
          </div>
        </section>

        <USeparator />

        <!-- ===== 导航菜单管理 ===== -->
        <section>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-highlighted flex items-center gap-1.5">
              <UIcon name="i-lucide-list" class="text-muted" />
              导航菜单
            </h3>
            <UButton
              label="重置排序"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-rotate-ccw"
              @click="resetNavOrder"
            />
          </div>
          <p class="text-xs text-dimmed mb-2">拖拽排序，点击眼睛图标显示/隐藏</p>
          <div class="space-y-1 max-h-60 overflow-y-auto">
            <div
              v-for="(item, index) in managedNavItems"
              :key="item.label"
              draggable="true"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent transition-all cursor-grab active:cursor-grabbing"
              :class="[
                navDragOverIndex === index ? 'border-primary/30 bg-primary/5' : 'hover:bg-elevated',
                layoutStore.hiddenNavItems.includes(item.label) ? 'opacity-40' : '',
              ]"
              @dragstart="onNavDragStart(index)"
              @dragover="onNavDragOver($event, index)"
              @dragend="onNavDragEnd"
            >
              <UIcon name="i-lucide-grip-vertical" class="text-dimmed shrink-0" />
              <UIcon v-if="item.icon" :name="item.icon" class="text-muted shrink-0" />
              <span class="text-sm flex-1 truncate">{{ item.label }}</span>
              <UButton
                :icon="layoutStore.hiddenNavItems.includes(item.label) ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                size="xs"
                color="neutral"
                variant="ghost"
                @click="layoutStore.toggleNavItemVisibility(item.label)"
              />
            </div>
          </div>
        </section>

      </div>
    </template>
  </USlideover>
</template>
