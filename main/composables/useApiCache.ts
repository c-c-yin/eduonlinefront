import { shallowRef } from 'vue'

interface CacheItem<T> {
  data: T
  expire: number
  timestamp: number
}

const MAX_CACHE_SIZE = 200

const globalCache = shallowRef<Map<string, CacheItem<any>>>(new Map())

const pendingRequests = new Map<string, Promise<any>>()

function evictIfNeeded() {
  if (globalCache.value.size <= MAX_CACHE_SIZE) return

  const entries = Array.from(globalCache.value.entries())
    .filter(([, item]) => Date.now() <= item.expire)
    .sort((a, b) => a[1].timestamp - b[1].timestamp)

  const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE)
  const newCache = new Map(globalCache.value)
  for (const [key] of toDelete) {
    newCache.delete(key)
  }
  globalCache.value = newCache
}

function cleanExpired() {
  const now = Date.now()
  const newCache = new Map(globalCache.value)
  for (const [key, item] of newCache.entries()) {
    if (now > item.expire) {
      newCache.delete(key)
    }
  }
  globalCache.value = newCache
}

export function useApiCache() {
  const get = <T>(key: string): T | null => {
    const item = globalCache.value.get(key)
    if (!item) return null

    if (Date.now() > item.expire) {
      const newCache = new Map(globalCache.value)
      newCache.delete(key)
      globalCache.value = newCache
      return null
    }

    return item.data as T
  }

  const set = <T>(key: string, data: T, ttlSeconds = 300): void => {
    cleanExpired()
    const newCache = new Map(globalCache.value)
    newCache.set(key, {
      data,
      expire: Date.now() + ttlSeconds * 1000,
      timestamp: Date.now()
    })
    globalCache.value = newCache
    evictIfNeeded()
  }

  const has = (key: string): boolean => {
    const item = globalCache.value.get(key)
    if (!item) return false

    if (Date.now() > item.expire) {
      const newCache = new Map(globalCache.value)
      newCache.delete(key)
      globalCache.value = newCache
      return false
    }

    return true
  }

  const remove = (key: string): void => {
    const newCache = new Map(globalCache.value)
    newCache.delete(key)
    globalCache.value = newCache
  }

  const clear = (): void => {
    globalCache.value = new Map()
    pendingRequests.clear()
  }

  const clearPattern = (pattern: string): void => {
    const newCache = new Map(globalCache.value)
    for (const key of newCache.keys()) {
      if (key.includes(pattern)) {
        newCache.delete(key)
      }
    }
    globalCache.value = newCache
  }

  const keys = (): string[] => {
    const validKeys: string[] = []
    const now = Date.now()
    for (const [key, item] of globalCache.value.entries()) {
      if (now <= item.expire) {
        validKeys.push(key)
      }
    }
    return validKeys
  }

  const size = (): number => keys().length

  const dedupe = async <T>(key: string, fetcher: () => Promise<T>, ttlSeconds = 300): Promise<T> => {
    const cached = get<T>(key)
    if (cached !== null) return cached

    const existing = pendingRequests.get(key)
    if (existing) return existing as Promise<T>

    const promise = fetcher()
      .then((data) => {
        set(key, data, ttlSeconds)
        return data
      })
      .finally(() => {
        pendingRequests.delete(key)
      })

    pendingRequests.set(key, promise)
    return promise
  }

  return {
    get,
    set,
    has,
    remove,
    clear,
    clearPattern,
    keys,
    size,
    dedupe
  }
}

export function createCacheKey(prefix: string, ...params: any[]): string {
  const paramStr = params
    .filter(p => p !== undefined && p !== null)
    .map(p => {
      if (typeof p === 'object') {
        const sorted = Object.keys(p as Record<string, any>).sort().reduce((obj: Record<string, any>, key: string) => {
          obj[key] = (p as Record<string, any>)[key]
          return obj
        }, {} as Record<string, any>)
        return JSON.stringify(sorted)
      }
      return String(p)
    })
    .join(':')

  return paramStr ? `${prefix}:${paramStr}` : prefix
}

export const cacheConfig = {
  banner: 300,
  category: 600,
  notice: 120,
  globalConfig: 600,
  menu: 600,
  friendlink: 600,
  teacher: 300,
  topic: 300,
  videoList: 120,
  videoDetail: 600,
  questionList: 60,
  questionDetail: 300
}
