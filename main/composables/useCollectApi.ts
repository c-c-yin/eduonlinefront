import { get, post, del, cancelRequest } from '@/utils/request'
import type { Collect, PageResult, PageQuery } from '@/types'

export function useCollectApi() {
  const getCollectList = (params: PageQuery): Promise<PageResult<Collect>> => {
    return get('/collect/list', params, { requestKey: 'collect-list' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  const addCollect = (data: { videoId: number; videoType: string }): Promise<Collect> => {
    return post('/collect', data, { requestKey: `collect-add-${data.videoId}-${data.videoType}` }).then((res: any) => res?.data)
  }

  const removeCollect = (videoId: number, videoType: string): Promise<void> => {
    return del(`/collect/${videoId}/${videoType}`, { requestKey: `collect-remove-${videoId}-${videoType}` })
  }

  const checkCollected = (videoId: number, videoType: string): Promise<boolean> => {
    return get(`/collect/check/${videoId}/${videoType}`, {}, { requestKey: `collect-check-${videoId}-${videoType}` }).then((res: any) => res?.data || false)
  }

  const toggleCollect = async (videoId: number, videoType: string): Promise<{ collected: boolean; collectId?: number }> => {
    const isCollected = await checkCollected(videoId, videoType)
    if (isCollected) {
      await removeCollect(videoId, videoType)
      return { collected: false }
    }
    const result = await addCollect({ videoId, videoType })
    return { collected: true, collectId: result?.collectId }
  }

  const cancelCollectRequests = () => {
    cancelRequest('collect-list')
  }

  return {
    getCollectList,
    addCollect,
    removeCollect,
    checkCollected,
    toggleCollect,
    cancelCollectRequests
  }
}