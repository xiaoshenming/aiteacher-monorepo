import type { FetchError, FetchOptions } from 'ofetch'

interface ApiOptions extends FetchOptions {
  showError?: boolean
  errorMessage?: string
}

export function useApi() {
  const config = useRuntimeConfig()
  const userStore = useUserStore()
  const { handleApiError } = useErrorHandler()

  function buildHeaders(options: ApiOptions): Record<string, string> {
    const headers: Record<string, string> = {
      deviceType: 'pc',
      ...(options.headers as Record<string, string> || {}),
    }
    if (userStore.token) {
      headers.Authorization = `Bearer ${userStore.token}`
    }
    return headers
  }

  function handleError(error: unknown, showError: boolean, errorMessage?: string): never {
    if ((error as FetchError)?.response?.status === 401) {
      userStore.logout()
      navigateTo('/login')
    }
    handleApiError(error, { showToast: showError, customMessage: errorMessage })
    throw error
  }

  async function apiFetch<T>(url: string, options: ApiOptions = {}): Promise<T> {
    const { showError = true, errorMessage, ...fetchOptions } = options
    try {
      return await $fetch<T>(url, {
        baseURL: config.public.apiBase as string,
        ...(fetchOptions as FetchOptions),
        headers: buildHeaders(options),
      })
    }
    catch (error) {
      handleError(error, showError, errorMessage)
    }
  }

  async function cloudFetch<T>(url: string, options: ApiOptions = {}): Promise<T> {
    const { showError = true, errorMessage, ...fetchOptions } = options
    try {
      return await $fetch<T>(url, {
        baseURL: config.public.apiCloud as string,
        ...(fetchOptions as FetchOptions),
        headers: buildHeaders(options),
      })
    }
    catch (error) {
      handleError(error, showError, errorMessage)
    }
  }

  return { apiFetch, cloudFetch }
}
