import { get, post, put, del, cancelRequest } from '@/utils/request'
import type { PageResult, PageQuery } from '@/types'

export interface EduHomework {
  homeworkId: number
  homeworkName: string
  homeworkType: number
  homeworkSource: number
  paperId: number
  paperName: string
  stageId: number
  subjectId: number
  subjectName: string
  gradeId: number
  gradeName: string
  versionId: number
  volumeId: number
  totalScore: number
  knowledgeJson: string
  knowledgeList: HomeworkKnowledge[]
  content: string
  questionCount: number
  weight: number
  academicYearId: number
  semester: number
  publisherType: number
  publisherId: number
  orgId: number
  publishScope: number
  classIds: number[]
  publishMode: number
  tierConfig: string
  status: number
  isTemplate: number
  templateName: string
  remark: string
  isOwner: boolean
  submitCount: number
  studentCount: number
  avgScore: number
  createTime: string
  updateTime: string
  myScore?: number
}

export interface HomeworkKnowledge {
  knowledge_id: number
  knowledge_name: string
  score: number
}

export interface HomeworkScore {
  scoreId: number
  homeworkId: number
  studentId: number
  studentNo: string
  studentName: string
  classId: number
  className: string
  score: number
  scoreList: number[]
  knowledgeList: ScoreKnowledge[]
  sourceType: number
  submitTime: string
}

export interface ScoreKnowledge {
  knowledgeName: string
  knowledgeScore: number
  knowledgeTotal: number
}

export interface TeacherClass {
  id: number
  teacherId: number
  classId: number
  className: string
  gradeName: string
  stageName: string
}

