import { get } from '@/utils/request'
import { useApiCache } from './useApiCache'

const apiCache = useApiCache()

/**
 * 班级知识点掌握 - 教师端
 */
export interface ClassKnowledgeReport {
  classId: number
  className: string
  subjectId: number
  subjectName: string
  knowledgeList: KnowledgeItem[]
}

export interface KnowledgeItem {
  knowledgeId: number
  knowledgeName: string
  masteryRate: number
  studentCount: number
  correctCount: number
  totalCount: number
}

/**
 * 学生个体知识点掌握明细
 */
export interface StudentKnowledgeDetail {
  studentId: number
  studentNo: string
  studentName: string
  knowledgeList: KnowledgeItem[]
}

/**
 * 学生知识点掌握 - 学生端
 */
export interface StudentKnowledgeReport {
  knowledgeRadar: {
    knowledgeName: string
    masteryRate: number
  }[]
  strongKnowledge: {
    knowledgeId: number
    knowledgeName: string
    masteryRate: number
  }[]
  weakKnowledge: {
    knowledgeId: number
    knowledgeName: string
    masteryRate: number
  }[]
  trendData: {
    date: string
    avgRate: number
  }[]
}

/**
 * 知识点报告API
 */
export function useKnowledgeApi() {

  /**
   * 教师端 - 获取班级知识点掌握报告
   */
  const getClassKnowledgeReport = (params: {
    classId?: number
    subjectId?: number
  }): Promise<ClassKnowledgeReport> => {
    return get('/teacher/knowledge/class-report', params).then((res: any) => res?.data)
  }

  /**
   * 教师端 - 获取班级学生个体知识点明细
   */
  const getClassStudentKnowledge = (params: {
    classId: number
    subjectId?: number
  }): Promise<StudentKnowledgeDetail[]> => {
    return get('/teacher/knowledge/student-list', params).then((res: any) => res?.data || [])
  }

  /**
   * 教师端 - 获取教师任教班级列表（含知识点概览）
   */
  const getTeacherClassesOverview = (): Promise<{
    classId: number
    className: string
    subjectId: number
    subjectName: string
    masteryRate: number
  }[]> => {
    const cacheKey = 'teacher_classes_overview'
    const cached = apiCache.get(cacheKey)
    if (cached) return Promise.resolve(cached as any)

    return get('/teacher/knowledge/classes-overview').then((res: any) => {
      const data = res?.data || []
      apiCache.set(cacheKey, data, 5 * 60)
      return data
    })
  }

  /**
   * 学生端 - 获取我的知识点掌握报告
   */
  const getMyKnowledgeReport = (params?: {
    subjectId?: number
  }): Promise<StudentKnowledgeReport> => {
    return get('/student/knowledge/report', params).then((res: any) => res?.data)
  }

  return {
    getClassKnowledgeReport,
    getClassStudentKnowledge,
    getTeacherClassesOverview,
    getMyKnowledgeReport
  }
}