import { get, put } from '@/utils/request'
import type { PageResult } from '@/types'

/**
 * 预警记录
 */
export interface AlertRecord {
  recordId: number
  ruleId: number
  ruleName: string
  ruleType: string
  targetType: string
  studentId: number
  studentName: string
  studentNo: string
  className: string
  alertLevel: string
  alertType: string
  alertTitle: string
  alertContent: string
  alertData: string
  isRead: number
  isHandled: number
  handlerId: number
  handleTime: string
  handleRemark: string
  createTime: string
}

/**
 * 预警规则
 */
export interface AlertRule {
  ruleId: number
  ruleName: string
  ruleType: string
  targetType: string
  metricName: string
  metricLabel: string
  threshold: number
  comparison: string
  severityLevel: string
  cooldownHours: number
  isEnabled: number
  description: string
}

/**
 * 改进建议
 */
export interface ImprovementSuggest {
  suggestId: number
  ruleCode: string
  suggestTitle: string
  suggestContent: string
  actionItems: string
  resourceLinks: string
  sortOrder: number
}

/**
 * 预警趋势数据
 */
export interface AlertTrend {
  date: string
  totalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
}

/**
 * 预警管理API - 教师端
 */
export function useAlertApi() {

  /**
   * 获取预警记录列表
   */
  const getAlertList = (params: {
    pageNum?: number
    pageSize?: number
    isRead?: number
    alertLevel?: string
  }): Promise<PageResult<AlertRecord>> => {
    return get('/teacher/alert/list', params).then((res: any) => ({
      rows: res?.rows || [],
      total: res?.total || 0
    }))
  }

  /**
   * 获取未读预警数量
   */
  const getUnreadCount = (): Promise<number> => {
    return get('/teacher/alert/unread-count').then((res: any) => res?.data?.count ?? 0)
  }

  /**
   * 标记预警已读
   */
  const markAsRead = (recordId: number): Promise<void> => {
    return put(`/teacher/alert/${recordId}/read`)
  }

  /**
   * 处理预警
   */
  const handleAlert = (recordId: number, remark?: string): Promise<void> => {
    return put(`/teacher/alert/${recordId}/handle`, { handleRemark: remark || '' })
  }

  /**
   * 获取预警规则列表
   */
  const getAlertRules = (): Promise<AlertRule[]> => {
    return get('/teacher/alert/rules').then((res: any) => res?.data || [])
  }

  /**
   * 获取改进建议
   */
  const getImprovementSuggest = (ruleCode: string): Promise<ImprovementSuggest[]> => {
    return get(`/teacher/alert/suggest/${ruleCode}`).then((res: any) => res?.data || [])
  }

  /**
   * 获取预警趋势
   */
  const getAlertTrend = (days: number = 7): Promise<AlertTrend[]> => {
    return get('/teacher/alert/trend', { days }).then((res: any) => res?.data || [])
  }

  return {
    getAlertList,
    getUnreadCount,
    markAsRead,
    handleAlert,
    getAlertRules,
    getImprovementSuggest,
    getAlertTrend
  }
}