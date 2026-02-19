interface BreadcrumbItem {
  label: string
  to?: string
  icon?: string
}

/**
 * 根据当前路由自动生成面包屑导航。
 * 使用 useDashboardNav 的导航数据匹配 label 和 icon。
 */
export function useBreadcrumb() {
  const route = useRoute()
  const { navItems } = useDashboardNav()

  // 路由段 → 中文名映射
  const segmentLabels: Record<string, string> = {
    user: '教师中心',
    admin: '管理后台',
    superadmin: '超级管理',
    student: '学生中心',
  }

  const breadcrumbs = computed<BreadcrumbItem[]>(() => {
    const path = route.path
    const segments = path.split('/').filter(Boolean)
    if (segments.length === 0) return []

    const items: BreadcrumbItem[] = []

    // 第一段：角色根路径
    const roleSegment = segments[0]!
    const roleLabel = segmentLabels[roleSegment]
    if (roleLabel) {
      items.push({
        label: roleLabel,
        to: `/${roleSegment}`,
        icon: 'i-lucide-house',
      })
    }

    // 后续段：从导航数据中匹配
    if (segments.length > 1) {
      const fullPath = `/${segments.join('/')}`
      const allNavItems = navItems.value.flat()
      const matched = allNavItems.find(item => item.to === fullPath)
      if (matched) {
        items.push({
          label: matched.label,
          icon: matched.icon,
        })
      } else {
        // fallback：用路由段名
        items.push({ label: segments[segments.length - 1]! })
      }
    }

    return items
  })

  return { breadcrumbs }
}
