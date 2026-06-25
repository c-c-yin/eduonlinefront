import { get, post, put, del, cancelRequest } from '@/utils/request'
import type { Question, PageResult, PageQuery } from '@/types'

export interface TeacherQuestionQuery extends PageQuery {
  questionType?: number
  difficulty?: number
  subjectId?: number
  gradeId?: number
  versionId?: number
  volumeId?: number
  topicId?: number
  knowledgeIds?: number[]
  status?: number
  auditStatus?: number
  questionCode?: string
  orgId?: number
}

export interface DuplicateCheckParams {
  content: string
  options?: string
  questionType?: number
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean
  duplicates?: Array<{
    questionId: number
    questionCode: string
    questionType: number
    questionContent: string
    similarity: number
  }>
}

export interface WordTaskStatus {
  taskId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  fileName?: string
  queuePosition?: number
  queueSize?: number
  submitTime?: string
  finishTime?: string
  data?: any[]
  errorMessage?: string
}

export interface MinerUTaskStatus {
  taskId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  fileName?: string
  queuePosition?: number
  queueSize?: number
  submitTime?: string
  finishTime?: string
  data?: any[]
  errorMessage?: string
}

export function useTeacherQuestionApi() {
  // ==================== 基础CRUD ====================

  /** 教师试题列表 */
  const getMyQuestionList = (params: TeacherQuestionQuery): Promise<PageResult<Question>> => {
    return get('/teacher/question/list', params, { requestKey: 'teacher-question-list' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  /** 教师试题详情 */
  const getQuestionDetail = (questionId: number): Promise<Question> => {
    return get(`/teacher/question/${questionId}`, {}, { requestKey: `teacher-question-${questionId}` }).then((res: any) => res?.data)
  }

  /** 教师新增试题 */
  const addQuestion = (data: Partial<Question>): Promise<any> => {
    return post('/teacher/question', data, { requestKey: 'teacher-question-add' })
  }

  /** 教师修改试题 */
  const updateQuestion = (data: Partial<Question>): Promise<void> => {
    return put('/teacher/question', data, { requestKey: 'teacher-question-update' })
  }

  /** 教师删除试题（软删除） */
  const deleteQuestion = (questionIds: number | string): Promise<void> => {
    return del(`/teacher/question/${questionIds}`, { requestKey: `teacher-question-delete-${questionIds}` })
  }

  /** 教师提交审核 */
  const submitAudit = (questionId: number): Promise<void> => {
    return put(`/teacher/question/submitAudit/${questionId}`, {}, { requestKey: `teacher-question-submit-${questionId}` })
  }

  // ==================== 回收站 ====================

  /** 教师回收站列表 */
  const getRecycleList = (params: TeacherQuestionQuery): Promise<PageResult<Question>> => {
    return get('/teacher/question/recycleList', params, { requestKey: 'teacher-question-recycle' }).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  /** 教师恢复试题 */
  const restoreQuestion = (questionIds: number | string): Promise<void> => {
    return put(`/teacher/question/restore/${questionIds}`, {}, { requestKey: `teacher-question-restore-${questionIds}` })
  }

  /** 教师彻底删除试题 */
  const permanentDeleteQuestion = (questionIds: number | string): Promise<void> => {
    return del(`/teacher/question/permanentDelete/${questionIds}`, { requestKey: `teacher-question-permanent-${questionIds}` })
  }

  // ==================== Word解析 ====================

  /** 教师解析Word试题（同步） */
  const parseWord = (formData: FormData): Promise<any> => {
    return post('/teacher/question/parseWord', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-word-parse'
    } as any)
  }

  /** 教师解析Word试题（异步提交） */
  const parseWordAsync = (formData: FormData): Promise<any> => {
    return post('/teacher/question/parseWordAsync', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-word-parse-async',
      timeout: 60000
    } as any)
  }

  /** 查询Word异步解析任务状态 */
  const getWordTaskStatus = (taskId: string): Promise<WordTaskStatus> => {
    return get(`/teacher/question/parseWordTaskStatus/${taskId}`, {}, { requestKey: `teacher-word-task-${taskId}` })
  }

  // ==================== OCR识题 ====================

  /** 教师拍照识题 */
  const recognizeQuestion = (formData: FormData): Promise<any> => {
    return post('/teacher/question/recognize', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-ocr-recognize'
    } as any)
  }

  // ==================== 查重 ====================

  /** 教师检测重复试题 */
  const checkDuplicate = (params: DuplicateCheckParams): Promise<DuplicateCheckResult> => {
    return post('/teacher/question/checkDuplicate', params, { requestKey: 'teacher-check-duplicate' })
  }

  // ==================== MinerU识题 ====================

  /** 教师MinerU识题（同步） */
  const recognizeMinerU = (formData: FormData): Promise<any> => {
    return post('/teacher/question/recognizeMinerU', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-mineru-recognize',
      timeout: 120000
    } as any)
  }

  /** 教师MinerU识题（异步提交） */
  const recognizeMinerUAsync = (formData: FormData): Promise<any> => {
    return post('/teacher/question/recognizeMinerUAsync', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-mineru-async',
      timeout: 60000
    } as any)
  }

  /** 查询MinerU异步识题任务状态 */
  const getMinerUTaskStatus = (taskId: string): Promise<MinerUTaskStatus> => {
    return get(`/teacher/question/minerUTaskStatus/${taskId}`, {}, { requestKey: `teacher-mineru-task-${taskId}` })
  }

  // ==================== 图片Session ====================

  /** 创建图片session */
  const createImageSession = (): Promise<any> => {
    return post('/teacher/question/session/create', {}, { requestKey: 'teacher-session-create' })
  }

  /** 上传图片到正式目录 */
  const uploadSessionImage = (formData: FormData): Promise<any> => {
    return post('/teacher/question/session/uploadImage', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-session-upload'
    } as any)
  }

  /** 通过URL上传图片到正式目录 */
  const uploadSessionImageByUrl = (data: { sessionUuid: string; fileUrl: string }): Promise<any> => {
    return post('/teacher/question/session/uploadImageByUrl', data, { requestKey: 'teacher-session-upload-url' })
  }

  /** 上传图片到临时目录 */
  const uploadTempImage = (formData: FormData): Promise<any> => {
    return post('/teacher/question/session/uploadImageToTemp', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      requestKey: 'teacher-session-upload-temp'
    } as any)
  }

  /** 通过URL下载图片到临时目录 */
  const uploadTempImageByUrl = (data: { sessionUuid: string; fileUrl: string }): Promise<any> => {
    return post('/teacher/question/session/uploadImageByUrlToTemp', data, { requestKey: 'teacher-session-upload-url-temp' })
  }

  /** 将临时图片复制到正式目录 */
  const copyImageToStatic = (imageUrl: string): Promise<any> => {
    return post('/teacher/question/session/copyImageToStatic', { imageUrl }, { requestKey: 'teacher-session-copy' })
  }

  /** 下载docx解析器中的临时图片 */
  const downloadDocxImage = (data: { sessionUuid: string; fileUrl: string }): Promise<any> => {
    return post('/teacher/question/session/downloadDocxImage', data, { requestKey: 'teacher-session-docx-img' })
  }

  const cancelTeacherQuestionRequests = () => {
    cancelRequest('teacher-question')
  }

  return {
    // 基础CRUD
    getMyQuestionList,
    getQuestionDetail,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    submitAudit,
    // 回收站
    getRecycleList,
    restoreQuestion,
    permanentDeleteQuestion,
    // Word解析
    parseWord,
    parseWordAsync,
    getWordTaskStatus,
    // OCR识题
    recognizeQuestion,
    // 查重
    checkDuplicate,
    // MinerU识题
    recognizeMinerU,
    recognizeMinerUAsync,
    getMinerUTaskStatus,
    // 图片Session
    createImageSession,
    uploadSessionImage,
    uploadSessionImageByUrl,
    uploadTempImage,
    uploadTempImageByUrl,
    copyImageToStatic,
    downloadDocxImage,
    // 工具
    cancelTeacherQuestionRequests
  }
}
