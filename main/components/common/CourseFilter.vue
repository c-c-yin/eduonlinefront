<template>
  <div class="course-filter">
    <div class="filter-row">
      <div class="filter-label">学段</div>
      <div class="filter-options-wrapper">
        <div class="filter-options" :class="{ expanded: stageExpanded }" ref="stageOptionsRef">
          <span
            class="filter-option"
            :class="{ active: selectedStageId === '' }"
            @click="handleStageSelect('')"
          >不限</span>
          <span
            v-for="stage in stageList"
            :key="stage.stageId"
            class="filter-option"
            :class="{ active: selectedStageId === stage.stageId }"
            @click="handleStageSelect(stage.stageId)"
          >{{ stage.stageName }}</span>
        </div>
        <span
          v-if="stageOverflow"
          class="filter-expand"
          @click="stageExpanded = !stageExpanded"
        >{{ stageExpanded ? '收起' : '更多' }}</span>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-label">学科</div>
      <div class="filter-options-wrapper">
        <div class="filter-options" :class="{ expanded: subjectExpanded }" ref="subjectOptionsRef">
          <span
            class="filter-option"
            :class="{ active: selectedSubjectId === '' }"
            @click="handleSubjectSelect('')"
          >不限</span>
          <span
            v-for="subject in filteredSubjects"
            :key="subject.subjectId"
            class="filter-option"
            :class="{ active: selectedSubjectId === subject.subjectId }"
            @click="handleSubjectSelect(subject.subjectId)"
          >{{ subject.subjectName }}</span>
        </div>
        <span
          v-if="subjectOverflow"
          class="filter-expand"
          @click="subjectExpanded = !subjectExpanded"
        >{{ subjectExpanded ? '收起' : '更多' }}</span>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-label">版本</div>
      <div class="filter-options-wrapper">
        <div class="filter-options" :class="{ expanded: versionExpanded }" ref="versionOptionsRef">
          <span
            class="filter-option"
            :class="{ active: selectedVersionId === '' }"
            @click="handleVersionSelect('')"
          >不限</span>
          <span
            v-for="version in filteredVersions"
            :key="version.versionId"
            class="filter-option"
            :class="{ active: selectedVersionId === version.versionId }"
            @click="handleVersionSelect(version.versionId)"
          >{{ version.versionName }}</span>
        </div>
        <span
          v-if="versionOverflow"
          class="filter-expand"
          @click="versionExpanded = !versionExpanded"
        >{{ versionExpanded ? '收起' : '更多' }}</span>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-label">册次</div>
      <div class="filter-options-wrapper">
        <div class="filter-options" :class="{ expanded: volumeExpanded }" ref="volumeOptionsRef">
          <span
            class="filter-option"
            :class="{ active: selectedVolumeId === '' }"
            @click="handleVolumeSelect('')"
          >不限</span>
          <span
            v-for="volume in filteredVolumes"
            :key="volume.volumeId"
            class="filter-option"
            :class="{ active: selectedVolumeId === volume.volumeId }"
            @click="handleVolumeSelect(volume.volumeId)"
          >{{ volume.volumeName }}</span>
        </div>
        <span
          v-if="volumeOverflow"
          class="filter-expand"
          @click="volumeExpanded = !volumeExpanded"
        >{{ volumeExpanded ? '收起' : '更多' }}</span>
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-label">类型</div>
      <div class="filter-options-wrapper">
        <div class="filter-options expanded">
          <span
            class="filter-option"
            :class="{ active: selectedVideoType === '' }"
            @click="handleVideoTypeSelect('')"
          >不限</span>
          <span
            v-for="item in videoTypeOptions"
            :key="item.value"
            class="filter-option"
            :class="{ active: selectedVideoType === item.value }"
            @click="handleVideoTypeSelect(item.value)"
          >{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEducationApi } from '@/composables/useEducationApi'

const educationApi = useEducationApi()

interface Stage {
  stageId: number
  stageCode: string
  stageName: string
  sort: number
}

interface Subject {
  subjectId: number
  subjectCode: string
  subjectName: string
  stageId: number
  sort: number
}

