import { defineStore } from 'pinia'
import { DEFAULT_LAYOUT } from '~/types/layout'
import type { LayoutState, ThemeColor, SidebarPosition, LayoutDensity, BorderRadius, ContentMaxWidth, PageTransition, ScrollbarStyle, HeaderStyle } from '~/types/layout'

export const useLayoutStore = defineStore('layout', () => {
  const state = ref<LayoutState>({ ...DEFAULT_LAYOUT })

  // --- Getters ---
  const themeColor = computed(() => state.value.themeColor)
  const sidebarPosition = computed(() => state.value.sidebarPosition)
  const sidebarWidth = computed(() => state.value.sidebarWidth)
  const sidebarCollapsed = computed(() => state.value.sidebarCollapsed)
  const sidebarGlassEffect = computed(() => state.value.sidebarGlassEffect)
  const layoutDensity = computed(() => state.value.layoutDensity)
  const fontSize = computed(() => state.value.fontSize)
  const borderRadius = computed(() => state.value.borderRadius)
  const contentMaxWidth = computed(() => state.value.contentMaxWidth)
  const animationsEnabled = computed(() => state.value.animationsEnabled)
  const headerDynamicBg = computed(() => state.value.headerDynamicBg)
  const pageTransition = computed(() => state.value.pageTransition)
  const headerStyle = computed(() => state.value.headerStyle)
  const scrollbarStyle = computed(() => state.value.scrollbarStyle)
  const navOrder = computed(() => state.value.navOrder)
  const hiddenNavItems = computed(() => state.value.hiddenNavItems)
  const settingsDrawerOpen = computed(() => state.value.settingsDrawerOpen)

  // --- 密度映射 ---
  const densityClass = computed(() => {
    const map = { compact: 'density-compact', comfortable: 'density-comfortable', spacious: 'density-spacious' }
    return map[state.value.layoutDensity]
  })

  const radiusClass = computed(() => {
    const map = { none: 'radius-none', small: 'radius-small', large: 'radius-large' }
    return map[state.value.borderRadius]
  })

  // --- Actions ---
  function setThemeColor(color: ThemeColor) { state.value.themeColor = color }
  function setSidebarPosition(pos: SidebarPosition) { state.value.sidebarPosition = pos }
  function setSidebarWidth(w: number) { state.value.sidebarWidth = Math.min(320, Math.max(200, w)) }
  function toggleSidebarCollapsed() { state.value.sidebarCollapsed = !state.value.sidebarCollapsed }
  function setSidebarCollapsed(v: boolean) { state.value.sidebarCollapsed = v }
  function toggleSidebarGlass() { state.value.sidebarGlassEffect = !state.value.sidebarGlassEffect }
  function setLayoutDensity(d: LayoutDensity) { state.value.layoutDensity = d }
  function setFontSize(s: number) { state.value.fontSize = Math.min(18, Math.max(12, s)) }
  function setBorderRadius(r: BorderRadius) { state.value.borderRadius = r }
  function setContentMaxWidth(w: ContentMaxWidth) { state.value.contentMaxWidth = w }
  function toggleAnimations() { state.value.animationsEnabled = !state.value.animationsEnabled }
  function toggleHeaderDynamicBg() { state.value.headerDynamicBg = !state.value.headerDynamicBg }
  function setPageTransition(t: PageTransition) { state.value.pageTransition = t }
  function setHeaderStyle(s: HeaderStyle) { state.value.headerStyle = s }
  function setScrollbarStyle(s: ScrollbarStyle) { state.value.scrollbarStyle = s }
  function setNavOrder(order: string[]) { state.value.navOrder = order }
  function toggleNavItemVisibility(label: string) {
    const idx = state.value.hiddenNavItems.indexOf(label)
    if (idx >= 0) state.value.hiddenNavItems.splice(idx, 1)
    else state.value.hiddenNavItems.push(label)
  }
  function toggleSettingsDrawer() { state.value.settingsDrawerOpen = !state.value.settingsDrawerOpen }
  function setSettingsDrawerOpen(v: boolean) { state.value.settingsDrawerOpen = v }
  function resetToDefaults() { state.value = { ...DEFAULT_LAYOUT } }

  return {
    state, themeColor, sidebarPosition, sidebarWidth, sidebarCollapsed,
    sidebarGlassEffect, layoutDensity, fontSize, borderRadius, contentMaxWidth,
    animationsEnabled, headerDynamicBg, pageTransition, headerStyle, scrollbarStyle,
    navOrder, hiddenNavItems, settingsDrawerOpen,
    densityClass, radiusClass,
    setThemeColor, setSidebarPosition, setSidebarWidth, toggleSidebarCollapsed,
    setSidebarCollapsed, toggleSidebarGlass, setLayoutDensity, setFontSize,
    setBorderRadius, setContentMaxWidth, toggleAnimations, toggleHeaderDynamicBg,
    setPageTransition, setHeaderStyle, setScrollbarStyle, setNavOrder,
    toggleNavItemVisibility, toggleSettingsDrawer, setSettingsDrawerOpen, resetToDefaults,
  }
}, {
  persist: { key: 'aiteacher-layout' },
})
