export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) || 'http://localhost:8080'
  return await $fetch(`${baseURL}/code`)
})