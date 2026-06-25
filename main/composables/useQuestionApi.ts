import { get, post, del, cancelRequest } from '@/utils/request'
import { useApiCache, createCacheKey, cacheConfig } from './useApiCache'
import { normalizePageParams } from './usePagination'
import type {
  Question, QuestionQuery, PageResult, Paper, PaperQuery,
  QuestionCollect, WrongQuestion, WrongQuestionQuery,
  KnowledgeMastery, RecommendRecord, GeneratePaperParams, QuestionStats,
  UserAnswer, PracticeSession, PageQuery
} from '@/types'

export function useQuestionApi() {
  const apiCache = useApiCache()

  const getQuestionList = (params: QuestionQuery): Promise<PageResult<Question>> => {
    const normalized = normalizePageParams(params, 'questionList')
    return get('/user/question/list', normalized, { requestKey: 'question-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getQuestionDetail = (id: number): Promise<Question> => {
    const cacheKey = createCacheKey('question-detail', id)
    const cached = apiCache.get<Question>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/user/question/${id}`, {}, { requestKey: `question-detail-${id}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.questionDetail)
        return data
      })
  }

  const getQuestionsByKnowledge = (knowledgeId: number): Promise<Question[]> => {
    const cacheKey = createCacheKey('questions-by-knowledge', knowledgeId)
    const cached = apiCache.get<Question[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/user/question/listByKnowledge/${knowledgeId}`, {}, { requestKey: `question-by-knowledge-${knowledgeId}` })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.questionDetail)
        return data
      })
  }

  const getQuestionsByTopic = (topicId: number): Promise<Question[]> => {
    const cacheKey = createCacheKey('questions-by-topic', topicId)
    const cached = apiCache.get<Question[]>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/user/question/listByTopic/${topicId}`, {}, { requestKey: `question-by-topic-${topicId}` })
      .then((res: any) => {
        const data = res?.data || []
        apiCache.set(cacheKey, data, cacheConfig.questionDetail)
        return data
      })
  }

  const collectQuestion = (questionId: number): Promise<any> => {
    return post('/user/question/collect', { questionId }, { requestKey: `question-collect-${questionId}` })
  }

  const removeCollect = (questionId: number): Promise<any> => {
    return del(`/user/question/collect/${questionId}`, { requestKey: `question-collect-remove-${questionId}` })
  }

  const checkCollected = (questionId: number): Promise<boolean> => {
    return get(`/user/question/collect/check/${questionId}`, {}, { requestKey: `question-collect-check-${questionId}` })
      .then((res: any) => res?.data || false)
  }

  const getCollectList = (params: any): Promise<PageResult<QuestionCollect>> => {
    const normalized = normalizePageParams(params, 'collectList')
    return get('/user/question/collect/list', normalized, { requestKey: 'question-collect-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getWrongQuestionList = (params: WrongQuestionQuery): Promise<PageResult<WrongQuestion>> => {
    const normalized = normalizePageParams(params, 'wrongList')
    return get('/user/question/wrong/list', normalized, { requestKey: 'question-wrong-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getPaperList = (params: PaperQuery): Promise<PageResult<Paper>> => {
    const normalized = normalizePageParams(params, 'paperList')
    return get('/user/question/paper/list', normalized, { requestKey: 'question-paper-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getPaperDetail = (paperId: number): Promise<Paper> => {
    const cacheKey = createCacheKey('paper-detail', paperId)
    const cached = apiCache.get<Paper>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get(`/user/question/paper/${paperId}`, {}, { requestKey: `question-paper-${paperId}` })
      .then((res: any) => {
        const data = res?.data
        if (data) apiCache.set(cacheKey, data, cacheConfig.questionDetail)
        return data
      })
  }

  const generatePaper = (params: GeneratePaperParams): Promise<any> => {
    return post('/user/question/paper/generate', params, { requestKey: 'question-paper-generate' })
  }

  const getMasteryList = (params: any): Promise<PageResult<KnowledgeMastery>> => {
    const normalized = normalizePageParams(params, 'masteryList')
    return get('/user/question/mastery/list', normalized, { requestKey: 'question-mastery-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getRecommendList = (params: any): Promise<PageResult<RecommendRecord>> => {
    const normalized = normalizePageParams(params, 'recommendList')
    return get('/user/question/recommend/list', normalized, { requestKey: 'question-recommend-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const generateRecommendations = (): Promise<RecommendRecord[]> => {
    return get('/user/question/recommend/generate', {}, { requestKey: 'question-recommend-generate' })
      .then((res: any) => res?.data || [])
  }

  const getQuestionStats = (): Promise<QuestionStats> => {
    const cacheKey = 'question-stats'
    const cached = apiCache.get<QuestionStats>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user/question/stats', {}, { requestKey: 'question-stats' })
      .then((res: any) => {
        const data = res?.data || {}
        apiCache.set(cacheKey, data, cacheConfig.questionList)
        return data
      })
  }

  const startPractice = (params: { count?: number; knowledgeId?: number; videoId?: number }): Promise<PracticeSession> => {
    return post('/user/question/practice/start', params, { requestKey: 'question-practice-start' })
      .then((res: any) => res?.data)
  }

  const getPracticeQuestions = (params: { count?: number; knowledgeId?: number; topicId?: number }): Promise<Question[]> => {
    return get('/user/question/practice/questions', params, { requestKey: 'question-practice-questions' })
      .then((res: any) => res?.data || [])
  }

  const submitAnswer = (data: { questionId: number; answer: string }): Promise<UserAnswer> => {
    return post('/user/question/practice/submit', data, { requestKey: 'question-practice-submit' })
      .then((res: any) => res?.data)
  }

  const invalidateCache = (pattern?: string) => {
    if (pattern) {
      apiCache.clearPattern(pattern)
    } else {
      apiCache.clear()
    }
  }

  const cancelQuestionRequests = () => {
    cancelRequest('question-list')
    cancelRequest('question-collect-list')
    cancelRequest('question-wrong-list')
    cancelRequest('question-paper-list')
    cancelRequest('question-mastery-list')
    cancelRequest('question-recommend-list')
    cancelRequest('question-stats')
    cancelRequest('question-practice-questions')
  }

  return {
    getQuestionList,
    getQuestionDetail,
    getQuestionsByKnowledge,
    getQuestionsByTopic,
    collectQuestion,
    removeCollect,
    checkCollected,
    getCollectList,
    getWrongQuestionList,
    getPaperList,
    getPaperDetail,
    generatePaper,
    getMasteryList,
    getRecommendList,
    generateRecommendations,
    getQuestionStats,
    startPractice,
    getPracticeQuestions,
    submitAnswer,
    invalidateCache,
    cancelQuestionRequests
  }
}