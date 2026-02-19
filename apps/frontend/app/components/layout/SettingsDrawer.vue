<script setup lang="ts">
import type { ThemeColor, SidebarPosition, LayoutDensity, BorderRadius, ContentMaxWidth, PageTransition, ScrollbarStyle, HeaderStyle } from '~/types/layout'

const layoutStore = useLayoutStore()
const { navItems } = useDashboardNav()
const { startViewTransitionFromEvent, nextTheme } = useColorModeTransition()

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

// 内容区最大宽度
const maxWidthOptions: { value: ContentMaxWidth; label: string }[] = [
  { value: 'full', label: '全宽' },
  { value: '7xl', label: '宽' },
  { value: '6xl', label: '中' },
  { value: '5xl', label: '窄' },
]

// 页面过渡效果
const transitionOptions: { value: PageTransition; label: string; icon: string }[] = [
  { value: 'fade', label: '淡入', icon: 'i-lucide-blend' },
  { value: 'slide', label: '滑动', icon: 'i-lucide-move-right' },
  { value: 'none', label: '无', icon: 'i-lucide-minus' },
]

// 滚动条样式
const scrollbarOptions: { value: ScrollbarStyle; label: string }[] = [
  { value: 'thin', label: '细滚动条' },
  { value: 'auto', label: '系统默认' },
  { value: 'hidden', label: '隐藏' },
]

// 顶部栏样式
const headerOptions: { value: HeaderStyle; label: string }[] = [
  { value: 'fixed', label: '固定' },
  { value: 'static', label: '跟随滚动' },
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

// 导出/导入配置
function exportConfig() {
  const data = JSON.stringify(layoutStore.state, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'layout-config.json'
  a.click()
  URL.revokeObjectURL(url)
}

const fileInput = ref<HTMLInputElement>()
function importConfig() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      Object.assign(layoutStore.state, data)
    } catch {}
  }
  reader.readAsText(file)
}

// 当前设置分区折叠
const expandedSections = ref<Record<string, boolean>>({
  theme: true,
  gradient: false,
  sidebar: true,
  layout: true,
  effects: true,
  nav: false,
  advanced: false,
})

