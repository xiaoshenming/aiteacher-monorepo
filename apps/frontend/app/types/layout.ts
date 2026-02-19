export type ThemeColor = 'teal' | 'blue' | 'purple' | 'rose' | 'orange' | 'amber' | 'emerald' | 'indigo'
export type ColorMode = 'light' | 'dark' | 'system'
export type SidebarPosition = 'left' | 'right'
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious'
export type BorderRadius = 'none' | 'small' | 'large'
export type ContentMaxWidth = 'full' | '7xl' | '6xl' | '5xl'
export type PageTransition = 'fade' | 'slide' | 'none'
export type ScrollbarStyle = 'thin' | 'auto' | 'hidden'
export type HeaderStyle = 'fixed' | 'static'
export type ColorHarmony = 'complementary' | 'analogous' | 'triadic' | 'splitComplementary' | 'free'

export interface GradientColorDot {
  id: string
  hue: number        // 0-360
  saturation: number  // 0-100
  lightness: number   // 20-80
  x: number           // 归一化坐标 0-1（相对于色轮中心的偏移）
  y: number           // 归一化坐标 0-1
  isPrimary: boolean
}

export interface GradientBackground {
  enabled: boolean
  dots: GradientColorDot[]
  harmony: ColorHarmony
  opacity: number     // 0-1
  texture: number     // 0-1 噪点纹理强度
  rotation: number    // 渐变旋转角度 0-360
}

export interface LayoutState {
  // 色系主题
  themeColor: ThemeColor
  // 侧边栏
  sidebarPosition: SidebarPosition
  sidebarWidth: number // 200-320
  sidebarCollapsed: boolean
  sidebarGlassEffect: boolean
  // 布局
  layoutDensity: LayoutDensity
  fontSize: number // 12-18
  borderRadius: BorderRadius
  contentMaxWidth: ContentMaxWidth
  // 动效
  animationsEnabled: boolean
  headerDynamicBg: boolean
  pageTransition: PageTransition
  // 顶部栏
  headerStyle: HeaderStyle
  // 滚动条
  scrollbarStyle: ScrollbarStyle
  // 导航
  navOrder: string[] // 菜单项 label 数组，记录排序
  hiddenNavItems: string[] // 隐藏的菜单项 label
  // 背景渐变
  gradientBackground: GradientBackground
  // 设置面板
  settingsDrawerOpen: boolean
}

export const DEFAULT_GRADIENT_DOT: () => GradientColorDot = () => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  hue: 174,
  saturation: 72,
  lightness: 40,
  x: 0.5,
  y: 0.5,
  isPrimary: true,
})

export const DEFAULT_GRADIENT: GradientBackground = {
  enabled: false,
  dots: [],
  harmony: 'triadic',
  opacity: 0.5,
  texture: 0,
  rotation: -45,
}

export const DEFAULT_LAYOUT: LayoutState = {
  themeColor: 'teal',
  sidebarPosition: 'left',
  sidebarWidth: 256,
  sidebarCollapsed: false,
  sidebarGlassEffect: true,
  layoutDensity: 'comfortable',
  fontSize: 14,
  borderRadius: 'small',
  contentMaxWidth: 'full',
  animationsEnabled: true,
  headerDynamicBg: true,
  pageTransition: 'fade',
  headerStyle: 'fixed',
  scrollbarStyle: 'thin',
  navOrder: [],
  hiddenNavItems: [],
  gradientBackground: { ...DEFAULT_GRADIENT },
  settingsDrawerOpen: false,
}
