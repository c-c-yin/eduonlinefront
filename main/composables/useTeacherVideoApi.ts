import { get, post, put, del, cancelRequest } from '@/utils/request'
import type { Video, VideoResource, PageResult, PageQuery } from '@/types'

export interface TeacherVideoQuery extends PageQuery {
  videoName?: string
  status?: number
  auditStatus?: number
  gradeId?: number
  subjectId?: number
}

export interface KnowledgeRelation {
  relationId: number
  videoId: number
  knowledgeId: number
  knowledgeName: string
  isMain: number
}

export interface VisibleTopic {
  topicId: number
  topicName: string
  coverUrl: string
}

export interface VisibleBatch {
  batchId: number
  batchCode: string
  batchName: string
  batchStartTime: string
  batchEndTime: string
  batchStatus: number
}

export function useTeacherVideoApi() {
  const getMyVideoList = (params: TeacherVideoQuery): Promise<PageResult<Video>> => {
    return get('/teacher/video/list', params, { requestKey: 'teacher-video-list' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  const getVideoDetail = (videoId: number): Promise<Video> => {
    return get(`/teacher/video/${videoId}`, {}, { requestKey: `teacher-video-${videoId}` }).then((res: any) => res?.data)
  }

  const publishVideo = (data: Partial<Video>): Promise<void> => {
    return post('/teacher/video', data, { requestKey: 'teacher-video-publish' })
  }

  const updateVideo = (data: Partial<Video>): Promise<void> => {
    return put('/teacher/video', data, { requestKey: 'teacher-video-update' })
  }

  const deleteVideo = (videoId: number): Promise<void> => {
    return del(`/teacher/video/${videoId}`, { requestKey: `teacher-video-delete-${videoId}` })
  }

  const batchDeleteVideo = (videoIds: number[]): Promise<void> => {
    return del('/teacher/video/batch', videoIds, { requestKey: 'teacher-video-batch-delete' })
  }

  const submitForAudit = (videoId: number): Promise<void> => {
    return put(`/teacher/video/submit/${videoId}`, {}, { requestKey: `teacher-video-submit-${videoId}` })
  }

  const republish = (videoId: number): Promise<void> => {
    return put(`/teacher/video/republish/${videoId}`, {}, { requestKey: `teacher-video-republish-${videoId}` })
  }

  /** 教师回收站列表 */
  const getRecycleList = (params: TeacherVideoQuery): Promise<PageResult<Video>> => {
    return get('/teacher/video/recycleList', params, { requestKey: 'teacher-video-recycle' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  /** 恢复视频 */
  const restoreVideo = (videoId: number): Promise<void> => {
    return put(`/teacher/video/restore/${videoId}`, {}, { requestKey: `teacher-video-restore-${videoId}` })
  }

  /** 批量恢复视频 */
  const restoreVideoBatch = (videoIds: number[]): Promise<void> => {
    return put('/teacher/video/restoreBatch', videoIds, { requestKey: 'teacher-video-restore-batch' })
  }

  /** 彻底删除视频（不可恢复） */
  const permanentDeleteVideo = (videoId: number): Promise<void> => {
    return del(`/teacher/video/permanentDelete/${videoId}`, { requestKey: `teacher-video-permanent-${videoId}` })
  }

  /** 批量彻底删除视频（不可恢复） */
  const permanentDeleteVideoBatch = (videoIds: number[]): Promise<void> => {
    return del('/teacher/video/permanentDeleteBatch', videoIds, { requestKey: 'teacher-video-permanent-batch' })
  }

  const cancelTeacherRequests = () => {
    cancelRequest('teacher-video-list')
  }

  const getVisibleTopics = (): Promise<VisibleTopic[]> => {
    return get('/teacher/video/topics', {}, { requestKey: 'teacher-visible-topics' }).then((res: any) => res?.data || [])
  }

  const getVisibleBatches = (): Promise<VisibleBatch[]> => {
    return get('/teacher/video/batches', {}, { requestKey: 'teacher-visible-batches' }).then((res: any) => res?.data || [])
  }

  return {
    getMyVideoList,
    getVideoDetail,
    publishVideo,
    updateVideo,
    deleteVideo,
    batchDeleteVideo,
    submitForAudit,
    republish,
    getRecycleList,
    restoreVideo,
    restoreVideoBatch,
    permanentDeleteVideo,
    permanentDeleteVideoBatch,
    cancelTeacherRequests,
    getVisibleTopics,
    getVisibleBatches
  }
}

export function useTeacherResourceApi() {
  const getResourceList = (videoId: number): Promise<VideoResource[]> => {
    return get(`/teacher/video-resource/resource/${videoId}`, {}, { requestKey: `teacher-resource-${videoId}` }).then((res: any) => res?.data || [])
  }

  const addResource = (data: Partial<VideoResource>): Promise<void> => {
    return post('/teacher/video-resource/resource', data, { requestKey: 'teacher-resource-add' })
  }

  const updateResource = (data: Partial<VideoResource>): Promise<void> => {
    return put('/teacher/video-resource/resource', data, { requestKey: 'teacher-resource-update' })
  }

  const deleteResource = (resourceId: number): Promise<void> => {
    return del(`/teacher/video-resource/resource/${resourceId}`, { requestKey: `teacher-resource-delete-${resourceId}` })
  }

  return {
    getResourceList,
    addResource,
    updateResource,
    deleteResource
  }
}

export function useTeacherKnowledgeApi() {
  const getKnowledgeRelations = (videoId: number): Promise<KnowledgeRelation[]> => {
    return get(`/teacher/video-resource/knowledge/${videoId}`, {}, { requestKey: `teacher-knowledge-${videoId}` }).then((res: any) => res?.data || [])
  }

  const saveKnowledgeRelations = (videoId: number, knowledgeIds: number[], mainKnowledgeId?: number): Promise<void> => {
    return post('/teacher/video-resource/knowledge', { videoId, knowledgeIds, mainKnowledgeId }, { requestKey: `teacher-knowledge-save-${videoId}` })
  }

  return {
    getKnowledgeRelations,
    saveKnowledgeRelations
  }
}