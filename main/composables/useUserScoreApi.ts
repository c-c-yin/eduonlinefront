import { get, del, cancelRequest } from '@/utils/request'
import type { PageResult, UserScore, UserScoreQuery } from '@/types'

export function useUserScoreApi() {
  const getScoreList = (params: UserScoreQuery): Promise<PageResult<UserScore>> => {
    return get('/userScore/list', params, { requestKey: 'score-list' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  const getScoreDetail = (scoreId: number): Promise<UserScore> => {
    return get(`/userScore/${scoreId}`, {}, { requestKey: `score-detail-${scoreId}` }).then((res: any) => res?.data)
  }

  const getScoreStats = (): Promise<{ totalScore: number; monthScore: number; todayScore: number }> => {
    return get('/userScore/stats', {}, { requestKey: 'score-stats' }).then((res: any) => res?.data || { totalScore: 0, monthScore: 0, todayScore: 0 }).catch(() => ({ totalScore: 0, monthScore: 0, todayScore: 0 }))
  }

  const deleteScore = (scoreId: number): Promise<void> => {
    return del(`/userScore/${scoreId}`, { requestKey: `score-delete-${scoreId}` })
  }

  const cancelScoreRequests = () => {
    cancelRequest('score-list')
    cancelRequest('score-stats')
  }

  return {
    getScoreList,
    getScoreDetail,
    getScoreStats,
    deleteScore,
    cancelScoreRequests
  }
}