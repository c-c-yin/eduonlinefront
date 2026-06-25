export const APP_TITLE = '教育云平台'

export const PAGE_SIZE = 12

export const PAGE_SIZES = [12, 24, 36, 48]

export const VIDEO_TYPES = [
  { label: '课程视频', value: 1 },
  { label: '讲座视频', value: 2 },
  { label: '非课程视频', value: 3 }
]

export const QUESTION_TYPES = [
  { label: '单选题', value: 1 },
  { label: '多选题', value: 2 },
  { label: '判断题', value: 3 },
  { label: '填空题', value: 4 },
  { label: '简答题', value: 5 }
]

export const DIFFICULTY_LEVELS = [
  { label: '非常简单', value: 1 },
  { label: '简单', value: 2 },
  { label: '中等', value: 3 },
  { label: '困难', value: 4 },
  { label: '非常困难', value: 5 }
]

export const RESOURCE_TYPES = [
  { label: '试题', value: 1 },
  { label: '学案', value: 2 },
  { label: '课件', value: 3 },
  { label: '教案', value: 4 },
  { label: '笔记', value: 5 },
  { label: '其他', value: 6 }
]

export const USER_TYPES = [
  { label: '教师', value: 'teacher' },
  { label: '学生', value: 'student' }
]

export const VIDEO_STATUS = [
  { label: '草稿', value: 0 },
  { label: '待审核', value: 1 },
  { label: '已发布', value: 2 },
  { label: '已下架', value: 3 }
]

export const GENDER_OPTIONS = [
  { label: '未知', value: 0 },
  { label: '男', value: 1 },
  { label: '女', value: 2 }
]

export const DEFAULT_AVATAR = '/images/default-avatar.svg'

export const DEFAULT_COVER = '/images/default-cover.png'

export const MAX_UPLOAD_SIZE = 100 * 1024 * 1024

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]
