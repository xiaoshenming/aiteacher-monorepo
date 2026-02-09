// --- Navigation ---

export type UserRole = '0' | '1' | '2' | '3' | '4'

export type RoleKey = 'student' | 'regular' | 'teacher' | 'admin' | 'superadmin'

export interface DashboardNavItem {
  label: string
  icon?: string
  to?: string
  badge?: string
  defaultOpen?: boolean
  type?: string
  exact?: boolean
  target?: string
  children?: DashboardNavItem[]
  onSelect?: () => void
}

// --- Stats ---

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation?: number
  formatter?: (value: number) => string
}

// --- Notifications ---

export interface NotificationSender {
  name: string
  email?: string
  avatar?: { src: string, alt?: string }
}

export interface DashboardNotification {
  id: number
  unread?: boolean
  sender: NotificationSender
  body: string
  date: string
}

// --- Members ---

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: { src: string, alt?: string }
}

// --- Sales / Orders ---

export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}
