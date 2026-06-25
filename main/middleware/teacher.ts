export default defineNuxtRouteMiddleware((to, from) => {
  const userStore = useUserStore()
  
  if (!userStore.isLoggedIn) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
  
  if (userStore.userType !== 'teacher') {
    return navigateTo({ path: '/profile', query: { error: 'unauthorized' } })
  }
})
