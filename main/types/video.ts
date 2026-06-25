import type { PageQuery } from './common'

export interface Video {
  videoId: number
  videoName: string
  videoDesc: string
  fileSize: number
  fileFormat: string
  storageType: number
  filePath: string
  coverPath: string
  duration: number
  resolution: string
  
  gradeId: number
  gradeName: string
  subjectId: number
  subjectName: string
  versionId: number
  versionName: string
  volumeId: number
  volumeName: string
  topicId: number
  topicName: string
  
  videoType: number
  courseSubType: number
  lectureSubType: number
  otherSubType: number
  
  teacherType: number
  innerTeacherId: number
  innerTeacherName: string
  outerTeacherName: string
  outerTeacherOrg: string
  
  creatorType: number
  creatorId: number
  
  topFlag: number
  topStartTime: string
  topEndTime: string
  
  recommendFlag: number
  recommendStartTime: string
  recommendEndTime: string
  
  status: number
  auditStatus: number
  publishTime: string
  offlineTime: string
  
  topicIds?: string
  batchIds?: string
  
  viewCount?: number
  likeCount?: number
  collectCount?: number
  
  createTime: string
  updateTime: string
  
  resources?: VideoResource[]
  knowledgePoints?: KnowledgePoint[]
}

export interface VideoResource {
  resourceId: number
  videoId: number
  resourceName: string
  resourceType: 1 | 2 | 3 | 4 | 5 | 6
  resourceDesc: string
  filePath: string
  fileName: string
  fileSize: number
  fileExt: string
  previewUrl: string
  downloadCount: number
  viewCount: number
  isPublic: number
  status: number
}

export interface VideoQuery extends PageQuery {
  videoName?: string
  gradeId?: number
  subjectId?: number
  versionId?: number
  volumeId?: number
  topicId?: number
  videoType?: number
  courseSubType?: number
  teacherId?: number
  status?: number
  topFlag?: number
  recommendFlag?: number
  orderBy?: string
}

export interface KnowledgePoint {
  knowledgeId: number
  knowledgeCode: string
  knowledgeName: string
  parentId: number
  volumeId: number
  topicId: number
  sort: number
  difficulty: number
  status: number
}

export interface StudyRecord {
  recordId: number
  userId: number
  userType: string
  userName: string
  videoId: number
  videoType: string
  videoName: string
  watchDuration: number
  progress: number
  lastPosition: number
  videoDuration: number
  createTime: string
  updateTime: string
}

export interface Collect {
  collectId: number
  userId: number
  userType: string
  userName: string
  videoId: number
  videoType: string
  videoName: string
  createTime: string
}

export interface UserScore {
  scoreId: number
  userId: number
  userType: string
  userName: string
  targetType: number
  targetId: number
  targetName: string
  scoreNum: number
  delFlag: number
  createTime: string
}

export interface UserScoreQuery extends PageQuery {
  targetType?: number
  startTime?: string
  endTime?: string
}
