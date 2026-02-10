import type { DashboardNavItem } from '~/types/dashboard'

function getTeacherNav(closeSidebar: () => void): DashboardNavItem[][] {
  return [[
    {
      label: '首页',
      icon: 'i-lucide-house',
      to: '/user',
      exact: true,
      onSelect: closeSidebar,
    },
    {
      label: '课程表',
      icon: 'i-lucide-calendar-days',
      to: '/user/class-schedule',
      onSelect: closeSidebar,
    },
    {
      label: 'AI问答',
      icon: 'i-lucide-bot',
      to: '/user/ai',
      onSelect: closeSidebar,
    },
    {
      label: '教案管理',
      icon: 'i-lucide-notebook-pen',
      to: '/user/lesson-plans',
      onSelect: closeSidebar,
    },
    {
      label: '云盘',
      icon: 'i-lucide-cloud',
      to: '/user/clouddisk',
      onSelect: closeSidebar,
    },
    {
      label: 'PPT工具',
      icon: 'i-lucide-presentation',
      to: '/user/ppt',
      onSelect: closeSidebar,
    },
    {
      label: '试卷阅览',
      icon: 'i-lucide-file-text',
      to: '/user/papers',
      onSelect: closeSidebar,
    },
    {
      label: '课本阅览',
      icon: 'i-lucide-book-open',
      to: '/user/textbooks',
      onSelect: closeSidebar,
    },
    {
      label: '课程设置',
      icon: 'i-lucide-settings',
      to: '/user/courses',
      onSelect: closeSidebar,
    },
    {
      label: '学情分析',
      icon: 'i-lucide-bar-chart-3',
      to: '/user/data',
      onSelect: closeSidebar,
    },
    {
      label: '数据分析',
      icon: 'i-lucide-chart-line',
      to: '/user/analytics',
      onSelect: closeSidebar,
    },
    {
      label: '课堂录制',
      icon: 'i-lucide-video',
      to: '/user/recordings',
      onSelect: closeSidebar,
    },
    {
      label: 'AI同传助手',
      icon: 'i-lucide-languages',
      to: '/user/interpreter',
      onSelect: closeSidebar,
    },
    {
      label: 'AI智能出题',
      icon: 'i-lucide-brain',
      to: '/user/topic',
      onSelect: closeSidebar,
    },
    {
      label: '题库管理',
      icon: 'i-lucide-database',
      to: '/user/question-bank',
      onSelect: closeSidebar,
    },
    {
      label: '作业发布',
      icon: 'i-lucide-clipboard-list',
      to: '/user/assignment',
      onSelect: closeSidebar,
    },
    {
      label: '设计器',
      icon: 'i-lucide-palette',
      to: '/user/hiprint',
      onSelect: closeSidebar,
    },
    {
      label: 'VIP订阅',
      icon: 'i-lucide-crown',
      to: '/user/subscription',
      badge: 'VIP',
      onSelect: closeSidebar,
    },
  ], [
    {
      label: '帮助与支持',
      icon: 'i-lucide-circle-help',
      to: '/user/help',
      onSelect: closeSidebar,
    },
    {
      label: '反馈',
      icon: 'i-lucide-message-circle',
      to: '/user/feedback',
      onSelect: closeSidebar,
    },
  ]]
}

function getAdminNav(closeSidebar: () => void): DashboardNavItem[][] {
  return [[
    {
      label: '首页',
      icon: 'i-lucide-house',
      to: '/admin',
      exact: true,
      onSelect: closeSidebar,
    },
    {
      label: '本校教师表',
      icon: 'i-lucide-users',
      to: '/admin/teachers',
      onSelect: closeSidebar,
    },
    {
      label: '消息通知',
      icon: 'i-lucide-bell',
      to: '/admin/notifications',
      onSelect: closeSidebar,
    },
    {
      label: 'AI助手',
      icon: 'i-lucide-bot',
      to: '/admin/ai',
      onSelect: closeSidebar,
    },
    {
      label: '云盘',
      icon: 'i-lucide-cloud',
      to: '/admin/clouddisk',
      onSelect: closeSidebar,
    },
    {
      label: '系统管理',
      icon: 'i-lucide-settings',
      to: '/admin/system',
      onSelect: closeSidebar,
    },
  ], [
    {
      label: '帮助与支持',
      icon: 'i-lucide-circle-help',
      to: '/admin/help',
      onSelect: closeSidebar,
    },
  ]]
}

