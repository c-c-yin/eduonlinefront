import { get } from '@/utils/request'
import { useApiCache } from './useApiCache'

const apiCache = useApiCache()

/**
 * 首页仪表盘API
 */
export function useHomeApi() {

  /**
   * 获取首页仪表盘数据（聚合接口）
   */
  function getDashboard() {
    return get('/home/dashboard').then((res: any) => res?.data)
  }

  /**
   * 获取平台统计概览
   */
  function getPlatformStats() {
    const cacheKey = 'home_platform_stats'
    const cached = apiCache.get(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/home/stats').then((res: any) => {
      const data = res?.data
      if (data) {
        apiCache.set(cacheKey, data, 30 * 60) // 缓存30分钟
      }
      return data
    })
  }

  /**
   * 获取最新发布试卷
   */
  function getLatestPapers(pageSize: number = 6) {
    return get('/home/latestPapers', { pageSize }).then((res: any) => res?.data)
  }

  /**
   * 获取热门试题
   */
  function getHotQuestions(pageSize: number = 8) {
    return get('/home/hotQuestions', { pageSize }).then((res: any) => res?.data)
  }

  return {
    getDashboard,
    getPlatformStats,
    getLatestPapers,
    getHotQuestions
  }
}