export function useHomeworkApi() {
  const getTeacherHomeworkList = (params: any): Promise<PageResult<EduHomework>> => {
    return get('/teacher/homework/list', params, { requestKey: 'teacher-homework-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getTeacherHomeworkDetail = (id: number): Promise<EduHomework> => {
    return get(`/teacher/homework/${id}`, {}, { requestKey: `teacher-homework-${id}` })
      .then((res: any) => res?.data)
  }

  const createHomework = (data: any): Promise<any> => {
    return post('/teacher/homework', data, { requestKey: 'teacher-homework-create' })
  }

  const updateHomework = (data: any): Promise<any> => {
    return put('/teacher/homework', data, { requestKey: 'teacher-homework-update' })
  }

  const deleteHomework = (id: number): Promise<any> => {
    return del(`/teacher/homework/${id}`, { requestKey: `teacher-homework-delete-${id}` })
  }

  const publishHomework = (id: number): Promise<any> => {
    return put(`/teacher/homework/publish/${id}`, {}, { requestKey: `teacher-homework-publish-${id}` })
  }

  const closeHomework = (id: number): Promise<any> => {
    return put(`/teacher/homework/close/${id}`, {}, { requestKey: `teacher-homework-close-${id}` })
  }

  const getScoreSheet = (homeworkId: number): Promise<HomeworkScore[]> => {
    return get(`/teacher/homework/sheet/${homeworkId}`, {}, { requestKey: `teacher-homework-sheet-${homeworkId}` })
      .then((res: any) => res?.data || [])
  }

  const batchSaveScores = (homeworkId: number, scoreList: any[]): Promise<any> => {
    return post(`/teacher/homework/batchSave?homeworkId=${homeworkId}`, scoreList, { requestKey: `teacher-homework-batchsave-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  const downloadTemplate = (homeworkId: number): Promise<Blob> => {
    return post(`/teacher/homework/downloadTemplate/${homeworkId}`, {}, {
      responseType: 'blob',
      requestKey: `teacher-homework-template-${homeworkId}`
    }) as any
  }

  const importScores = (homeworkId: number, formData: FormData): Promise<any> => {
    return post(`/teacher/homework/importScores/${homeworkId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: `teacher-homework-import-${homeworkId}`
    })
  }

  const getMyClasses = (): Promise<TeacherClass[]> => {
    return get('/teacher/homework/getMyClasses', {}, { requestKey: 'teacher-my-classes' })
      .then((res: any) => res?.data || [])
  }

  const getAvailablePapers = (params: { subjectId?: number; versionId?: number; volumeId?: number }): Promise<PageResult<any>> => {
    return get('/teacher/homework/paper/list', params, { requestKey: 'teacher-homework-papers' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getKnowledgeFromPaper = (paperId: number): Promise<HomeworkKnowledge[]> => {
    return get(`/teacher/homework/paper/${paperId}`, {}, { requestKey: `teacher-paper-knowledge-${paperId}` })
      .then((res: any) => res?.data || [])
  }

  const getPaperQuestionsForScore = (homeworkId: number): Promise<any> => {
    return get(`/teacher/homework/paperQuestions/${homeworkId}`, {}, { requestKey: `teacher-paper-questions-${homeworkId}` })
      .then((res: any) => res?.data || { questions: [], students: [] })
  }

  const getKnowledgeTree = (params: { volumeId?: number; subjectId?: number }): Promise<any> => {
    return get('/teacher/homework/getKnowledgeTree', params, { requestKey: 'teacher-knowledge-tree' })
      .then((res: any) => res?.data)
  }

  const getStudentHomeworkList = (params: any): Promise<PageResult<EduHomework>> => {
    return get('/user/homework/list', params, { requestKey: 'student-homework-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getStudentHomeworkDetail = (id: number): Promise<EduHomework> => {
    return get(`/user/homework/${id}`, {}, { requestKey: `student-homework-${id}` })
      .then((res: any) => res?.data)
  }

  const createStudentPractice = (paperId: number): Promise<any> => {
    return post(`/user/homework/createPractice?paperId=${paperId}`, {}, { requestKey: 'student-homework-practice' })
  }

  const submitSelfScore = (homeworkId: number, answers: any[]): Promise<any> => {
    return post(`/user/homework/submitSelfScore/${homeworkId}`, answers, { requestKey: `student-homework-submit-${homeworkId}` })
  }

  const getStudentPaperList = (params: any): Promise<PageResult<any>> => {
    return get('/user/homework/paper/list', params, { requestKey: 'student-homework-papers' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getStudentPaperDetail = (paperId: number): Promise<any> => {
    return get(`/user/homework/paper/${paperId}`, {}, { requestKey: `student-homework-paper-${paperId}` })
      .then((res: any) => res?.data)
  }

  const cancelHomeworkRequests = () => {
    cancelRequest('teacher-homework-list')
    cancelRequest('student-homework-list')
    cancelRequest('teacher-my-classes')
  }

  const selectQuestions = (params: { subjectId?: number; knowledgeId?: number; questionType?: number; difficulty?: number; limit?: number }): Promise<any[]> => {
    return get('/teacher/homework/selectQuestions', params, { requestKey: 'teacher-select-questions' })
      .then((res: any) => res?.data || [])
  }

  const getHomeworkQuestions = (homeworkId: number): Promise<any[]> => {
    return get(`/teacher/homework/questions/${homeworkId}`, {}, { requestKey: `teacher-homework-questions-${homeworkId}` })
      .then((res: any) => res?.data || [])
  }

  const saveHomeworkQuestions = (homeworkId: number, questionList: any[]): Promise<any> => {
    return post(`/teacher/homework/saveQuestions/${homeworkId}`, questionList, { requestKey: `teacher-save-questions-${homeworkId}` })
  }

  const smartSelectQuestions = (params: { subjectId: number; totalCount?: number; difficulty?: number }): Promise<any[]> => {
    return get('/user/homework/smartSelect', params, { requestKey: 'student-smart-select' })
      .then((res: any) => res?.data || [])
  }

  const getStudentHomeworkQuestions = (homeworkId: number): Promise<any[]> => {
    return get(`/user/homework/questions/${homeworkId}`, {}, { requestKey: `student-homework-questions-${homeworkId}` })
      .then((res: any) => res?.data || [])
  }

  const getStudentScores = (params: any): Promise<PageResult<any>> => {
    return get('/user/homework/scores', params, { requestKey: 'student-scores-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  const getScoreKnowledge = (scoreId: number): Promise<any> => {
    return get(`/user/homework/scores/${scoreId}/knowledge`, {}, { requestKey: `student-score-knowledge-${scoreId}` })
      .then((res: any) => res?.data)
  }

  const getClassStudents = (classId: number, subjectId?: number): Promise<any[]> => {
    return get('/teacher/homework/getClassStudents', { classId, subjectId }, { requestKey: `teacher-class-students-${classId}` })
      .then((res: any) => res?.data || [])
  }

  const assignStudents = (homeworkId: number, studentIds: number[]): Promise<any> => {
    return post(`/teacher/homework/assignStudents/${homeworkId}`, studentIds, { requestKey: `teacher-assign-students-${homeworkId}` })
  }

  const autoTier = (homeworkId: number, params: { referenceHomeworkId?: number; strategy?: string; tierCount?: number }): Promise<any> => {
    return post(`/teacher/homework/autoTier/${homeworkId}`, null, {
      params: { ...params },
      requestKey: `teacher-auto-tier-${homeworkId}`
    })
  }

  const updateTiers = (homeworkId: number, tierConfig: string, studentTierMap: Record<number, number>): Promise<any> => {
    return put(`/teacher/homework/updateTiers/${homeworkId}?tierConfig=${encodeURIComponent(tierConfig)}`, studentTierMap, { requestKey: `teacher-update-tiers-${homeworkId}` })
  }

  const tierPreview = (homeworkId: number): Promise<any[]> => {
    return get(`/teacher/homework/tierPreview/${homeworkId}`, {}, { requestKey: `teacher-tier-preview-${homeworkId}` })
      .then((res: any) => res?.data || [])
  }

  const getTierStats = (homeworkId: number): Promise<any> => {
    return get(`/teacher/homework/tierStats/${homeworkId}`, {}, { requestKey: `teacher-tier-stats-${homeworkId}` })
      .then((res: any) => res?.data)
  }

  /**
   * 获取作业模板列表
   */
  const getTemplateList = (params?: {
    pageNum?: number
    pageSize?: number
    subjectId?: number
  }): Promise<any> => {
    return get('/teacher/homework/template/list', params, { requestKey: 'teacher-homework-template-list' })
      .then((res: any) => ({
        rows: res?.rows || [],
        total: res?.total || 0
      }))
  }

  /**
   * 保存为模板
   */
  const saveAsTemplate = (homeworkId: number, templateName: string): Promise<any> => {
    return put(`/teacher/homework/saveAsTemplate/${homeworkId}`, { templateName })
  }

  /**
   * 从模板创建作业
   */
  const createFromTemplate = (templateId: number): Promise<any> => {
    return post(`/teacher/homework/fromTemplate/${templateId}`)
      .then((res: any) => res?.data)
  }

  /**
   * 删除模板
   */
  const deleteTemplate = (templateId: number): Promise<any> => {
    return del(`/teacher/homework/template/${templateId}`)
  }

  return {
    getTeacherHomeworkList,
    getTeacherHomeworkDetail,
    createHomework,
    updateHomework,
    deleteHomework,
    publishHomework,
    closeHomework,
    getScoreSheet,
    batchSaveScores,
    downloadTemplate,
    importScores,
    getMyClasses,
    getAvailablePapers,
    getKnowledgeFromPaper,
    getPaperQuestionsForScore,
    getKnowledgeTree,
    getStudentHomeworkList,
    getStudentHomeworkDetail,
    createStudentPractice,
    submitSelfScore,
    getStudentPaperList,
    getStudentPaperDetail,
    selectQuestions,
    getHomeworkQuestions,
    saveHomeworkQuestions,
    smartSelectQuestions,
    getStudentHomeworkQuestions,
    getStudentScores,
    getScoreKnowledge,
    getClassStudents,
    assignStudents,
    autoTier,
    updateTiers,
    tierPreview,
    getTierStats,
    getTemplateList,
    saveAsTemplate,
    createFromTemplate,
    deleteTemplate,
    cancelHomeworkRequests
  }
}