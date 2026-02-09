import { defineStore } from 'pinia'

export interface UserInfo {
  id: string | null
  name: string
  email: string
  role: string
  avatar: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref<UserInfo>({
    id: null,
    name: '',
    email: '',
    role: '',
    avatar: '',
  })

  const isLoggedIn = computed(() => !!token.value)

  // Role helpers
  const roleLabel = computed(() => {
    const map: Record<string, string> = {
      '0': '学生',
      '1': '普通用户',
      '2': '教师',
      '3': '管理员',
      '4': '超级管理员',
    }
    return map[userInfo.value.role] || '未知'
  })

  const roleHome = computed(() => {
    const map: Record<string, string> = {
      '0': '/student',
      '1': '/home',
      '2': '/user',
      '3': '/admin',
      '4': '/superadmin',
    }
    return map[userInfo.value.role] || '/dashboard'
  })

  function setToken(newToken: string) {
    token.value = newToken
    const tokenCookie = useCookie('jwt_token', {
      maxAge: 60 * 60 * 24 * 7,
    })
    tokenCookie.value = newToken
  }

  function setUserInfo(info: Partial<UserInfo>) {
    userInfo.value = { ...userInfo.value, ...info }
  }

  function logout() {
    token.value = ''
    userInfo.value = { id: null, name: '', email: '', role: '', avatar: '' }
    const tokenCookie = useCookie('jwt_token')
    tokenCookie.value = null
  }

  // Restore token from cookie if store is empty (e.g. after page refresh before persist hydrates)
  function restoreFromCookie() {
    if (!token.value) {
      const tokenCookie = useCookie('jwt_token')
      if (tokenCookie.value) {
        token.value = tokenCookie.value
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    roleLabel,
    roleHome,
    setToken,
    setUserInfo,
    logout,
    restoreFromCookie,
  }
}, {
  persist: {
    key: 'aiteacher-user',
  },
})
