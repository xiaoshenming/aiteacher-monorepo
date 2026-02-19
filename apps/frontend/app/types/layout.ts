export type ThemeColor = 'teal' | 'blue' | 'purple' | 'rose' | 'orange' | 'amber' | 'emerald' | 'indigo'
export type ColorMode = 'light' | 'dark' | 'system'
export type SidebarPosition = 'left' | 'right'
export type LayoutDensity = 'compact' | 'comfortable' | 'spacious'
export type BorderRadius = 'none' | 'small' | 'large'
export type ContentMaxWidth = 'full' | '7xl' | '6xl' | '5xl'
export type PageTransition = 'fade' | 'slide' | 'none'
export type ScrollbarStyle = 'thin' | 'auto' | 'hidden'
export type HeaderStyle = 'fixed' | 'static'

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
  // 设置面板
  settingsDrawerOpen: boolean
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
  settingsDrawerOpen: false,
}