interface Version {
  versionId: number
  versionCode: string
  versionName: string
  stageId: number
  subjectId: number
}

interface Volume {
  volumeId: number
  volumeCode: string
  volumeName: string
  gradeId: number
  versionId: number
  sort: number
}

const emit = defineEmits<{
  change: [values: {
    stageId?: number
    subjectId?: number
    versionId?: number
    volumeId?: number
    videoType?: number
  }]
}>()

const stageList = ref<Stage[]>([])
const subjectList = ref<Subject[]>([])
const versionList = ref<Version[]>([])
const volumeList = ref<Volume[]>([])

const selectedStageId = ref<number | string>('')
const selectedSubjectId = ref<number | string>('')
const selectedVersionId = ref<number | string>('')
const selectedVolumeId = ref<number | string>('')
const selectedVideoType = ref<number | string>('')

const stageExpanded = ref(false)
const subjectExpanded = ref(false)
const versionExpanded = ref(false)
const volumeExpanded = ref(false)

const stageOverflow = ref(false)
const subjectOverflow = ref(false)
const versionOverflow = ref(false)
const volumeOverflow = ref(false)

const stageOptionsRef = ref<HTMLElement>()
const subjectOptionsRef = ref<HTMLElement>()
const versionOptionsRef = ref<HTMLElement>()
const volumeOptionsRef = ref<HTMLElement>()

const videoTypeOptions = [
  { label: '课程视频', value: 1 },
  { label: '讲座视频', value: 2 },
  { label: '非课程视频', value: 3 }
]

const filteredSubjects = computed(() => {
  if (!selectedStageId.value) return subjectList.value
  return subjectList.value.filter(s => s.stageId === Number(selectedStageId.value))
})

const filteredVersions = computed(() => {
  let list = versionList.value
  if (selectedStageId.value) {
    list = list.filter(v => v.stageId === Number(selectedStageId.value))
  }
  if (selectedSubjectId.value) {
    list = list.filter(v => v.subjectId === Number(selectedSubjectId.value))
  }
  return list
})

const filteredVolumes = computed(() => {
  let list = volumeList.value
  if (selectedVersionId.value) {
    list = list.filter(v => v.versionId === Number(selectedVersionId.value))
  }
  return list
})

function checkOverflow() {
  nextTick(() => {
    if (stageOptionsRef.value) {
      stageOverflow.value = stageOptionsRef.value.scrollWidth > stageOptionsRef.value.clientWidth
    }
    if (subjectOptionsRef.value) {
      subjectOverflow.value = subjectOptionsRef.value.scrollWidth > subjectOptionsRef.value.clientWidth
    }
    if (versionOptionsRef.value) {
      versionOverflow.value = versionOptionsRef.value.scrollWidth > versionOptionsRef.value.clientWidth
    }
    if (volumeOptionsRef.value) {
      volumeOverflow.value = volumeOptionsRef.value.scrollWidth > volumeOptionsRef.value.clientWidth
    }
  })
}

function emitChange() {
  emit('change', {
    stageId: selectedStageId.value !== '' ? Number(selectedStageId.value) : undefined,
    subjectId: selectedSubjectId.value !== '' ? Number(selectedSubjectId.value) : undefined,
    versionId: selectedVersionId.value !== '' ? Number(selectedVersionId.value) : undefined,
    volumeId: selectedVolumeId.value !== '' ? Number(selectedVolumeId.value) : undefined,
    videoType: selectedVideoType.value !== '' ? Number(selectedVideoType.value) : undefined
  })
}

function handleStageSelect(val: number | string) {
  selectedStageId.value = val
  selectedSubjectId.value = ''
  selectedVersionId.value = ''
  selectedVolumeId.value = ''
  subjectExpanded.value = false
  versionExpanded.value = false
  volumeExpanded.value = false
  emitChange()
  checkOverflow()
}

function handleSubjectSelect(val: number | string) {
  selectedSubjectId.value = val
  selectedVersionId.value = ''
  selectedVolumeId.value = ''
  versionExpanded.value = false
  volumeExpanded.value = false
  emitChange()
  checkOverflow()
}

