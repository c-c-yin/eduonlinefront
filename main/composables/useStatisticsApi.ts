import { get } from '@/utils/request'

/**
 * 成绩概览
 */
export interface ScoreOverview {
  avgScore: number
  maxScore: number
  minScore: number
  passRate: number
  excellentRate: number
  totalStudents: number
  scoredStudents: number
}

/**
 * 成绩分布
 */
export interface ScoreDistribution {
  range: string
  count: number
  min: number
  max: number
}

/**
 * 成绩趋势
 */
export interface ScoreTrend {
  date: string
  avgScore: number
  passRate: number
}

/**
 * 知识点雷达
 */
export interface KnowledgeRadar {
  knowledgeName: string
  classAvg: number
  gradeAvg?: number
}

/**
 * 知识点详情
 */
export interface KnowledgeDetail {
  knowledgeId: number
  knowledgeName: string
  avgScore: number
  totalScore: number
  correctRate: number
  studentCount: number
}

/**
 * 班级对比
 */
export interface ClassComparison {
  classId: number
  className: string
  avgScore: number
  passRate: number
  excellentRate: number
  studentCount: number
}

/**
 * 统计分析API - 教师端
 */
export function useStatisticsApi() {

  /**
   * 成绩概览
   */
  const getScoreOverview = (params: {
    classId: number
    subjectId?: number
  }): Promise<ScoreOverview> => {
    return get('/teacher/statistics/score/overview', params).then((res: any) => res?.data)
  }

  /**
   * 成绩分布
   */
  const getScoreDistribution = (params: {
    classId: number
    subjectId?: number
  }): Promise<ScoreDistribution[]> => {
    return get('/teacher/statistics/score/distribution', params).then((res: any) => res?.data || [])
  }

  /**
   * 成绩趋势
   */
  const getScoreTrend = (params: {
    classId: number
    subjectId?: number
  }): Promise<ScoreTrend[]> => {
    return get('/teacher/statistics/score/trend', params).then((res: any) => res?.data || [])
  }

  /**
   * 知识点雷达图
   */
  const getKnowledgeRadar = (params: {
    classId: number
    subjectId?: number
  }): Promise<KnowledgeRadar[]> => {
    return get('/teacher/statistics/score/knowledge-radar', params).then((res: any) => res?.data || [])
  }

  /**
   * 知识点得分详情
   */
  const getKnowledgeDetail = (params: {
    classId: number
    subjectId?: number
  }): Promise<KnowledgeDetail[]> => {
    return get('/teacher/statistics/score/knowledge-detail', params).then((res: any) => res?.data || [])
  }

  /**
   * 班级对比分析
   */
  const getClassComparison = (params?: {
    subjectId?: number
  }): Promise<ClassComparison[]> => {
    return get('/teacher/statistics/score/class-comparison', params).then((res: any) => res?.data || [])
  }

  return {
    getScoreOverview,
    getScoreDistribution,
    getScoreTrend,
    getKnowledgeRadar,
    getKnowledgeDetail,
    getClassComparison
  }
}