export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) || 'http://localhost:8080'
  return await $fetch(`${baseURL}/auth/logout`, {
    method: 'DELETE',
    headers: {
      'Authorization': event.headers.get('Authorization') || ''
    }
  })
})