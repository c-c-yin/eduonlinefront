/**
 * 首页仪表盘 - 学生版
 */
export interface StudentDashboard {
  profile: StudentProfileOverview
  pendingHomework: HomeworkItem[]
  wrongQuestionCount: number
  recommendQuestions: RecommendQuestionItem[]
}

/**
 * 学生画像概览
 */
export interface StudentProfileOverview {
  compositeLabel: string
  labelColor: string
  compositeScore: number
  currentWeekAvgRate: number | null
  lastWeekAvgRate: number | null
  scoreTrend: string | null
  activeDays7: number
  avgMasteryScore: number
}

/**
 * 首页仪表盘 - 教师版
 */
export interface TeacherDashboard {
  profile: TeacherProfileOverview
  pendingHomework: HomeworkItem[]
  alertStudentCount: number
  recentAlerts: AlertItem[]
}

/**
 * 教师画像概览
 */
export interface TeacherProfileOverview {
  classCount: number
  studentCount: number
  avgMasteryScore: number
}

/**
 * 教师画像详情
 */
export interface TeacherProfileDetail {
  teacherId: number
  teacherName: string
  teacherNo: string
  orgName: string
  mainSubjectName: string
  statDate: string
  compositeScore: number
  compositeLabel: string
  labelColor: string
  // 5维度得分
  productionScore: number
  qualityScore: number
  propositionScore: number
  influenceScore: number
  activityScore: number
  // 维度明细
  dimensions: TeacherProfileDimension[]
  // 趋势数据
  trend: { date: string; score: number }[]
}

export interface TeacherProfileDimension {
  dimensionKey: string
  dimensionName: string
  score: number
  weight: number
  description: string
}

/**
 * 作业条目
 */
export interface HomeworkItem {
  homeworkId: number
  homeworkName: string
  deadline?: string
  submitCount?: number
}

/**
 * 推荐试题条目
 */
export interface RecommendQuestionItem {
  questionId: number
  questionType: number
  difficulty: number
  questionContentText: string
}

/**
 * 预警条目
 */
export interface AlertItem {
  studentName: string
  alertType: string
  level: string
}

/**
 * 首页仪表盘聚合数据
 */
export interface HomeDashboardVo {
  userType: 'teacher' | 'student'
  student?: StudentDashboard
  teacher?: TeacherDashboard
}

/**
 * 平台统计概览
 */
export interface PlatformStats {
  courseCount: number
  questionCount: number
  paperCount: number
  studyHours: number
  teacherCount?: number
  studentCount?: number
}

/**
 * 最新试卷条目
 */
export interface LatestPaperItem {
  paperId: number
  paperName: string
  subjectId: number
  totalQuestion: number
  totalScore: number
  difficulty: number
  useCount: number
  publishTime: string
}

/**
 * 热门试题条目
 */
export interface HotQuestionItem {
  questionId: number
  questionType: number
  difficulty: number
  questionContentText: string
  correctRate: number
  collectCount: number
  useCount: number
}

/**
 * 首页模块配置
 */
export interface HomeModuleConfig {
  banner: boolean
  notice: boolean
  shortcuts: boolean
  profile: boolean
  broadcast: boolean
  stats: boolean
  recommend: boolean
  topic: boolean
  paper: boolean
  hotquestion: boolean
}