function handleVersionSelect(val: number | string) {
  selectedVersionId.value = val
  selectedVolumeId.value = ''
  volumeExpanded.value = false
  emitChange()
  checkOverflow()
}

function handleVolumeSelect(val: number | string) {
  selectedVolumeId.value = val
  emitChange()
}

function handleVideoTypeSelect(val: number | string) {
  selectedVideoType.value = val
  emitChange()
}

function resetFilters() {
  selectedStageId.value = ''
  selectedSubjectId.value = ''
  selectedVersionId.value = ''
  selectedVolumeId.value = ''
  selectedVideoType.value = ''
  stageExpanded.value = false
  subjectExpanded.value = false
  versionExpanded.value = false
  volumeExpanded.value = false
  emitChange()
  checkOverflow()
}

async function fetchFilterData() {
  try {
    const [stageListData, subjectListData, versionListData, volumeListData] = await Promise.all([
      educationApi.getStageOptions().catch(() => []),
      educationApi.getSubjectOptions().catch(() => []),
      educationApi.getVersionOptions().catch(() => []),
      educationApi.getVolumeOptions().catch(() => [])
    ])
    
    stageList.value = stageListData || []
    subjectList.value = subjectListData || []
    versionList.value = versionListData || []
    volumeList.value = volumeListData || []
    
    if (!stageListData?.length && !subjectListData?.length && !versionListData?.length && !volumeListData?.length) {
      setDefaultData()
    }
    
    checkOverflow()
  } catch (error) {
    console.error('获取筛选数据失败:', error)
    setDefaultData()
    checkOverflow()
  }
}

