import { get } from '@/utils/request'

export interface EducationStage {
  stageId: number
  stageName: string
}

export interface EducationGrade {
  gradeId: number
  gradeName: string
  stageId?: number
  stageName?: string
}

export interface EducationSubject {
  subjectId: number
  subjectName: string
  stageId?: number
  stageName?: string
}

export interface TextbookVersion {
  versionId: number
  versionName: string
  subjectId?: number
}

export interface TextbookVolume {
  volumeId: number
  volumeName: string
  versionId?: number
  gradeId?: number
}

export interface TextbookTopic {
  topicId: number
  topicName: string
  volumeId?: number
  parentId?: number
  children?: TextbookTopic[]
}

export interface TextbookKnowledge {
  knowledgeId: number
  knowledgeName: string
  knowledgeCode?: string
  volumeId?: number
  topicId?: number
  parentId?: number
  children?: TextbookKnowledge[]
}

export interface TeacherOption {
  teacherId: number
  teacherName: string
  teacherNo?: string
}

// 前端构建课题树结构（模拟后端buildTopicTree逻辑）
function buildTopicTree(list: TextbookTopic[]): TextbookTopic[] {
  if (!list || list.length === 0) return []
  const idSet = new Set(list.map((t: any) => t.topicId))
  const rootList: TextbookTopic[] = []
  for (const item of list) {
    if (!item.parentId || item.parentId === 0 || !idSet.has(item.parentId)) {
      rootList.push(item)
    }
  }
  if (rootList.length === 0) return list
  const buildChildren = (parent: TextbookTopic): void => {
    const children = list.filter((t: any) => t.parentId === parent.topicId)
    if (children.length > 0) {
      parent.children = children
      children.forEach(buildChildren)
    }
  }
  rootList.forEach(buildChildren)
  return rootList
}

export function useEducationApi() {
  // 学段
  const getStageOptions = (): Promise<EducationStage[]> => {
    return get('/education/stage/optionselect').then((res: any) => res?.data || [])
  }

  // 年级（全部）
  const getGradeOptions = (): Promise<EducationGrade[]> => {
    return get('/education/grade/optionselect').then((res: any) => res?.data || [])
  }

  // 年级（按学段筛选）
  const getGradeOptionsByStage = (stageId: number): Promise<EducationGrade[]> => {
    return get(`/education/grade/optionselectByStage/${stageId}`).then((res: any) => res?.data || [])
  }

  // 学科（全部）
  const getSubjectOptions = (): Promise<EducationSubject[]> => {
    return get('/education/subject/optionselect').then((res: any) => res?.data || [])
  }

  // 学科（按学段筛选）
  const getSubjectOptionsByStage = (stageId: number): Promise<EducationSubject[]> => {
    return get(`/education/subject/optionselectByStage/${stageId}`).then((res: any) => res?.data || [])
  }

  // 教材版本（全部）
  const getVersionOptions = (): Promise<TextbookVersion[]> => {
    return get('/education/textbook/version/optionselect').then((res: any) => res?.data || [])
  }

  // 教材版本（按学科筛选）
  const getVersionOptionsBySubject = (subjectId: number): Promise<TextbookVersion[]> => {
    return get(`/education/textbook/version/optionselectBySubject/${subjectId}`).then((res: any) => res?.data || [])
  }

  // 教材册次（全部）
  const getVolumeOptions = (): Promise<TextbookVolume[]> => {
    return get('/education/textbook/volume/optionselect').then((res: any) => res?.data || [])
  }

  // 教材册次（按版本筛选）
  const getVolumeOptionsByVersion = (versionId: number): Promise<TextbookVolume[]> => {
    return get(`/education/textbook/volume/optionselectByVersion/${versionId}`).then((res: any) => res?.data || [])
  }

  // 课题（全部）
  const getTopicOptions = (): Promise<TextbookTopic[]> => {
    return get('/education/textbook/topic/optionselect').then((res: any) => res?.data || [])
  }

  // 课题（按册次筛选）
  const getTopicOptionsByVolume = (volumeId: number): Promise<TextbookTopic[]> => {
    return get(`/education/textbook/topic/optionselectByVolume/${volumeId}`).then((res: any) => res?.data || [])
  }

  // 课题树（按册次筛选，前端构建树结构）
  const getTopicTree = (volumeId: number): Promise<TextbookTopic[]> => {
    return getTopicOptionsByVolume(volumeId).then((list: TextbookTopic[]) => {
      return buildTopicTree(list)
    })
  }

  // 知识点（全部）
  const getKnowledgeOptions = (): Promise<TextbookKnowledge[]> => {
    return get('/education/textbook/knowledge/optionselect').then((res: any) => res?.data || [])
  }

  // 知识点（按册次筛选）
  const getKnowledgeOptionsByVolume = (volumeId: number): Promise<TextbookKnowledge[]> => {
    return get(`/education/textbook/knowledge/optionselectByVolume/${volumeId}`).then((res: any) => res?.data || [])
  }

  // 知识点（按课题筛选）
  const getKnowledgeOptionsByTopic = (topicId: number): Promise<TextbookKnowledge[]> => {
    return get(`/education/textbook/knowledge/optionselectByTopic/${topicId}`).then((res: any) => res?.data || [])
  }

  // 教师列表（仅正常状态）
  const getTeacherOptions = (): Promise<TeacherOption[]> => {
    return get('/education/teacher/list').then((res: any) => res?.data || [])
  }

  return {
    getStageOptions,
    getGradeOptions,
    getGradeOptionsByStage,
    getSubjectOptions,
    getSubjectOptionsByStage,
    getVersionOptions,
    getVersionOptionsBySubject,
    getVolumeOptions,
    getVolumeOptionsByVersion,
    getTopicOptions,
    getTopicOptionsByVolume,
    getTopicTree,
    getKnowledgeOptions,
    getKnowledgeOptionsByVolume,
    getKnowledgeOptionsByTopic,
    getTeacherOptions
  }
}