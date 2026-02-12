import type { SystemHealth, SystemStats, AuthRequest } from '~/types/admin'

export function useAdminSystem() {
  const { apiFetch } = useApi()

  async function fetchHealth() {
    return await apiFetch<SystemHealth>('admin/system/health')
  }

  async function fetchStats() {
    return await apiFetch<SystemStats>('admin/system/stats')
  }

  async function fetchAuthRequests() {
    return await apiFetch<AuthRequest[]>('authentication/requests')
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

  return {
    fetchHealth,
    fetchStats,
    fetchAuthRequests,
    approveAuth,
    rejectAuth,
    deleteAuth,
    fetchAuthCount,
  }
}
