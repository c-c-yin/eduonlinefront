import { get, post, cancelRequest } from '@/utils/request'
import type { Paper, PageResult, PaperQuery } from '@/types'

export interface ScoreDetail {
  questionId: number
  questionType: number
  userAnswer?: string
  isCorrect: number
  score: number
  maxScore: number
}

export interface SubmitScoreParams {
  paperId?: number
  orgId?: number
  details: ScoreDetail[]
}

export interface AnswerSheet {
  sheetId: number
  sheetCode: string
  paperId: number
  paperName: string
  userId: number
  userType: string
  userName: string
  totalScore: number
  correctCount: number
  wrongCount: number
  partialCount: number
  unansweredCount: number
  status: number
  submitTime: string
  detailList?: AnswerDetail[]
}

export interface AnswerDetail {
  detailId: number
  sheetId: number
  questionId: number
  questionType: number
  userAnswer: string
  isCorrect: number
  score: number
  maxScore: number
}

export function usePaperApi() {
  const getPaperList = (params: PaperQuery): Promise<PageResult<Paper>> => {
    return get('/user/paper/list', params, { requestKey: 'paper-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getMyPaperList = (): Promise<PageResult<Paper>> => {
    return get('/user/paper/my', {}, { requestKey: 'paper-my' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getPaperDetail = (paperId: number): Promise<Paper> => {
    return get(`/user/paper/${paperId}`, {}, { requestKey: `paper-detail-${paperId}` })
      .then((res: any) => res?.data)
  }

  const getAnswerSheet = (paperId: number): Promise<AnswerSheet | null> => {
    return get(`/user/paper/${paperId}/answer-sheet`, {}, { requestKey: `paper-answer-${paperId}` })
      .then((res: any) => res?.data || null)
  }

  const generatePaper = (params: any): Promise<any> => {
    return post('/user/paper/generate', params, { requestKey: 'paper-generate' })
  }

  const submitScore = (paperId: number, params: Omit<SubmitScoreParams, 'paperId'>): Promise<AnswerSheet> => {
    return post(`/user/paper/${paperId}/score`, params, { requestKey: `paper-score-${paperId}` })
      .then((res: any) => res?.data)
  }

  const cancelPaperRequests = () => {
    cancelRequest('paper-list')
    cancelRequest('paper-my')
  }

  return {
    getPaperList,
    getMyPaperList,
    getPaperDetail,
    getAnswerSheet,
    generatePaper,
    submitScore,
    cancelPaperRequests
  }
}