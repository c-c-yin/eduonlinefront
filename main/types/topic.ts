import type { Video } from './video'

export interface Topic {
  topicId: number
  topicName: string
  topicDesc: string
  coverUrl: string
  priority: number
  status: number
  sort: number
  videoCount: number
  createTime: string
  videos?: TopicVideo[]
}

export interface TopicVideo {
  id: number
  topicId: number
  videoId: number
  sort: number
  isTop: number
  isShow: number
  video?: Video
}

export interface BroadcastBatch {
  batchId: number
  batchCode: string
  batchName: string
  batchDesc: string
  batchStatus: number
  batchStartTime: string
  batchEndTime: string
  videoCount: number
  createTime: string
  videos?: BatchVideo[]
}

export interface BatchVideo {
  id: number
  batchId: number
  videoId: number
  videoBatchStartTime: string
  videoBatchEndTime: string
  batchSort: number
  batchPriority: number
  batchIsTop: number
  batchStatus: number
  video?: Video
}
