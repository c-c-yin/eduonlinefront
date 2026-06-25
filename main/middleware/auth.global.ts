export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore()

  // 仅登录/注册/忘记密码页面无需登录
  const publicPages = ['/login', '/register', '/forgot-password']

  if (userStore.isLoggedIn) return

  if (publicPages.includes(to.path)) return

  // 其余所有页面强制跳转登录
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})