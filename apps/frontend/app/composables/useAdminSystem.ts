import type { SystemHealth, SystemStats, AuthRequest, ExtendedStats, MonitorSystemData, MonitorService, MonitorStats } from '~/types/admin'

export function useAdminSystem() {
  const { apiFetch } = useApi()

  async function fetchHealth() {
    return await apiFetch<SystemHealth>('admin/system/health')
  }

  async function fetchStats() {
    return await apiFetch<SystemStats>('admin/system/stats')
  }

  async function fetchAuthRequests() {
    const res = await apiFetch<{ code: number, data: { total: number, requests: any[] } }>('authentication/requests')
    const statusMap: Record<number, string> = { 0: 'pending', 1: 'approved', 2: 'rejected', 3: 'expired' }
    return (res.data?.requests || []).map((r: any) => ({
      ...r,
      user_id: r.teacher_id,
      reason: r.request_message,
      status: statusMap[r.status] || 'pending',
    })) as AuthRequest[]
  }

  async function approveAuth(id: number) {
    return await apiFetch(`authentication/approve/${id}/async`, { method: 'POST' })
  }

  async function rejectAuth(id: number) {
    return await apiFetch(`authentication/reject/${id}/async`, { method: 'POST' })
  }

  async function deleteAuth(id: number) {
    return await apiFetch(`authentication/delete/${id}/async`, { method: 'POST' })
  }

  async function fetchAuthCount() {
    return await apiFetch<{ count: number }>('authentication/count')
  }

  async function fetchExtendedStats() {
    const res = await apiFetch<{ code: number; data: ExtendedStats }>('admin/stats/extended')
    return res.data
  }

  async function fetchMonitorSystem() {
    const res = await apiFetch<{ code: number; data: MonitorSystemData }>('admin/monitor/system')
    return res.data
  }

  async function fetchMonitorServices() {
    const res = await apiFetch<{ code: number; data: { services: MonitorService[] } }>('admin/monitor/services')
    return res.data?.services || []
  }

  async function fetchMonitorStats() {
    const res = await apiFetch<{ code: number; data: MonitorStats }>('admin/monitor/stats')
    return res.data
  }

  return {
    fetchHealth,
    fetchStats,
    fetchAuthRequests,
    approveAuth,
    rejectAuth,
    deleteAuth,
    fetchAuthCount,
    fetchExtendedStats,
    fetchMonitorSystem,
    fetchMonitorServices,
    fetchMonitorStats,
  }
}
