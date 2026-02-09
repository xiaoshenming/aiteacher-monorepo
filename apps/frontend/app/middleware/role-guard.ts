import type { UserRole } from '~/types/dashboard'
import { ROUTE_ROLES } from '~/constants/roles'

export default defineNuxtRouteMiddleware((to) => {
  const userStore = useUserStore()
  const role = userStore.userInfo.role as UserRole

  // Find matching route prefix
  const prefix = Object.keys(ROUTE_ROLES).find(p => to.path.startsWith(p))
  if (prefix) {
    const allowed = ROUTE_ROLES[prefix]!
    if (!allowed.includes(role)) {
      // Redirect to the user's own role home
      return navigateTo(userStore.roleHome)
    }
  }
})
