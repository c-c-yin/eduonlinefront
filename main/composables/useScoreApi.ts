import { get, post, cancelRequest } from '@/utils/request'
import type { PageResult } from '@/types'

/**
 * 成绩记录
 */
export interface ScoreRecord {
  homeworkId: number
  homeworkName: string
  homeworkType: number
  homeworkSource: number
  subjectName: string
  className: string
  classId: number
  totalScore: number
  avgScore: number
  studentCount: number
  scoredCount: number
  createTime: string
  status: number
}

/**
 * 逐题打分 - 学生维度
 */
export interface ScoreStudent {
  studentId: number
  studentNo: string
  studentName: string
  className: string
  totalScore: number
  scoreList: number[]           // 每道题的得分
  knowledgeScoreList: KnowledgeScoreItem[]  // 知识点维度得分
}

/**
 * 逐题打分 - 试题信息
 */
export interface ScoreQuestion {
  questionId: number
  questionType: number
  questionTypeName: string
  difficulty: number
  maxScore: number
  knowledgeName: string         // 关联知识点
  sort: number
}

/**
 * 知识点得分
 */
export interface KnowledgeScoreItem {
  knowledgeName: string
  knowledgeScore: number
  knowledgeTotal: number
}

/**
 * 成绩详情（含学生和试题信息）
 */
export interface ScoreDetail {
  homeworkId: number
  homeworkName: string
  totalScore: number
  questions: ScoreQuestion[]
  students: ScoreStudent[]
  classes: { classId: number; className: string }[]
}

/**
 * 学生成绩查看
 */
export interface StudentScoreRecord {
  homeworkId: number
  homeworkName: string
  homeworkType: number
  homeworkSource: number
  subjectName: string
  totalScore: number
  myScore: number
  avgScore: number
  createTime: string
  knowledgeList: KnowledgeScoreItem[]
}

/**
 * 成绩修改日志
 */
export interface ScoreLog {
  logId: number
  scoreId: number
  homeworkId: number
  studentId: number
  studentName: string
  oldScore: number | null
  newScore: number | null
  changeType: string
  changeReason: string
  operator: string
  operTime: string
}

/**
 * 学期加权汇总记录
 */
export interface SemesterScoreSummary {
  homeworkId: number
  homeworkName: string
  homeworkType: number
  homeworkTypeName: string
  totalScore: number
  avgScore: number
  weight: number
  weightedScore: number
  createTime: string
}

/**
 * 学期汇总结果
 */
export interface SemesterSummaryResult {
  yearId: number
  yearName: string
  semester: number
  semesterName: string
  classId: number
  className: string
  records: SemesterScoreSummary[]
  totalWeight: number
  weightedAvg: number
  studentCount: number
}

/**
 * 成绩管理API
 */
export function useScoreApi() {

  /**
   * 教师端 - 获取成绩记录列表
   */
  const getScoreList = (params: {
    pageNum?: number
    pageSize?: number
    classId?: number
    subjectId?: number
    homeworkType?: number
    homeworkName?: string
  }): Promise<PageResult<ScoreRecord>> => {
    return get('/teacher/score/list', params, { requestKey: 'teacher-score-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  /**
   * 教师端 - 获取成绩详情（逐题打分页面数据）
   */
  const getScoreDetail = (homeworkId: number): Promise<ScoreDetail> => {
    return get(`/teacher/score/detail/${homeworkId}`, {}, { requestKey: `teacher-score-detail-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  /**
   * 教师端 - 批量保存逐题打分
   */
  const batchSaveScoreDetail = (homeworkId: number, scores: {
    studentId: number
    scoreList: number[]
  }[]): Promise<any> => {
    return post(`/teacher/score/batchSave/${homeworkId}`, scores, { requestKey: `teacher-score-batch-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  /**
   * 教师端 - 获取任教班级列表
   */
  const getTeacherClasses = (): Promise<{ classId: number; className: string }[]> => {
    return get('/teacher/score/classes', {}, { requestKey: 'teacher-score-classes' })
      .then((res: any) => res?.data || [])
  }

  /**
   * 教师端 - 获取成绩修改日志
   */
  const getScoreLogs = (homeworkId: number, params?: {
    pageNum?: number
    pageSize?: number
  }): Promise<PageResult<ScoreLog>> => {
    return get(`/teacher/score/logs/${homeworkId}`, params, { requestKey: `teacher-score-logs-${homeworkId}` })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  /**
   * 教师端 - 获取学期加权汇总
   */
  const getSemesterSummary = (params: {
    yearId: number
    semester: number
    classId?: number
    subjectId?: number
  }): Promise<SemesterSummaryResult> => {
    return get('/teacher/score/semester-summary', params, { requestKey: 'teacher-score-semester' })
      .then((res: any) => res?.data)
  }

  /**
   * 学生端 - 获取我的成绩列表
   */
  const getMyScoreList = (params: {
    pageNum?: number
    pageSize?: number
    subjectId?: number
  }): Promise<PageResult<StudentScoreRecord>> => {
    return get('/student/score/list', params, { requestKey: 'student-score-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  /**
   * 学生端 - 获取我的成绩详情
   */
  const getMyScoreDetail = (homeworkId: number): Promise<StudentScoreRecord> => {
    return get(`/student/score/detail/${homeworkId}`, {}, { requestKey: `student-score-detail-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  const cancelScoreRequests = () => {
    cancelRequest('teacher-score-list')
  }

  return {
    getScoreList,
    getScoreDetail,
    batchSaveScoreDetail,
    getTeacherClasses,
    getScoreLogs,
    getSemesterSummary,
    getMyScoreList,
    getMyScoreDetail,
    cancelScoreRequests
  }
}