export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export interface PageResult<T> {
  rows: T[]
  total: number
}

export interface PageQuery {
  pageNum?: number
  pageSize?: number
  orderByColumn?: string
  isAsc?: 'asc' | 'desc'
}

export interface TreeNode {
  id: number
  label: string
  children?: TreeNode[]
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
}

export type UserType = 'teacher' | 'student' | 'admin'

export type VideoType = 'vod' | 'topic' | 'batch'

export type ResourceStatus = 0 | 1 | 2 | 3

export type AuditStatus = 0 | 1 | 2 | 3
