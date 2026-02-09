import type { FetchError, FetchOptions } from 'ofetch'

export function useApi() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()

  async function apiFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      deviceType: 'pc',
      ...(options.headers as Record<string, string> || {}),
    }

    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`
    }

    try {
      return await $fetch<T>(url, {
        baseURL: config.public.apiBase as string,
        ...options,
        headers,
      })
    }
    catch (error) {
      if ((error as FetchError)?.response?.status === 401) {
        userStore.logout()
        navigateTo('/login')
      }
      throw error
    }
  }

  async function cloudFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      deviceType: 'pc',
      ...(options.headers as Record<string, string> || {}),
    }

    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`
    }

    try {
      return await $fetch<T>(url, {
        baseURL: config.public.apiCloud as string,
        ...options,
        headers,
      })
    }
    catch (error) {
      if ((error as FetchError)?.response?.status === 401) {
        userStore.logout()
        navigateTo('/login')
      }
      throw error
    }
  }

  return {
    apiFetch,
    cloudFetch,
  }
}
