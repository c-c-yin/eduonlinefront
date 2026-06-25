import { get, post, cancelRequest } from '@/utils/request'

/**
 * 组题参数
 */
export interface SelfPracticeParams {
  subjectId?: number
  questionTypes?: number[]
  difficulty?: number
  knowledgeIds?: number[]
  questionCount?: number
}

/**
 * 组题生成的作业
 */
export interface SelfPracticeHomework {
  homeworkId: number
  homeworkName: string
  totalScore: number
  questionCount: number
  questions: SelfPracticeQuestion[]
}

/**
 * 组题中的试题
 */
export interface SelfPracticeQuestion {
  questionId: number
  questionType: number
  questionTypeName: string
  difficulty: number
  content: string
  options: string[]
  answer: string
  analysis: string
  maxScore: number
  knowledgeName: string
  sort: number
}

/**
 * 自批答案
 */
export interface SelfScoreAnswer {
  questionId: number
  studentAnswer: string
  isCorrect: boolean
}

/**
 * 自批结果
 */
export interface SelfScoreResult {
  totalScore: number
  correctCount: number
  wrongCount: number
  correctRate: number
  wrongKnowledge: {
    knowledgeName: string
    wrongCount: number
  }[]
}

/**
 * 学生自批练习API
 */
export function useSelfPracticeApi() {

  /**
   * 智能组题
   */
  const smartSelectQuestions = (params: SelfPracticeParams): Promise<SelfPracticeHomework> => {
    return get('/student/practice/smartSelect', params, { requestKey: 'student-practice-smart' })
      .then((res: any) => res?.data)
  }

  /**
   * 手动选题
   */
  const selectQuestions = (params: SelfPracticeParams): Promise<SelfPracticeHomework> => {
    return post('/student/practice/select', params, { requestKey: 'student-practice-select' })
      .then((res: any) => res?.data)
  }

  /**
   * 获取练习详情
   */
  const getPracticeDetail = (homeworkId: number): Promise<SelfPracticeHomework> => {
    return get(`/student/practice/detail/${homeworkId}`, {}, { requestKey: `student-practice-detail-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  /**
   * 提交自批结果
   */
  const submitSelfScore = (homeworkId: number, answers: SelfScoreAnswer[]): Promise<SelfScoreResult> => {
    return post(`/student/practice/submit/${homeworkId}`, answers, { requestKey: `student-practice-submit-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  const cancelRequests = () => {
    cancelRequest('student-practice-smart')
  }

  return {
    smartSelectQuestions,
    selectQuestions,
    getPracticeDetail,
    submitSelfScore,
    cancelRequests
  }
}