import { get } from '@/utils/request'
import { useApiCache } from './useApiCache'

const apiCache = useApiCache()

export interface StudentProfile {
  profileId: number
  studentId: number
  studentName: string
  studentNo: string
  orgName: string
  className: string
  totalWatchSeconds: number
  avgDailyWatchSeconds30: number
  completedVideoCount: number
  totalVideoCount: number
  completionRate: number
  activeDays30: number
  activeDays7: number
  engagementScore: number
  avgMasteryScore: number
  masteryLevelDist: string
  strongKnowledgeCount: number
  weakKnowledgeCount: number
  totalKnowledgeCount: number
  masteryScore: number
  totalAnswerCount: number
  avgCorrectRate: number
  questionTypeAbility: string
  difficultyTolerance: number
  difficultyCorrectRates: string
  answerScore: number
  preferredTimeSlot: string
  avgSessionDurationSeconds: number
  maxConsecutiveDays: number
  collectCount: number
  collectCategoryDist: string
  habitScore: number
  currentWeekAvgScore: number
  lastWeekAvgScore: number
  currentWeekAvgRate: number
  lastWeekAvgRate: number
  scoreTrend: string
  trendScore: number
  recommendReceivedCount: number
  recommendViewedCount: number
  recommendCompletedCount: number
  recommendResponseRate: number
  compositeLabel: string
  compositeScore: number
  labelColor: string
  statDate: string
}

export function useProfileApi() {
  function getMyProfile(): Promise<StudentProfile> {
    const cacheKey = 'student-profile'
    const cached = apiCache.get<StudentProfile>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user/student/profile').then((res: any) => {
      const data = res?.data
      if (data) apiCache.set(cacheKey, data, 5 * 60)
      return data
    })
  }

  return { getMyProfile }
}
