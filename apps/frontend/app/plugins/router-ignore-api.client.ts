export default defineNuxtPlugin((nuxtApp) => {
  // 配置 Vue Router 忽略 /api/ 开头的路径
  if (import.meta.client) {
    const router = nuxtApp.$router
    
    // 在客户端路由守卫中忽略 API 路径
    router.beforeEach((to, from, next) => {
      // 如果路径以 /api/ 开头，这不是前端路由
      if (to.path.startsWith('/api/')) {
        // 不处理 API 路径，让浏览器直接请求
        return false
      }
      next()
    })
  }
})
