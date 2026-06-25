import type { Video } from './video'
import type { Question } from './question'
import type { Topic } from './topic'

export interface MenuItem {
  menuId: number
  menuName: string
  menuCode: string
  parentId: number
  menuType: 'M' | 'C' | 'L'
  userType: string
  path: string
  component: string
  query: string
  linkUrl: string
  target: string
  icon: string
  sort: number
  visible: number
  status: number
  isCache: number
  children?: MenuItem[]
}

export interface GlobalConfig {
  configId: number
  configKey: string
  configValue: string
  configName: string
  configType: string
  groupCode: string
  groupName: string
  sort: number
}

export interface SiteConfig {
  loginRequired: boolean
  mourningMode: boolean
  mourningStart?: string
  mourningEnd?: string
  maintenanceMode: boolean
  maintenanceTitle?: string
  maintenanceContent?: string
  logo: string
  title: string
  copyright: string
  icp?: string
  icpUrl?: string
  police?: string
  policeUrl?: string
  contactPhone?: string
  contactEmail?: string
  registerSwitch: boolean
  searchEnable: boolean
  hotSearchEnable: boolean
}

export interface Notice {
  noticeId: number
  noticeTitle: string
  noticeContent: string
  noticeType: number
  noticeMode: number
  noticeImage: string
  attachment: string
  targetUrl: string
  targetType: number
  isTop: number
  topEndTime: string
  publishTime: string
  expireTime: string
  viewCount: number
  status: number
  sort: number
  createTime: string
}

export interface FriendLink {
  linkId: number
  linkName: string
  linkUrl: string
  linkLogo: string
  linkDesc: string
  linkType: number
  showLogo: number
  isNewWindow: number
  sort: number
  status: number
}

export interface BannerPosition {
  positionId: number
  positionCode: string
  positionName: string
  positionDesc: string
  imageWidth: number
  imageHeight: number
  mobileWidth: number
  mobileHeight: number
  maxCount: number
  autoPlay: number
  interval: number
  sort: number
  status: number
}

export interface Banner {
  bannerId: number
  positionId: number
  bannerTitle: string
  bannerImage: string
  bannerImageMobile: string
  bannerDesc: string
  linkType: number
  linkUrl: string
  bannerContent: string
  linkTarget: number
  startTime: string
  endTime: string
  viewCount: number
  clickCount: number
  sort: number
  status: number
}

export interface HotSearch {
  hotId: number
  keyword: string
  searchCount: number
  statDate: string
  sort: number
  status: number
}

export interface SearchHistory {
  historyId: number
  userId: number
  userType: string
  keyword: string
  searchType: string
  resultCount: number
  createTime: string
}

export interface SearchResult {
  videos: Video[]
  questions: Question[]
  topics: Topic[]
  total: number
}
