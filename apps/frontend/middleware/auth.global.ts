export default defineNuxtRouteMiddleware(async (to) => {
  // Public pages that don't require authentication
  const publicPages = ['/', '/login', '/error', '/404']
  const isPublic = publicPages.includes(to.path)
    || to.path.startsWith('/#')
    || to.path.startsWith('/showcase')

  if (isPublic) return

  const store = useUserStore()
  const config = useRuntimeConfig()

  // Try to restore token from cookie if store is empty
  store.restoreFromCookie()

  // No token at all - redirect to login
  if (!store.token) {
    return navigateTo('/login')
  }

  // Skip API call if we already have user info loaded
  if (store.userInfo.id) {
    return checkRoleAccess(to.path, store.userInfo.role)
  }

  // Validate token with backend /status API
  try {
    const response = await $fetch<{
      code: number
      data?: {
        loggedIn: boolean
        user: { id: string, name: string, email: string, role: string, avatar?: string }
      }
    }>('/status', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        deviceType: 'pc',
        Authorization: `Bearer ${store.token}`,
      },
    })

    if (response.code === 200 && response.data?.loggedIn) {
      const user = response.data.user

      // Update user info in store
      store.setUserInfo({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
      })

      return checkRoleAccess(to.path, user.role)
    }
    else {
      // Token invalid or expired
      store.logout()
      return navigateTo('/login')
    }
  }
  catch {
    // Network error or server down - redirect to login
    store.logout()
    return navigateTo('/login')
  }
})

function checkRoleAccess(path: string, role: string) {
  const roleAccess: Record<string, string[]> = {
    '4': ['/superadmin', '/admin', '/user', '/student', '/home', '/dashboard'],
    '3': ['/admin', '/user', '/student', '/home', '/dashboard'],
    '2': ['/user', '/dashboard'],
    '1': ['/home', '/dashboard'],
    '0': ['/student', '/dashboard'],
  }

  const protectedPrefixes = ['/student', '/user', '/admin', '/superadmin', '/home', '/dashboard']
  const needsRoleCheck = protectedPrefixes.some(p => path.startsWith(p))

  if (needsRoleCheck) {
    const allowedPrefixes = roleAccess[role] || ['/dashboard']
    const hasAccess = allowedPrefixes.some(prefix => path.startsWith(prefix))
    if (!hasAccess) {
      return navigateTo('/error')
    }
  }
}
