import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    const tokenCookie = useCookie('jwt_token', {
      maxAge: 60 * 60 * 24 * 7,
    })
    tokenCookie.value = newToken
  }

  function logout() {
    token.value = ''
    const tokenCookie = useCookie('jwt_token')
    tokenCookie.value = ''
  }

  return {
    token,
    isLoggedIn,
    setToken,
    logout,
  }
}, {
  persist: {
    key: 'aiteacher-user',
  },
})
