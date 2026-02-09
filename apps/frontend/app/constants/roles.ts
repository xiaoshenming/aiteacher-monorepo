import type { UserRole } from '~/types/dashboard'

/** Role code constants — single source of truth */
export const ROLE = {
  STUDENT: '0' as UserRole,
  REGULAR: '1' as UserRole,
  TEACHER: '2' as UserRole,
  ADMIN: '3' as UserRole,
  SUPER_ADMIN: '4' as UserRole,
} as const

/** Roles allowed to access each route prefix */
export const ROUTE_ROLES: Record<string, UserRole[]> = {
  '/user': [ROLE.TEACHER],
  '/admin': [ROLE.ADMIN],
  '/superadmin': [ROLE.SUPER_ADMIN],
  '/student': [ROLE.STUDENT],
}
