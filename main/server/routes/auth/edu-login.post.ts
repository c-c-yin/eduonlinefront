export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) || 'http://localhost:8080'
  const body = await readBody(event)
  return await $fetch(`${baseURL}/auth/edu-login`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json'
    }
  })
})