function toggleSection(key: string) {
  expandedSections.value[key] = !expandedSections.value[key]
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
        <div class="flex items-center gap-1">
          <UTooltip text="导入配置">
            <UButton icon="i-lucide-upload" size="xs" color="neutral" variant="ghost" @click="importConfig" />
          </UTooltip>
          <UTooltip text="导出配置">
            <UButton icon="i-lucide-download" size="xs" color="neutral" variant="ghost" @click="exportConfig" />
          </UTooltip>
          <UButton
            label="重置"
            icon="i-lucide-rotate-ccw"
            size="xs"
            color="neutral"
            variant="ghost"
            @click="layoutStore.resetToDefaults()"
          />
        </div>
      </div>
      <input ref="fileInput" type="file" accept=".json" class="hidden" @change="onFileChange" />
    </template>

    <template #body>
      <div class="space-y-1">

        <!-- ===== 色系主题 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('theme')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-paintbrush" class="text-muted" />
              <span>色系主题</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.theme ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.theme" class="settings-section-body">
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
                @click="startViewTransitionFromEvent($event)"
              />
            </div>
          </div>
        </section>

        <!-- ===== 渐变背景 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('gradient')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-blend" class="text-muted" />
              <span>渐变背景</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.gradient ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.gradient" class="settings-section-body">
            <LayoutZenGradientSettings />
          </div>
        </section>

        <!-- ===== 侧边栏设置 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('sidebar')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-panel-left" class="text-muted" />
              <span>侧边栏</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.sidebar ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.sidebar" class="settings-section-body">
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
          </div>
        </section>

        <!-- ===== 布局与排版 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('layout')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-layout-grid" class="text-muted" />
              <span>布局与排版</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.layout ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.layout" class="settings-section-body">
            <!-- 布局密度 -->
            <div class="mb-4">
              <span class="text-sm text-muted mb-2 block">布局密度</span>
              <div class="flex gap-2">
                <button
                  v-for="d in densityOptions"
                  :key="d.value"
                  class="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all"
                  :class="layoutStore.layoutDensity === d.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-default hover:border-muted'"
                  @click="layoutStore.setLayoutDensity(d.value)"
                >
                  <UIcon :name="d.icon" class="text-lg" />
                  <span class="text-xs">{{ d.label }}</span>
                </button>
              </div>
            </div>

            <!-- 字号 -->
            <div class="mb-4">
              <span class="text-sm text-muted mb-2 block">字号</span>
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
            </div>

            <!-- 圆角 -->
            <div class="mb-4">
              <span class="text-sm text-muted mb-2 block">圆角</span>
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
            </div>

            <!-- 内容区最大宽度 -->
            <div class="mb-4">
              <span class="text-sm text-muted mb-2 block">内容区宽度</span>
              <div class="flex gap-2">
                <button
                  v-for="w in maxWidthOptions"
                  :key="w.value"
                  class="flex-1 py-2 text-center text-sm rounded-lg border transition-all"
                  :class="layoutStore.contentMaxWidth === w.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-default hover:border-muted'"
                  @click="layoutStore.setContentMaxWidth(w.value)"
                >
                  {{ w.label }}
                </button>
              </div>
            </div>

            <!-- 顶部栏样式 -->
            <div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">顶部栏</span>
                <div class="flex gap-1">
                  <UButton
                    v-for="h in headerOptions"
                    :key="h.value"
                    :label="h.label"
                    size="xs"
                    :color="layoutStore.headerStyle === h.value ? 'primary' : 'neutral'"
                    :variant="layoutStore.headerStyle === h.value ? 'solid' : 'outline'"
                    @click="layoutStore.setHeaderStyle(h.value)"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== 效果与动画 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('effects')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-sparkles" class="text-muted" />
              <span>效果与动画</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.effects ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.effects" class="settings-section-body">
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

            <!-- 页面过渡效果 -->
            <div class="mt-4">
              <span class="text-sm text-muted mb-2 block">页面过渡</span>
              <div class="flex gap-2">
                <button
                  v-for="t in transitionOptions"
                  :key="t.value"
                  class="flex-1 flex flex-col items-center gap-1.5 p-2.5 rounded-lg border transition-all"
                  :class="layoutStore.pageTransition === t.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-default hover:border-muted'"
                  @click="layoutStore.setPageTransition(t.value)"
                >
                  <UIcon :name="t.icon" class="text-lg" />
                  <span class="text-xs">{{ t.label }}</span>
                </button>
              </div>
            </div>

            <!-- 滚动条样式 -->
            <div class="mt-4">
              <span class="text-sm text-muted mb-2 block">滚动条</span>
              <div class="flex gap-2">
                <button
                  v-for="s in scrollbarOptions"
                  :key="s.value"
                  class="flex-1 py-2 text-center text-sm rounded-lg border transition-all"
                  :class="layoutStore.scrollbarStyle === s.value
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-default hover:border-muted'"
                  @click="layoutStore.setScrollbarStyle(s.value)"
                >
                  {{ s.label }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- ===== 导航菜单管理 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('nav')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-list" class="text-muted" />
              <span>导航菜单</span>
            </div>
            <div class="flex items-center gap-2">
              <UBadge :label="`${managedNavItems.length}项`" size="xs" variant="subtle" />
              <UIcon
                name="i-lucide-chevron-down"
                class="text-muted transition-transform"
                :class="expandedSections.nav ? 'rotate-180' : ''"
              />
            </div>
          </button>
          <div v-show="expandedSections.nav" class="settings-section-body">
            <div class="flex items-center justify-between mb-2">
              <p class="text-xs text-dimmed">拖拽排序，点击眼睛图标显示/隐藏</p>
              <UButton
                label="重置"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-rotate-ccw"
                @click="resetNavOrder"
              />
            </div>
            <div class="space-y-1 max-h-60 overflow-y-auto scrollbar-thin">
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
          </div>
        </section>

        <!-- ===== 高级设置 ===== -->
        <section class="settings-section">
          <button class="settings-section-header" @click="toggleSection('advanced')">
            <div class="flex items-center gap-1.5">
              <UIcon name="i-lucide-wrench" class="text-muted" />
              <span>高级</span>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="text-muted transition-transform"
              :class="expandedSections.advanced ? 'rotate-180' : ''"
            />
          </button>
          <div v-show="expandedSections.advanced" class="settings-section-body">
            <div class="space-y-3">
              <!-- 导出/导入 -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">配置备份</span>
                <div class="flex gap-1">
                  <UButton label="导出" icon="i-lucide-download" size="xs" color="neutral" variant="outline" @click="exportConfig" />
                  <UButton label="导入" icon="i-lucide-upload" size="xs" color="neutral" variant="outline" @click="importConfig" />
                </div>
              </div>

              <!-- 重置全部 -->
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted">恢复默认设置</span>
                <UButton
                  label="重置全部"
                  icon="i-lucide-rotate-ccw"
                  size="xs"
                  color="error"
                  variant="outline"
                  @click="layoutStore.resetToDefaults()"
                />
              </div>

              <!-- 版本信息 -->
              <div class="pt-2 border-t border-default">
                <p class="text-xs text-dimmed text-center">AI 教师平台 · 界面设置 v2.0</p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </template>
  </USlideover>
</template>

<style scoped>
.settings-section {
  border-radius: var(--layout-border-radius, 0.5rem);
  border: 1px solid var(--ui-border);
  overflow: hidden;
}

.settings-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--ui-text-highlighted);
  background: var(--ui-bg-elevated);
  transition: background 0.15s ease;
  cursor: pointer;
}
.settings-section-header:hover {
  background: color-mix(in srgb, var(--ui-bg-elevated) 90%, var(--ui-primary) 10%);
}

.settings-section-body {
  padding: 0.75rem;
}
</style>
