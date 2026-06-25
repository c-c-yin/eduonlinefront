import { get, post, put, del, cancelRequest } from '@/utils/request'
import { normalizePageParams } from './usePagination'
import type { Paper, PaperQuery, PageResult, GeneratePaperParams } from '@/types'

export interface TeacherPaperForm {
  paperId?: number
  paperName: string
  paperType: number
  paperDesc?: string
  subjectId: number
  gradeId?: number
  versionId?: number
  volumeId?: number
  topicId?: number
  duration: number
  difficulty?: number
  totalScore?: number
  totalQuestion?: number
  questionList?: any[]
  remark?: string
}

export function useTeacherPaperApi() {
  const getMyPaperList = (params: PaperQuery): Promise<PageResult<Paper>> => {
    const normalized = normalizePageParams(params, 'paperList')
    return get('/teacher/paper/list', normalized, { requestKey: 'teacher-paper-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getPaperDetail = (paperId: number): Promise<Paper> => {
    return get(`/teacher/paper/${paperId}`, {}, { requestKey: `teacher-paper-${paperId}` })
      .then((res: any) => res?.data)
  }

  const createPaper = (data: TeacherPaperForm): Promise<any> => {
    return post('/teacher/paper', data, { requestKey: 'teacher-paper-create' })
  }

  const updatePaper = (data: TeacherPaperForm): Promise<any> => {
    return put('/teacher/paper', data, { requestKey: 'teacher-paper-update' })
  }

  const deletePaper = (paperId: number): Promise<any> => {
    return del(`/teacher/paper/${paperId}`, { requestKey: `teacher-paper-delete-${paperId}` })
  }

  const generatePaper = (params: GeneratePaperParams): Promise<any> => {
    return post('/teacher/paper/generate', params, { requestKey: 'teacher-paper-generate' })
  }

  const cancelTeacherPaperRequests = () => {
    cancelRequest('teacher-paper-list')
    cancelRequest('teacher-paper-create')
    cancelRequest('teacher-paper-update')
    cancelRequest('teacher-paper-generate')
  }

  return {
    getMyPaperList,
    getPaperDetail,
    createPaper,
    updatePaper,
    deletePaper,
    generatePaper,
    cancelTeacherPaperRequests
  }
}
