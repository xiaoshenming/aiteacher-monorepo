export default defineNuxtRouteMiddleware((_to) => {
  const userStore = useUserStore()

  if (!userStore.isLoggedIn) {
    return navigateTo('/login')
  }
})
