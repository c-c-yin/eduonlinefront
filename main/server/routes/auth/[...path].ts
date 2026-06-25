export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) || 'http://localhost:8080'
  const path = event.context.params?.path || ''
  const method = event.method
  const body = method !== 'GET' ? await readBody(event).catch(() => undefined) : undefined

  const headers: Record<string, string> = {}
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  return await $fetch(`${baseURL}/auth/${path}`, {
    method: method as any,
    body,
    headers
  })
})