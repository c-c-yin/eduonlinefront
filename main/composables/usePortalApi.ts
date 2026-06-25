import { get, cancelRequest } from '@/utils/request'
import { useApiCache, createCacheKey, cacheConfig } from './useApiCache'
import { normalizePageParams, type PageParams } from './usePagination'
import type { MenuItem, GlobalConfig, Notice, FriendLink, Banner, PageResult, PageQuery } from '@/types'

export function usePortalApi() {
  const apiCache = useApiCache()

  const getMenuList = (userType?: string): Promise<MenuItem[]> => {
    const cacheKey = createCacheKey('menu-list', userType)
    const cached = apiCache.get<MenuItem[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user-menu/list', { userType }, { requestKey: 'portal-menu-list' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.menu)
        return data
      })
  }

  const getMenuTree = (userType?: string): Promise<MenuItem[]> => {
    const cacheKey = createCacheKey('menu-tree', userType)
    const cached = apiCache.get<MenuItem[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user-menu/tree', { userType }, { requestKey: 'portal-menu-tree' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.menu)
        return data
      })
  }

  const getGlobalConfig = (): Promise<Record<string, string>> => {
    const cacheKey = 'global-config-all'
    const cached = apiCache.get<Record<string, string>>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/global-config/all', {}, { requestKey: 'portal-global-config' })
      .then((res: any) => {
        const data = res?.data || {}
        apiCache.set(cacheKey, data, cacheConfig.globalConfig)
        return data
      })
          // 新增：异常捕获 + 兜底空对象，阻断报错冒泡
      .catch((err) => {
        console.warn('获取全局配置接口 404/请求失败：', err)
        return {} as Record<string, string>
      })
  }

  const getConfigByGroup = (groupCode: string): Promise<GlobalConfig[]> => {
    const cacheKey = createCacheKey('config-group', groupCode)
    const cached = apiCache.get<GlobalConfig[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/global-config/group/${groupCode}`, {}, { requestKey: `portal-config-${groupCode}` })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.globalConfig)
        return data
      })
  }

  const getSiteInfo = (): Promise<GlobalConfig[]> => {
    const cacheKey = 'site-info'
    const cached = apiCache.get<GlobalConfig[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/global-config/site-info', {}, { requestKey: 'portal-site-info' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.globalConfig)
        return data
      })
  }

  const getNoticeList = (params: PageQuery): Promise<PageResult<Notice>> => {
    const normalized = normalizePageParams(params, 'noticeList')
    return get('/notice/list', normalized, { requestKey: 'portal-notice-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getNoticeDetail = (id: number): Promise<Notice> => {
    const cacheKey = createCacheKey('notice-detail', id)
    const cached = apiCache.get<Notice>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/notice/${id}`, {}, { requestKey: `portal-notice-${id}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.notice)
        return data
      })
  }

  const getScrollNotices = (): Promise<Notice[]> => {
    const cacheKey = 'scroll-notices'
    const cached = apiCache.get<Notice[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/notice/scroll', {}, { requestKey: 'portal-scroll-notices' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.notice)
        return data
      })
  }

  const getPopupNotices = async (): Promise<Notice[]> => {
    try {
      cancelRequest('portal-popup-notices')
      const cacheKey = 'popup-notices'
      const cached = apiCache.get<Notice[]>(cacheKey)
      if (cached) return cached

      const res: any = await get('/notice/popup', {}, { requestKey: 'portal-popup-notices' })
      const data = res?.data || []
      apiCache.set(cacheKey, data, cacheConfig.notice)
      return data
    } catch {
      return []
    }
  }

  const getTopNotices = (limit: number = 5): Promise<Notice[]> => {
    const cacheKey = createCacheKey('top-notices', limit)
    const cached = apiCache.get<Notice[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/notice/list', { pageNum: 1, pageSize: limit }, { requestKey: 'portal-top-notices' })
      .then((res: any) => {
        const data = res?.rows || []
        apiCache.set(cacheKey, data, cacheConfig.notice)
        return data
      })
  }

  const getFriendLinks = (): Promise<FriendLink[]> => {
    const cacheKey = 'friend-links'
    const cached = apiCache.get<FriendLink[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/friend-link/list', {}, { requestKey: 'portal-friend-links' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.friendlink)
        return data
      })
  }

  const getPartners = (): Promise<FriendLink[]> => {
    const cacheKey = 'partners'
    const cached = apiCache.get<FriendLink[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/friend-link/partners', {}, { requestKey: 'portal-partners' })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.friendlink)
        return data
      })
  }

  const getBannersByPosition = (positionId: number): Promise<Banner[]> => {
    const cacheKey = createCacheKey('banner-pos', positionId)
    const cached = apiCache.get<Banner[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/banner/position/${positionId}`, {}, { requestKey: `portal-banner-pos-${positionId}` })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.banner)
        return data
      })
  }

  const getBannersByCode = async (positionCode: string): Promise<Banner[]> => {
    try {
      const cacheKey = createCacheKey('banner-code', positionCode)
      const cached = apiCache.get<Banner[]>(cacheKey)
      if (cached) return cached

      cancelRequest(`portal-banner-code-${positionCode}`)
      const positionRes: any = await get(`/banner-position/code/${positionCode}`, {}, { requestKey: `portal-banner-code-${positionCode}` })
      const position = positionRes?.data
      if (position && position.positionId) {
        const bannersRes: any = await get(`/banner/position/${position.positionId}`, {}, { requestKey: `portal-banner-pos-${position.positionId}` })
        const data = bannersRes?.data || []
        apiCache.set(cacheKey, data, cacheConfig.banner)
        return data
      }
      return []
    } catch {
      return []
    }
  }

  const getBannerDetail = (bannerId: number): Promise<Banner> => {
    const cacheKey = createCacheKey('banner-detail', bannerId)
    const cached = apiCache.get<Banner>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/banner/${bannerId}`, {}, { requestKey: `portal-banner-${bannerId}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.banner)
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

  const cancelPortalRequests = () => {
    cancelRequest('portal-menu-list')
    cancelRequest('portal-menu-tree')
    cancelRequest('portal-global-config')
    cancelRequest('portal-site-info')
    cancelRequest('portal-notice-list')
    cancelRequest('portal-scroll-notices')
    cancelRequest('portal-popup-notices')
    cancelRequest('portal-top-notices')
    cancelRequest('portal-friend-links')
    cancelRequest('portal-partners')
  }

  return {
    getMenuList,
    getMenuTree,
    getGlobalConfig,
    getConfigByGroup,
    getSiteInfo,
    getNoticeList,
    getNoticeDetail,
    getScrollNotices,
    getPopupNotices,
    getTopNotices,
    getFriendLinks,
    getPartners,
    getBannersByPosition,
    getBannersByCode,
    getBannerDetail,
    invalidateCache,
    cancelPortalRequests
  }
}