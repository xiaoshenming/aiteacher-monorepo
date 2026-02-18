import type { Stat } from '~/types/dashboard'

export function useDashboardData() {
  const stats: Stat[] = [
    {
      title: '平均分',
      icon: 'i-lucide-trophy',
      value: 82.5,
      variation: 3.2,
    },
    {
      title: '及格率',
      icon: 'i-lucide-check-circle',
      value: '92%',
      variation: 1.5,
    },
    {
      title: '出勤率',
      icon: 'i-lucide-calendar-check',
      value: '96.8%',
      variation: 0.3,
    },
    {
      title: '作业完成率',
      icon: 'i-lucide-clipboard-check',
      value: '87.5%',
      variation: -2.1,
    },
  ]

  const scoreDistOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['<60', '60-70', '70-80', '80-90', '90-100'],
    },
    yAxis: {
      type: 'value',
      name: '人数',
    },
    series: [
      {
        name: '人数',
        type: 'bar',
        data: [5, 8, 15, 25, 12],
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: 'var(--ui-primary)',
        },
      },
    ],
  }))

  const trendOption = computed(() => ({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: ['平均分', '及格率'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周'],
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
    },
    series: [
      {
        name: '平均分',
        type: 'line',
        smooth: true,
        data: [76, 78, 79, 80, 81, 80, 82, 82.5],
        itemStyle: { color: 'var(--ui-primary)' },
      },
      {
        name: '及格率',
        type: 'line',
        smooth: true,
        data: [85, 87, 88, 89, 90, 91, 91, 92],
        itemStyle: { color: 'var(--ui-success)' },
      },
    ],
  }))

  const quickActions = [
    { label: 'AI问答', icon: 'i-lucide-bot', to: '/user/ai' },
    { label: '课程表', icon: 'i-lucide-calendar-days', to: '/user/class-schedule' },
    { label: 'AI智能出题', icon: 'i-lucide-brain', to: '/user/topic' },
    { label: '作业发布', icon: 'i-lucide-clipboard-list', to: '/user/assignment' },
    { label: '学情分析', icon: 'i-lucide-bar-chart-3', to: '/user/data' },
    { label: 'PPT工具', icon: 'i-lucide-presentation', to: '/user/ppt' },
  ]

  return {
    stats,
    scoreDistOption,
    trendOption,
    quickActions,
  }
}
