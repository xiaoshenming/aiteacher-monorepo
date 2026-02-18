import type { FetchError } from 'ofetch'

export type ErrorType = 'network' | 'api' | 'validation' | 'unknown'

export interface ErrorInfo {
  type: ErrorType
  code: number
  message: string
  statusCode?: number
}

export function useErrorHandler() {
  const toast = useToast()

  function parseApiError(error: any): ErrorInfo {
    if (!error.response) {
      return { type: 'network', code: -1, message: '网络连接失败，请检查网络设置' }
    }

    const fetchError = error as FetchError
    const statusCode = fetchError.response?.status || 500
    const responseData = fetchError.response?._data as Record<string, any> | undefined

    if (responseData?.code !== undefined && responseData?.message) {
      return { type: 'api', code: responseData.code, message: responseData.message, statusCode }
    }

    const messages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权，请先登录',
      403: '权限不足',
      404: '请求的资源不存在',
      429: '请求过于频繁，请稍后再试',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务暂时不可用',
    }

    return { type: 'api', code: statusCode, message: messages[statusCode] || `请求失败 (${statusCode})`, statusCode }
  }

  function handleApiError(error: any, options?: {
    showToast?: boolean
    customMessage?: string
    onError?: (errorInfo: ErrorInfo) => void
  }) {
    const { showToast = true, customMessage, onError } = options || {}
    const errorInfo = parseApiError(error)

    if (customMessage) {
      errorInfo.message = customMessage
    }

    if (showToast) {
      const color = errorInfo.type === 'network' ? 'warning' : 'error'
      toast.add({ title: errorInfo.message, color })
    }

    onError?.(errorInfo)
    return errorInfo
  }

  function handleValidationError(message: string) {
    toast.add({ title: message, color: 'warning' })
    return { type: 'validation' as ErrorType, code: 1007, message }
  }

  function showSuccess(message: string) {
    toast.add({ title: message, color: 'success' })
  }

  function showWarning(message: string) {
    toast.add({ title: message, color: 'warning' })
  }

  function showInfo(message: string) {
    toast.add({ title: message, color: 'info' })
  }

  return {
    parseApiError,
    handleApiError,
    handleValidationError,
    showSuccess,
    showWarning,
    showInfo,
  }
}