function setDefaultData() {
  stageList.value = [
    { stageId: 1, stageCode: 'preschool', stageName: '学前教育', sort: 1 },
    { stageId: 2, stageCode: 'primary', stageName: '小学', sort: 2 },
    { stageId: 3, stageCode: 'junior', stageName: '初中', sort: 3 },
    { stageId: 4, stageCode: 'senior', stageName: '高中', sort: 4 }
  ]
  subjectList.value = [
    { subjectId: 1, subjectCode: 'yuwen', subjectName: '语文', stageId: 2, sort: 1 },
    { subjectId: 2, subjectCode: 'shuxue', subjectName: '数学', stageId: 2, sort: 2 },
    { subjectId: 3, subjectCode: 'yingyu', subjectName: '英语', stageId: 2, sort: 3 },
    { subjectId: 4, subjectCode: 'yuwen', subjectName: '语文', stageId: 3, sort: 1 },
    { subjectId: 5, subjectCode: 'shuxue', subjectName: '数学', stageId: 3, sort: 2 },
    { subjectId: 6, subjectCode: 'yingyu', subjectName: '英语', stageId: 3, sort: 3 },
    { subjectId: 7, subjectCode: 'wuli', subjectName: '物理', stageId: 3, sort: 4 },
    { subjectId: 8, subjectCode: 'huaxue', subjectName: '化学', stageId: 3, sort: 5 },
    { subjectId: 9, subjectCode: 'shengwu', subjectName: '生物', stageId: 3, sort: 6 },
    { subjectId: 10, subjectCode: 'zhengzhi', subjectName: '道德与法治', stageId: 3, sort: 7 },
    { subjectId: 11, subjectCode: 'lishi', subjectName: '历史', stageId: 3, sort: 8 },
    { subjectId: 12, subjectCode: 'dili', subjectName: '地理', stageId: 3, sort: 9 },
    { subjectId: 13, subjectCode: 'yuwen', subjectName: '语文', stageId: 4, sort: 1 },
    { subjectId: 14, subjectCode: 'shuxue', subjectName: '数学', stageId: 4, sort: 2 },
    { subjectId: 15, subjectCode: 'yingyu', subjectName: '英语', stageId: 4, sort: 3 },
    { subjectId: 16, subjectCode: 'wuli', subjectName: '物理', stageId: 4, sort: 4 },
    { subjectId: 17, subjectCode: 'huaxue', subjectName: '化学', stageId: 4, sort: 5 },
    { subjectId: 18, subjectCode: 'shengwu', subjectName: '生物', stageId: 4, sort: 6 },
    { subjectId: 19, subjectCode: 'zhengzhi', subjectName: '思想政治', stageId: 4, sort: 7 },
    { subjectId: 20, subjectCode: 'lishi', subjectName: '历史', stageId: 4, sort: 8 },
    { subjectId: 21, subjectCode: 'dili', subjectName: '地理', stageId: 4, sort: 9 },
    { subjectId: 22, subjectCode: 'yundong', subjectName: '运动游戏', stageId: 1, sort: 1 },
    { subjectId: 23, subjectCode: 'yuyan', subjectName: '语言游戏', stageId: 1, sort: 2 },
    { subjectId: 24, subjectCode: 'yinyue', subjectName: '音乐游戏', stageId: 1, sort: 3 },
    { subjectId: 25, subjectCode: 'yizhi', subjectName: '益智游戏', stageId: 1, sort: 4 },
    { subjectId: 26, subjectCode: 'shougong', subjectName: '手工游戏', stageId: 1, sort: 5 },
    { subjectId: 27, subjectCode: 'jiankang', subjectName: '健康', stageId: 1, sort: 6 }
  ]
  versionList.value = [
    { versionId: 1, versionCode: 'tongbian', versionName: '统编版', stageId: 2, subjectId: 1 },
    { versionId: 2, versionCode: 'renjiao', versionName: '人教版', stageId: 2, subjectId: 2 },
    { versionId: 3, versionCode: 'beishida', versionName: '北师大版', stageId: 2, subjectId: 2 },
    { versionId: 4, versionCode: 'sujiang', versionName: '苏教版', stageId: 2, subjectId: 2 },
    { versionId: 5, versionCode: 'xishi', versionName: '西师版', stageId: 2, subjectId: 2 },
    { versionId: 6, versionCode: 'tongbian', versionName: '统编版', stageId: 3, subjectId: 4 },
    { versionId: 7, versionCode: 'renjiao', versionName: '人教版', stageId: 3, subjectId: 5 },
    { versionId: 8, versionCode: 'beishida', versionName: '北师大版', stageId: 3, subjectId: 5 },
    { versionId: 9, versionCode: 'huashi', versionName: '华师版', stageId: 3, subjectId: 5 },
    { versionId: 10, versionCode: 'tongbian', versionName: '统编版', stageId: 4, subjectId: 13 },
    { versionId: 11, versionCode: 'renjiao', versionName: '人教版', stageId: 4, subjectId: 14 },
    { versionId: 12, versionCode: 'beishida', versionName: '北师大版', stageId: 4, subjectId: 14 },
    { versionId: 13, versionCode: 'sujiang', versionName: '苏教版', stageId: 4, subjectId: 14 }
  ]
  volumeList.value = [
    { volumeId: 1, volumeCode: 'primary_1_up', volumeName: '一年级上册', gradeId: 1, versionId: 1, sort: 1 },
    { volumeId: 2, volumeCode: 'primary_1_down', volumeName: '一年级下册', gradeId: 1, versionId: 1, sort: 2 },
    { volumeId: 3, volumeCode: 'primary_2_up', volumeName: '二年级上册', gradeId: 2, versionId: 1, sort: 3 },
    { volumeId: 4, volumeCode: 'primary_2_down', volumeName: '二年级下册', gradeId: 2, versionId: 1, sort: 4 },
    { volumeId: 5, volumeCode: 'primary_3_up', volumeName: '三年级上册', gradeId: 3, versionId: 2, sort: 5 },
    { volumeId: 6, volumeCode: 'primary_3_down', volumeName: '三年级下册', gradeId: 3, versionId: 2, sort: 6 },
    { volumeId: 7, volumeCode: 'primary_4_up', volumeName: '四年级上册', gradeId: 4, versionId: 2, sort: 7 },
    { volumeId: 8, volumeCode: 'primary_4_down', volumeName: '四年级下册', gradeId: 4, versionId: 2, sort: 8 },
    { volumeId: 9, volumeCode: 'primary_5_up', volumeName: '五年级上册', gradeId: 5, versionId: 2, sort: 9 },
    { volumeId: 10, volumeCode: 'primary_5_down', volumeName: '五年级下册', gradeId: 5, versionId: 2, sort: 10 },
    { volumeId: 11, volumeCode: 'primary_6_up', volumeName: '六年级上册', gradeId: 6, versionId: 2, sort: 11 },
    { volumeId: 12, volumeCode: 'primary_6_down', volumeName: '六年级下册', gradeId: 6, versionId: 2, sort: 12 },
    { volumeId: 13, volumeCode: 'junior_7_up', volumeName: '七年级上册', gradeId: 7, versionId: 6, sort: 1 },
    { volumeId: 14, volumeCode: 'junior_7_down', volumeName: '七年级下册', gradeId: 7, versionId: 6, sort: 2 },
    { volumeId: 15, volumeCode: 'junior_8_up', volumeName: '八年级上册', gradeId: 8, versionId: 7, sort: 3 },
    { volumeId: 16, volumeCode: 'junior_8_down', volumeName: '八年级下册', gradeId: 8, versionId: 7, sort: 4 },
    { volumeId: 17, volumeCode: 'junior_9_up', volumeName: '九年级上册', gradeId: 9, versionId: 7, sort: 5 },
    { volumeId: 18, volumeCode: 'junior_9_down', volumeName: '九年级下册', gradeId: 9, versionId: 7, sort: 6 },
    { volumeId: 19, volumeCode: 'senior_10_up', volumeName: '必修一', gradeId: 10, versionId: 10, sort: 1 },
    { volumeId: 20, volumeCode: 'senior_10_down', volumeName: '必修二', gradeId: 10, versionId: 10, sort: 2 },
    { volumeId: 21, volumeCode: 'senior_11_up', volumeName: '选择性必修一', gradeId: 11, versionId: 11, sort: 3 },
    { volumeId: 22, volumeCode: 'senior_11_down', volumeName: '选择性必修二', gradeId: 11, versionId: 11, sort: 4 }
  ]
}

