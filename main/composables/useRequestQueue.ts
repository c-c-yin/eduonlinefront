interface QueuedRequest {
  id: string
  fn: () => Promise<any>
  resolve: (value: any) => void
  reject: (error: any) => void
}

export function useRequestQueue(maxConcurrent = 5) {
  const queue: QueuedRequest[] = []
  let running = 0

  const run = async <T>(fn: () => Promise<T>): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const task = async () => {
        running++
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          running--
          processNext()
        }
      }

      if (running < maxConcurrent) {
        task()
      } else {
        queue.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 11),
          fn: task as () => Promise<any>
        })
      }
    })
  }

  const processNext = () => {
    if (queue.length > 0 && running < maxConcurrent) {
      const next = queue.shift()
      if (next) {
        next.fn()
      }
    }
  }

  const clear = () => {
    queue.length = 0
  }

  const getQueueLength = () => queue.length

  const getRunningCount = () => running

  return {
    run,
    clear,
    getQueueLength,
    getRunningCount
  }
}

export function useConcurrentControl() {
  const videoQueue = useRequestQueue(3)
  const uploadQueue = useRequestQueue(2)
  const generalQueue = useRequestQueue(5)

  return {
    videoQueue,
    uploadQueue,
    generalQueue,

    runVideoRequest: <T>(fn: () => Promise<T>) => videoQueue.run(fn),
    runUploadRequest: <T>(fn: () => Promise<T>) => uploadQueue.run(fn),
    runGeneralRequest: <T>(fn: () => Promise<T>) => generalQueue.run(fn),

    clearAll: () => {
      videoQueue.clear()
      uploadQueue.clear()
      generalQueue.clear()
    }
  }
}