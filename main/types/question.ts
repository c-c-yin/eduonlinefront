import type { PageQuery } from './common'

export type QuestionType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export type QuestionDifficulty = 1 | 2 | 3 | 4 | 5

export interface Question {
  questionId: number
  questionCode: string
  questionType: QuestionType
  questionContent: string
  questionContentText: string
  questionImage: string
  optionsJson: string
  answerContent: string
  answerAnalysis: string
  answerImage: string
  subjectId: number
  gradeId: number
  volumeId: number
  topicId: number
  difficulty: QuestionDifficulty
  defaultScore: number
  sourceType: number
  status: number
  auditStatus: number
  useCount: number
  correctRate: number
  collectCount: number
  creatorType: number
  createByName: string
  isPublic: number
  createTime: string
  updateTime: string
  subjectName: string
  gradeName: string
  topicName: string
  knowledgeNames: string
  attachments: QuestionAttachment[]
  knowledgeList: QuestionKnowledge[]
}

export interface QuestionAttachment {
  attachmentId: number
  questionId: number
  attachmentType: number
  attachmentName: string
  attachmentUrl: string
  attachmentSize: number
  attachmentFormat: string
  duration: number
  description: string
  sort: number
}

export interface QuestionKnowledge {
  relationId: number
  questionId: number
  knowledgeId: number
  isMain: number
  sort: number
  knowledgeName: string
}

export interface QuestionOption {
  optionKey: string
  optionContent: string
  optionImage: string
}

export interface Paper {
  paperId: number
  paperCode: string
  paperName: string
  paperDesc: string
  paperType: number
  generateType: number
  subjectId: number
  gradeId: number
  versionId?: number
  volumeId?: number
  topicId?: number
  totalScore: number
  totalQuestion: number
  duration: number
  passScore: number
  generateRule?: string
  status: number
  creatorType: number
  createByName: string
  useCount: number
  avgScore: number
  isPublic: number
  createTime: string
  updateTime?: string
  subjectName?: string
  gradeName?: string
  topicName?: string
  versionName?: string
  volumeName?: string
  difficulty?: number
  questionList: PaperQuestion[]
}

export interface PaperQuestion {
  id: number
  paperId: number
  questionId: number
  questionType: number
  score: number
  sort: number
  groupName: string
  questionContent: string
  optionsJson: string
  answerContent: string
  answerAnalysis: string
  difficulty: number
  defaultScore: number
}

// TODO 答题卡功能暂时停用，识别准确率待优化后启用
// export interface AnswerSheet {
//   sheetId: number
//   sheetCode: string
//   paperId: number
//   paperName: string
//   userId: number
//   userType: string
//   userName: string
//   sheetImage: string
//   ocrResult: string
//   totalScore: number
//   correctCount: number
//   wrongCount: number
//   partialCount: number
//   unansweredCount: number
//   submitTime: string
//   status: number
//   reviewUserId: number
//   reviewTime: string
//   createTime: string
//   detailList: AnswerDetail[]
// }
//
// export interface AnswerDetail {
//   detailId: number
//   sheetId: number
//   questionId: number
//   questionType: number
//   userAnswer: string
//   userAnswerImage: string
//   isCorrect: number
//   score: number
//   maxScore: number
//   reviewRemark: string
//   reviewUserId: number
//   reviewTime: string
// }

export interface QuestionCollect {
  collectId: number
  userId: number
  userType: string
  userName: string
  questionId: number
  questionType: number
  subjectId: number
  createTime: string
  questionContent: string
  subjectName: string
}

export interface WrongQuestion {
  wrongId: number
  userId: number
  userType: string
  userName: string
  questionId: number
  questionType: number
  subjectId: number
  knowledgeId: number
  wrongCount: number
  correctCount: number
  lastWrongTime: string
  lastCorrectTime: string
  masteryLevel: number
  isMastered: number
  sourceType: number
  sourceId: number
  createTime: string
  questionContent: string
  subjectName: string
  knowledgeName: string
}

export interface KnowledgeMastery {
  masteryId: number
  userId: number
  userType: string
  knowledgeId: number
  subjectId: number
  totalQuestion: number
  correctCount: number
  wrongCount: number
  correctRate: number
  masteryLevel: number
  masteryScore: number
  lastPracticeTime: string
  knowledgeName: string
  subjectName: string
}

export interface RecommendRecord {
  recommendId: number
  userId: number
  userType: string
  recommendType: number
  targetId: number
  recommendReason: string
  recommendScore: number
  knowledgeId: number
  isViewed: number
  isCompleted: number
  viewTime: string
  completeTime: string
  createTime: string
  targetName: string
  knowledgeName: string
}

export interface QuestionQuery extends PageQuery {
  questionType?: QuestionType
  difficulty?: QuestionDifficulty
  gradeId?: number
  subjectId?: number
  volumeId?: number
  topicId?: number
  knowledgeId?: number
  keyword?: string
  status?: number
  auditStatus?: number
}

export interface PaperQuery extends PageQuery {
  paperName?: string
  paperType?: number
  subjectId?: number
  versionId?: number
  volumeId?: number
  gradeId?: number
  status?: number
}

export interface WrongQuestionQuery extends PageQuery {
  subjectId?: number
  knowledgeId?: number
  masteryLevel?: number
  isMastered?: number
}

export interface GeneratePaperParams {
  paperName: string
  paperType: number
  subjectId: number
  gradeId?: number
  versionId?: number
  volumeId?: number
  topicId?: number
  duration: number
  totalQuestion: number
  difficulty?: number
  generateRule?: string
}

export interface QuestionStats {
  totalCount: number
  correctCount: number
  wrongCount: number
  correctRate: number
  avgTime: number
  typeStats: Record<number, { total: number; correct: number }>
  difficultyStats: Record<number, { total: number; correct: number }>
}

export interface UserAnswer {
  questionId: number
  answer: string
  isCorrect: boolean
  score: number
  maxScore: number
  analysis?: string
}

export interface PracticeSession {
  sessionId: string
  questions: Question[]
  answers: Record<number, string>
  results: Record<number, UserAnswer>
  elapsedTime: number
  isFinished: boolean
}
