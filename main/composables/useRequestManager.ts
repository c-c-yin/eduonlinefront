import { ref, shallowRef } from 'vue'

const pendingRequests = shallowRef<Map<string, AbortController>>(new Map())

export function useRequestManager() {
  const abortAll = () => {
    pendingRequests.value.forEach((controller) => {
      controller.abort()
    })
    pendingRequests.value.clear()
  }

  const abortByKey = (key: string) => {
    const controller = pendingRequests.value.get(key)
    if (controller) {
      controller.abort()
      pendingRequests.value.delete(key)
    }
  }

  const isPending = (key: string) => {
    return pendingRequests.value.has(key)
  }

  const addRequest = (key: string, controller: AbortController) => {
    pendingRequests.value.set(key, controller)
  }

  const removeRequest = (key: string) => {
    pendingRequests.value.delete(key)
  }

  const getPendingCount = () => pendingRequests.value.size

  return {
    abortAll,
    abortByKey,
    isPending,
    addRequest,
    removeRequest,
    getPendingCount
  }
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
    }, delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

const debouncedFunctions = new Map<string, ReturnType<typeof setTimeout>>()

export function useDebounce() {
  const debounceFn = <T extends (...args: any[]) => any>(
    fn: T,
    delay: number,
    key: string
  ): ((...args: Parameters<T>) => void) => {
    return (...args: Parameters<T>) => {
      if (debouncedFunctions.has(key)) {
        clearTimeout(debouncedFunctions.get(key)!)
      }
      const timeoutId = setTimeout(() => {
        fn(...args)
        debouncedFunctions.delete(key)
      }, delay)
      debouncedFunctions.set(key, timeoutId)
    }
  }

  const cancelDebounce = (key: string) => {
    if (debouncedFunctions.has(key)) {
      clearTimeout(debouncedFunctions.get(key)!)
      debouncedFunctions.delete(key)
    }
  }

  const cancelAllDebounce = () => {
    debouncedFunctions.forEach((timeout) => {
      clearTimeout(timeout)
    })
    debouncedFunctions.clear()
  }

  return {
    debounceFn,
    cancelDebounce,
    cancelAllDebounce
  }
}