function getSuperAdminNav(closeSidebar: () => void): DashboardNavItem[][] {
  return [[
    {
      label: '仪表盘',
      icon: 'i-lucide-layout-dashboard',
      to: '/superadmin',
      exact: true,
      onSelect: closeSidebar,
    },
    {
      label: '用户管理',
      icon: 'i-lucide-users',
      to: '/superadmin/users',
      onSelect: closeSidebar,
    },
    {
      label: '权限配置',
      icon: 'i-lucide-shield',
      to: '/superadmin/permissions',
      onSelect: closeSidebar,
    },
    {
      label: '系统管理',
      icon: 'i-lucide-server',
      to: '/superadmin/system',
      onSelect: closeSidebar,
    },
    {
      label: '系统日志',
      icon: 'i-lucide-scroll-text',
      to: '/superadmin/logs',
      onSelect: closeSidebar,
    },
    {
      label: '数据备份',
      icon: 'i-lucide-hard-drive',
      to: '/superadmin/backup',
      onSelect: closeSidebar,
    },
    {
      label: '安全中心',
      icon: 'i-lucide-lock',
      to: '/superadmin/security',
      onSelect: closeSidebar,
    },
    {
      label: '性能监控',
      icon: 'i-lucide-activity',
      to: '/superadmin/monitor',
      onSelect: closeSidebar,
    },
  ], [
    {
      label: '帮助与支持',
      icon: 'i-lucide-circle-help',
      to: '/superadmin/help',
      onSelect: closeSidebar,
    },
  ]]
}

function getStudentNav(closeSidebar: () => void): DashboardNavItem[][] {
  return [[
    {
      label: '首页',
      icon: 'i-lucide-house',
      to: '/student',
      exact: true,
      onSelect: closeSidebar,
    },
    {
      label: '我的课程',
      icon: 'i-lucide-book-open',
      to: '/student/courses',
      onSelect: closeSidebar,
    },
    {
      label: '学情分析',
      icon: 'i-lucide-bar-chart-3',
      to: '/student/data',
      onSelect: closeSidebar,
    },
    {
      label: '作业中心',
      icon: 'i-lucide-clipboard-list',
      to: '/student/assignments',
      onSelect: closeSidebar,
    },
  ], [
    {
      label: '帮助与支持',
      icon: 'i-lucide-circle-help',
      to: '/student/help',
      onSelect: closeSidebar,
    },
  ]]
}

export function useDashboardNav() {
  const userStore = useUserStore()
  const open = ref(false)

  const closeSidebar = () => {
    open.value = false
  }

  const navItems = computed<DashboardNavItem[][]>(() => {
    const role = userStore.userInfo.role
    switch (role) {
      case '2':
        return getTeacherNav(closeSidebar)
      case '3':
        return getAdminNav(closeSidebar)
      case '4':
        return getSuperAdminNav(closeSidebar)
      case '0':
        return getStudentNav(closeSidebar)
      case '1':
      default:
        return getTeacherNav(closeSidebar)
    }
  })

  const roleTitle = computed(() => {
    const role = userStore.userInfo.role
    switch (role) {
      case '2': return 'AI教师助手'
      case '3': return '管理后台'
      case '4': return '超级管理'
      case '0': return '学生中心'
      case '1':
      default: return 'AI教师助手'
    }
  })

  return {
    open,
    navItems,
    roleTitle,
  }
}
