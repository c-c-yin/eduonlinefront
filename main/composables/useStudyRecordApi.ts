import { get, post, cancelRequest } from '@/utils/request'

interface StudyProgressData {
  videoId: number
  videoType: string
  watchDuration: number
  lastPosition: number
  progress: number
}

export function useStudyRecordApi() {
  const updateStudyProgress = (data: StudyProgressData): Promise<void> => {
    return post('/studyRecord', data, { requestKey: `study-progress-${data.videoId}` })
  }

  const getStudyRecord = (videoId: number, videoType: string): Promise<any> => {
    return get(`/studyRecord/video/${videoId}/${videoType}`, {}, { requestKey: `study-record-${videoId}` }).then((res: any) => res?.data)
  }

  const getRecentRecords = (limit: number = 10): Promise<any[]> => {
    return get('/studyRecord/recent', { limit }, { requestKey: 'study-recent' }).then((res: any) => res?.rows || [])
  }

  const cancelStudyRequests = () => {
    cancelRequest('study-recent')
  }

  return {
    updateStudyProgress,
    getStudyRecord,
    getRecentRecords,
    cancelStudyRequests
  }
}