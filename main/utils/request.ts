import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { getToken, removeToken } from '@/utils/auth'
import type { ApiResponse } from '@/types'

const isServer = typeof window === 'undefined'

const KNOWN_PREFIXES = ['/edu-user', '/auth', '/file', '/code', '/teacher']

function needsEduUserPrefix(url: string): boolean {
  for (const prefix of KNOWN_PREFIXES) {
    if (url.startsWith(prefix)) {
      return false
    }
  }
  return true
}

function getBaseURL(url: string): string {
  const apiBase = (() => {
    if (isServer) {
      try {
        const config = useRuntimeConfig()
        return (config.public.apiBase as string) || 'http://localhost:8080'
      } catch {
        return 'http://localhost:8080'
      }
    }
    return ''
  })()

  if (needsEduUserPrefix(url)) {
    return isServer ? `${apiBase}/edu-user` : '/edu-user'
  }
  return isServer ? apiBase : ''
}

const defaultRetryConfig = {
  retries: 3,
  retryDelay: 1000
}

let isShowing401Dialog = false

function retryInterceptor(error: any) {
  const config = error.config
  if (!config) return Promise.reject(error)

  const perRequestConfig = config._retryConfig
  const maxRetries = perRequestConfig?.retries ?? defaultRetryConfig.retries
  const retryDelay = perRequestConfig?.retryDelay ?? defaultRetryConfig.retryDelay

  config.__retryCount = config.__retryCount || 0
  if (config.__retryCount >= maxRetries) return Promise.reject(error)

  const retryStatusCodes = [408, 429, 500, 502, 503, 504]
  const shouldRetry = (error.response?.status && retryStatusCodes.includes(error.response.status))
    || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
    || (!error.response && error.request)

  if (!shouldRetry) return Promise.reject(error)

  config.__retryCount += 1
  const delay = retryDelay * config.__retryCount

  console.log(`Request failed, retrying... (${config.__retryCount}/${maxRetries}) after ${delay}ms`)

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(service(config))
    }, delay)
  })
}

const service: AxiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.url && !config.url.startsWith('http')) {
      const baseURL = getBaseURL(config.url)
      if (baseURL) {
        config.url = baseURL + config.url
      }
    }

    if (!isServer) {
      const token = getToken()
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data

    if (res.code !== 200) {
      if (!isServer) {
        import('element-plus').then(({ ElMessage, ElMessageBox }) => {
          ElMessage.error(res.msg || '请求失败')

          if (res.code === 401) {
            removeToken()
            if (!isShowing401Dialog) {
              isShowing401Dialog = true
              ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
                confirmButtonText: '重新登录',
                cancelButtonText: '取消',
                type: 'warning'
              }).then(() => {
                isShowing401Dialog = false
                window.location.href = '/login'
              }).catch(() => {
                isShowing401Dialog = false
              })
            }
          }
        }).catch(() => {})
      }

      return Promise.reject(new Error(res.msg || '请求失败'))
    }

    return res as any
  },
  (error: AxiosError) => {
    if (axios.isCancel(error)) {
      console.log('Request was cancelled')
      return Promise.reject(new Error('请求已取消'))
    }

    console.error('Response error:', error)
    if (!isServer) {
      let message = '网络错误'
      if (error.response) {
        switch (error.response.status) {
          case 400:
            message = '请求参数错误'
            break
          case 401:
            message = '未授权，请登录'
            removeToken()
            if (!isShowing401Dialog) {
              isShowing401Dialog = true
              import('element-plus').then(({ ElMessageBox }) => {
                ElMessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
                  confirmButtonText: '重新登录',
                  cancelButtonText: '取消',
                  type: 'warning'
                }).then(() => {
                  isShowing401Dialog = false
                  window.location.href = '/login'
                }).catch(() => {
                  isShowing401Dialog = false
                })
              }).catch(() => {
                isShowing401Dialog = false
              })
            }
            break
          case 403:
            message = '拒绝访问'
            break
          case 404:
            message = '请求地址不存在'
            break
          case 429:
            message = '请求过于频繁，请稍后重试'
            break
          case 500:
            message = '服务器内部错误'
            break
          case 502:
          case 503:
          case 504:
            message = '服务暂时不可用，请稍后重试'
            break
          default:
            message = (error.response.data as any)?.msg || '请求失败'
        }
      } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        message = '请求超时，请检查网络连接'
      } else if (!error.response && error.request) {
        message = '网络连接失败，请检查网络'
      }
      import('element-plus').then(({ ElMessage }) => {
        ElMessage.error(message)
      }).catch(() => {})
    }
    return Promise.reject(error)
  }
)

service.interceptors.response.use(undefined, retryInterceptor)

const activeRequests = new Map<string, AbortController>()

export function cancelRequest(key: string) {
  const controller = activeRequests.get(key)
  if (controller) {
    controller.abort()
    activeRequests.delete(key)
  }
}

export function cancelAllRequests() {
  activeRequests.forEach((controller) => {
    controller.abort()
  })
  activeRequests.clear()
}

export interface RequestOptions extends AxiosRequestConfig {
  showLoading?: boolean
  showError?: boolean
  retries?: number
  retryDelay?: number
  requestKey?: string
  _retryConfig?: {
    retries: number
    retryDelay: number
  }
  msg?: string
}

export function request<T = any>(config: RequestOptions): Promise<T> {
  const { retries, retryDelay, requestKey, ...restConfig } = config || {}

  if (requestKey) {
    cancelRequest(requestKey)
    const controller = new AbortController()
    activeRequests.set(requestKey, controller)
    restConfig.signal = controller.signal
  }

  if (retries !== undefined) {
    restConfig._retryConfig = {
      retries,
      retryDelay: retryDelay ?? defaultRetryConfig.retryDelay
    }
  }

  const promise = service.request<any, T>(restConfig).finally(() => {
    if (requestKey) {
      activeRequests.delete(requestKey)
    }
  })

  return promise
}

export function get<T = any>(url: string, params?: any, config?: RequestOptions): Promise<T> {
  return request<T>({
    method: 'GET',
    url,
    params,
    ...config
  })
}

export function post<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
  return request<T>({
    method: 'POST',
    url,
    data,
    ...config
  })
}

export function put<T = any>(url: string, data?: any, config?: RequestOptions): Promise<T> {
  return request<T>({
    method: 'PUT',
    url,
    data,
    ...config
  })
}

export function del<T = any>(url: string, config?: RequestOptions): Promise<T> {
  return request<T>({
    method: 'DELETE',
    url,
    ...config
  })
}

export default service