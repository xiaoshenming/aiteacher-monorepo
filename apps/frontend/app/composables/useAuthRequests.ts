import type { AuthRequest, AuthRequestsResponse } from '~/types/auth'

export function useAuthRequests() {
  const { apiFetch } = useApi()

  async function fetchRequests(pageIndex = 1, pageSize = 10) {
    const res = await apiFetch<AuthRequestsResponse>(`authentication/requests?pageIndex=${pageIndex}&pageSize=${pageSize}`)
    return res.data
  }

  async function approveRequest(id: number) {
    await apiFetch(`authentication/approve/${id}/async`, { method: 'POST' })
  }

  async function rejectRequest(id: number) {
    await apiFetch(`authentication/reject/${id}/async`, { method: 'POST' })
  }

  async function deleteRequest(id: number) {
    await apiFetch(`authentication/delete/${id}/async`, { method: 'POST' })
  }

  async function getCount() {
    const res = await apiFetch<{ code: number, data: { count: number } }>('authentication/count')
    return res.data?.count || 0
  }

  return {
    fetchRequests,
    approveRequest,
    rejectRequest,
    deleteRequest,
    getCount,
  }
}
