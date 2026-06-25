import { get, post, cancelRequest } from '@/utils/request'
import { useApiCache, createCacheKey, cacheConfig } from './useApiCache'
import { normalizePageParams, type PageParams } from './usePagination'
import type { Video, VideoQuery, PageResult, VideoResource, PageQuery } from '@/types'

export interface SecurePlayUrl {
  videoId: number
  videoName: string
  playUrl: string
  filePath: string
  coverPath: string
  duration: number
  fileSize: number
}

export function useVideoApi() {
  const apiCache = useApiCache()

  const getCarouselList = (): Promise<Video[]> => {
    const cacheKey = 'carousel-list'
    const cached = apiCache.get<Video[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/vodCourse/carousel/list', {}, { requestKey: 'video-carousel' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.banner)
        return data
      })
  }

  const getCategoryList = () => {
    const cacheKey = 'category-list'
    const cached = apiCache.get(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/vodCourse/category/list', {}, { requestKey: 'video-category' })
      .then((res: any) => {
        const data = res?.data || {}
        apiCache.set(cacheKey, data, cacheConfig.category)
        return data
      })
  }

  const searchVideos = (params: VideoQuery): Promise<PageResult<Video>> => {
    const { pageNum, pageSize, orderBy: orderByField, ...body } = params
    const normalized = normalizePageParams({ pageNum, pageSize }, 'videoList')
    const orderBy = orderByField
    const query: any = { ...normalized }
    if (orderBy) {
      query.orderByColumn = orderBy
      query.isAsc = 'desc'
    }

    const cacheKey = createCacheKey('video-search', body, normalized)
    if (JSON.stringify(body) === '{}') {
      const cached = apiCache.get<PageResult<Video>>(cacheKey)
      if (cached) return Promise.resolve(cached)
    }

    return post('/vodCourse/search', body, { params: query, requestKey: `video-search-${JSON.stringify(body)}` })
      .then((res: any) => {
        const data = { rows: res?.rows || [], total: res?.total || 0 }
        if (JSON.stringify(body) === '{}') {
          apiCache.set(cacheKey, data, cacheConfig.videoList)
        }
        return data
      })
  }

  const getVideoList = (params: VideoQuery): Promise<PageResult<Video>> => {
    const { pageNum, pageSize, orderBy: orderByField, ...body } = params
    const normalized = normalizePageParams({ pageNum, pageSize }, 'videoList')
    const orderBy = orderByField
    const query: any = { ...normalized }
    if (orderBy) {
      query.orderByColumn = orderBy
      query.isAsc = 'desc'
    }

    return post('/vodCourse/search', body, {
      params: query,
      requestKey: `video-list-${JSON.stringify(body)}`
    }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  const getVideoDetail = (id: number): Promise<Video> => {
    const cacheKey = createCacheKey('video-detail', id)
    const cached = apiCache.get<Video>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/vodCourse/view/${id}`, {}, { requestKey: `video-detail-${id}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.videoDetail)
        return data
      })
  }

  const getSecurePlayUrl = (videoId: number): Promise<SecurePlayUrl> => {
    return get(`/vodCourse/play/${videoId}`, {}, { requestKey: `video-play-${videoId}`, retries: 2 })
      .then((res: any) => res?.data)
  }

  const getTeacherList = (params?: any): Promise<any[]> => {
    const normalized = normalizePageParams(params, 'videoList')
    const cacheKey = createCacheKey('teacher-list', normalized)

    if (!params || Object.keys(params).length === 0) {
      const cached = apiCache.get<any[]>(cacheKey)
      if (cached) return Promise.resolve(cached)
    }

    return get('/vodCourse/teacher/list', normalized, { requestKey: 'video-teacher-list' })
      .then((res: any) => {
        const data = res?.rows || []
        if (!params || Object.keys(params).length === 0) {
          apiCache.set(cacheKey, data, cacheConfig.teacher)
        }
        return data
      })
  }

  const getTeacherDetail = (id: number): Promise<any> => {
    const cacheKey = createCacheKey('teacher-detail', id)
    const cached = apiCache.get(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/vodCourse/teacher/view/${id}`, {}, { requestKey: `video-teacher-${id}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.teacher)
        return data
      })
  }

  const getVideoResources = (videoId: number): Promise<VideoResource[]> => {
    return get(`/video-resource/video/${videoId}`, {}, { requestKey: `video-resources-${videoId}` })
      .then((res: any) => res?.data || [])
  }

  const getResourceDetail = (resourceId: number): Promise<VideoResource> => {
    const cacheKey = createCacheKey('resource-detail', resourceId)
    const cached = apiCache.get<VideoResource>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/video-resource/${resourceId}`, {}, { requestKey: `resource-detail-${resourceId}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.videoDetail)
        return data
      })
  }

  const getSecureResourcePlayUrl = (resourceId: number): Promise<{ resourceId: number; resourceName: string; playUrl: string; filePath: string; fileSize: number }> => {
    return get(`/video-resource/play/${resourceId}`, {}, { requestKey: `resource-play-${resourceId}`, retries: 2 })
      .then((res: any) => res?.data)
  }

  const getTopicList = (params?: any): Promise<PageResult<any>> => {
    const normalized = normalizePageParams(params, 'videoList')
    const cacheKey = createCacheKey('topic-list', normalized)

    if (!params || Object.keys(params).length === 0) {
      const cached = apiCache.get<PageResult<any>>(cacheKey)
      if (cached) return Promise.resolve(cached)
    }

    return get('/vodCourse/topic/list', normalized, { requestKey: 'video-topic-list' })
      .then((res: any) => {
        const data = { rows: res?.rows || [], total: res?.total || 0 }
        if (!params || Object.keys(params).length === 0) {
          apiCache.set(cacheKey, data, cacheConfig.topic)
        }
        return data
      })
  }

  const getTopicDetail = (topicId: number): Promise<any> => {
    const cacheKey = createCacheKey('topic-detail', topicId)
    const cached = apiCache.get(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/vodCourse/topic/${topicId}`, {}, { requestKey: `video-topic-${topicId}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.topic)
        return data
      })
  }

  const invalidateCache = (pattern?: string) => {
    if (pattern) {
      apiCache.clearPattern(pattern)
    } else {
      apiCache.clear()
    }
  }

  const cancelVideoRequests = () => {
    cancelRequest('video-carousel')
    cancelRequest('video-category')
    cancelRequest('video-teacher-list')
    cancelRequest('video-topic-list')
  }

  return {
    getCarouselList,
    getCategoryList,
    searchVideos,
    getVideoList,
    getVideoDetail,
    getSecurePlayUrl,
    getTeacherList,
    getTeacherDetail,
    getVideoResources,
    getResourceDetail,
    getSecureResourcePlayUrl,
    getTopicList,
    getTopicDetail,
    invalidateCache,
    cancelVideoRequests
  }
}