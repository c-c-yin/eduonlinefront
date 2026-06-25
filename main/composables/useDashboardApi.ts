import { get } from '@/utils/request'
import { useApiCache } from './useApiCache'
import type { TeacherProfileDetail } from '@/types'

const apiCache = useApiCache()

/**
 * 教师工作台数据类型
 */
export interface TeacherDashboardData {
  // 统计数据
  videoCount: number
  pendingAuditCount: number
  homeworkCount: number
  pendingScoreCount: number
  classCount: number
  studentCount: number
  // 待批改作业
  pendingHomework: {
    homeworkId: number
    homeworkName: string
    className: string
    unsubmittedCount: number
    totalCount: number
    deadline: string
  }[]
  // 视频审核状态
  videoAuditList: {
    videoId: number
    videoName: string
    auditStatus: number
    auditStatusName: string
    createTime: string
  }[]
  // 任教班级知识点掌握
  classKnowledge: {
    classId: number
    className: string
    masteryRate: number
  }[]
  // 最近发布作业
  recentHomework: {
    homeworkId: number
    homeworkName: string
    className: string
    createTime: string
    submitCount: number
    totalCount: number
  }[]
}

/**
 * 学生工作台数据类型
 */
export interface StudentDashboardData {
  // 学习概览
  studyHoursThisWeek: number
  completedQuestions: number
  correctRate: number
  masteredKnowledgeCount: number
  // 继续学习
  lastStudy: {
    videoId: number
    videoName: string
    progress: number
  } | null
  // 待完成作业
  pendingHomework: {
    homeworkId: number
    homeworkName: string
    subjectName: string
    deadline: string
    totalScore: number
  }[]
  // 知识点掌握雷达图
  knowledgeRadar: {
    knowledgeName: string
    masteryRate: number
  }[]
  // 薄弱知识点
  weakKnowledge: {
    knowledgeId: number
    knowledgeName: string
    masteryRate: number
  }[]
}

/**
 * 仪表盘API
 */
export function useDashboardApi() {

  /**
   * 获取教师工作台数据
   */
  function getTeacherDashboard(): Promise<TeacherDashboardData> {
    const cacheKey = 'teacher_dashboard'
    const cached = apiCache.get<TeacherDashboardData>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user/teacher/dashboard').then((res: any) => {
      const data = res?.data
      if (data) apiCache.set(cacheKey, data, 5 * 60) // 缓存5分钟
      return data
    })
  }

  /**
   * 获取学生学习中心数据
   */
  function getStudentDashboard(): Promise<StudentDashboardData> {
    const cacheKey = 'student_dashboard'
    const cached = apiCache.get<StudentDashboardData>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user/student/dashboard').then((res: any) => {
      const data = res?.data
      if (data) apiCache.set(cacheKey, data, 5 * 60) // 缓存5分钟
      return data
    })
  }

  /**
   * 获取教师画像详情
   */
  function getTeacherProfileDetail(): Promise<TeacherProfileDetail> {
    const cacheKey = 'teacher_profile_detail'
    const cached = apiCache.get<TeacherProfileDetail>(cacheKey)
    if (cached) return Promise.resolve(cached)

    return get('/user/teacher/profile-detail').then((res: any) => {
      const data = res?.data
      if (data) apiCache.set(cacheKey, data, 10 * 60) // 缓存10分钟
      return data
    })
  }

  return {
    getTeacherDashboard,
    getStudentDashboard,
    getTeacherProfileDetail
  }
}