import { defineStore } from 'pinia'
import { DEFAULT_LAYOUT, DEFAULT_GRADIENT, DEFAULT_GRADIENT_DOT } from '~/types/layout'
import type { LayoutState, ThemeColor, SidebarPosition, LayoutDensity, BorderRadius, ContentMaxWidth, PageTransition, ScrollbarStyle, HeaderStyle, ColorHarmony, GradientColorDot } from '~/types/layout'

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
  const gradientBackground = computed(() => state.value.gradientBackground)

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

  // --- 渐变背景 Actions ---
  function setGradientEnabled(v: boolean) { state.value.gradientBackground.enabled = v }
  function setGradientOpacity(v: number) { state.value.gradientBackground.opacity = Math.min(1, Math.max(0, v)) }
  function setGradientTexture(v: number) { state.value.gradientBackground.texture = Math.min(1, Math.max(0, v)) }
  function setGradientRotation(v: number) { state.value.gradientBackground.rotation = v }
  function setGradientHarmony(h: ColorHarmony) { state.value.gradientBackground.harmony = h }
  function addGradientDot(dot?: Partial<GradientColorDot>) {
    if (state.value.gradientBackground.dots.length >= 3) return
    const base = DEFAULT_GRADIENT_DOT()
    const isPrimary = state.value.gradientBackground.dots.length === 0
    state.value.gradientBackground.dots.push({ ...base, ...dot, isPrimary })
  }
  function removeGradientDot(id: string) {
    const dots = state.value.gradientBackground.dots
    const idx = dots.findIndex(d => d.id === id)
    if (idx >= 0) dots.splice(idx, 1)
    // 确保至少有一个 primary
    if (dots.length > 0 && !dots.some(d => d.isPrimary)) {
      dots[0]!.isPrimary = true
    }
  }
  function updateGradientDot(id: string, updates: Partial<GradientColorDot>) {
    const dot = state.value.gradientBackground.dots.find(d => d.id === id)
    if (dot) Object.assign(dot, updates)
  }
  function resetGradient() {
    state.value.gradientBackground = { ...DEFAULT_GRADIENT, dots: [] }
  }

  function resetToDefaults() { state.value = { ...DEFAULT_LAYOUT, gradientBackground: { ...DEFAULT_GRADIENT, dots: [] } } }

  return {
    state, themeColor, sidebarPosition, sidebarWidth, sidebarCollapsed,
    sidebarGlassEffect, layoutDensity, fontSize, borderRadius, contentMaxWidth,
    animationsEnabled, headerDynamicBg, pageTransition, headerStyle, scrollbarStyle,
    navOrder, hiddenNavItems, settingsDrawerOpen, gradientBackground,
    densityClass, radiusClass,
    setThemeColor, setSidebarPosition, setSidebarWidth, toggleSidebarCollapsed,
    setSidebarCollapsed, toggleSidebarGlass, setLayoutDensity, setFontSize,
    setBorderRadius, setContentMaxWidth, toggleAnimations, toggleHeaderDynamicBg,
    setPageTransition, setHeaderStyle, setScrollbarStyle, setNavOrder,
    toggleNavItemVisibility, toggleSettingsDrawer, setSettingsDrawerOpen,
    setGradientEnabled, setGradientOpacity, setGradientTexture, setGradientRotation,
    setGradientHarmony, addGradientDot, removeGradientDot, updateGradientDot, resetGradient,
    resetToDefaults,
  }
}, {
  persist: { key: 'aiteacher-layout' },
})