defineExpose({
  resetFilters,
  getSelectedValues: () => ({
    stageId: selectedStageId.value !== '' ? Number(selectedStageId.value) : undefined,
    subjectId: selectedSubjectId.value !== '' ? Number(selectedSubjectId.value) : undefined,
    versionId: selectedVersionId.value !== '' ? Number(selectedVersionId.value) : undefined,
    volumeId: selectedVolumeId.value !== '' ? Number(selectedVolumeId.value) : undefined,
    videoType: selectedVideoType.value !== '' ? Number(selectedVideoType.value) : undefined
  })
})

onMounted(() => {
  fetchFilterData()
  window.addEventListener('resize', checkOverflow)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkOverflow)
})
</script>

<style scoped>
.course-filter {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 24px;
}

.filter-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}

.filter-row:last-child {
  border-bottom: none;
}

.filter-label {
  width: 60px;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 28px;
  flex-shrink: 0;
}

.filter-options-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 0;
}

.filter-options {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  min-width: 0;
}

.filter-options.expanded {
  flex-wrap: wrap;
  white-space: normal;
  overflow: visible;
}

.filter-option {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

.filter-option:hover {
  color: var(--primary-color);
  background: var(--primary-color-light-9);
}

.filter-option.active {
  color: #fff;
  background: var(--primary-color);
}

.filter-expand {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  line-height: 20px;
  flex-shrink: 0;
  margin-left: 8px;
}

.filter-expand:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .course-filter {
    padding: 12px;
  }

  .filter-row {
    flex-direction: column;
    gap: 8px;
  }

  .filter-label {
    width: auto;
  }

  .filter-options-wrapper {
    flex-wrap: wrap;
  }

  .filter-options {
    flex-wrap: wrap;
    white-space: normal;
    overflow: visible;
  }

  .filter-option {
    padding: 4px 12px;
    font-size: 12px;
  }
}
</style>
