<template>
  <div class="paper-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">试卷中心</h1>
        <p class="page-desc">选题组卷，高效测试</p>
      </div>

      <div class="action-bar">
        <el-button type="primary" @click="showGenerateDialog = true">
          <el-icon><MagicStick /></el-icon>
          智能组卷
        </el-button>
      </div>

      <div class="filter-section">
        <el-form :model="queryParams" inline class="filter-form">
          <el-form-item label="试卷名称">
            <el-input v-model="queryParams.paperName" placeholder="搜索试卷" clearable @keyup.enter="handleSearch" />
          </el-form-item>
          <el-form-item label="试卷类型">
            <el-select v-model="queryParams.paperType" placeholder="全部类型" clearable @change="handleSearch">
              <el-option label="练习卷" :value="1" />
              <el-option label="测试卷" :value="2" />
              <el-option label="考试卷" :value="3" />
              <el-option label="作业卷" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="学科">
            <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable @change="handleSubjectChange">
              <el-option v-for="item in subjectOptions" :key="item.subjectId" :label="item.stageName ? item.stageName + ' > ' + item.subjectName : item.subjectName" :value="item.subjectId" />
            </el-select>
          </el-form-item>
          <el-form-item label="版本">
            <el-select v-model="queryParams.versionId" placeholder="全部版本" clearable :disabled="!queryParams.subjectId" @change="handleVersionChange">
              <el-option v-for="item in versionOptions" :key="item.versionId" :label="item.versionName" :value="item.versionId" />
            </el-select>
          </el-form-item>
          <el-form-item label="册次">
            <el-select v-model="queryParams.volumeId" placeholder="全部册次" clearable :disabled="!queryParams.versionId" @change="handleSearch">
              <el-option v-for="item in volumeOptions" :key="item.volumeId" :label="item.volumeName" :value="item.volumeId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div v-loading="loading" class="paper-list">
        <div v-if="paperList.length > 0" class="paper-items">
          <div v-for="paper in paperList" :key="paper.paperId" class="paper-item" @click="handlePaperClick(paper)">
            <div class="paper-header">
              <span class="paper-type" :class="`type-${paper.paperType}`">
                {{ getPaperTypeText(paper.paperType) }}
              </span>
              <span class="paper-score">总分: {{ paper.totalScore }}分</span>
            </div>
            <div class="paper-name">{{ paper.paperName }}</div>
            <div class="paper-info">
              <span>{{ paper.subjectName }}</span>
              <span>{{ paper.totalQuestion }}题</span>
              <span>{{ paper.duration }}分钟</span>
              <span>{{ paper.generateType === 1 ? '手动组卷' : '自动组卷' }}</span>
            </div>
            <div class="paper-footer">
              <span class="paper-creator">{{ paper.createByName }}</span>
              <span class="paper-time">{{ paper.createTime }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无试卷数据" />
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <el-dialog v-model="showGenerateDialog" title="智能组卷" width="600px">
      <el-form :model="generateForm" label-width="100px">
        <el-form-item label="试卷名称" required>
          <el-input v-model="generateForm.paperName" placeholder="请输入试卷名称" />
        </el-form-item>
        <el-form-item label="试卷类型" required>
          <el-select v-model="generateForm.paperType" placeholder="请选择">
            <el-option label="练习卷" :value="1" />
            <el-option label="测试卷" :value="2" />
            <el-option label="考试卷" :value="3" />
            <el-option label="作业卷" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="学科" required>
          <el-select v-model="generateForm.subjectId" placeholder="请选择学科">
            <el-option v-for="item in subjectOptions" :key="item.subjectId" :label="item.stageName ? item.stageName + ' > ' + item.subjectName : item.subjectName" :value="item.subjectId" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目数量" required>
          <el-input-number v-model="generateForm.totalQuestion" :min="5" :max="100" />
        </el-form-item>
        <el-form-item label="考试时长">
          <el-input-number v-model="generateForm.duration" :min="10" :max="300" />
        </el-form-item>
        <el-form-item label="难度筛选">
          <el-select v-model="generateForm.difficulty" placeholder="不限" clearable>
            <el-option label="容易" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="较难" :value="3" />
            <el-option label="困难" :value="4" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">开始组卷</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { MagicStick } from '@element-plus/icons-vue'
import type { Paper, PaperQuery, GeneratePaperParams } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'
import { useEducationApi } from '@/composables/useEducationApi'
import type { EducationSubject, TextbookVersion, TextbookVolume } from '@/composables/useEducationApi'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { getPaperList, generatePaper } = useQuestionApi()
const { getSubjectOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion } = useEducationApi()

const loading = ref(false)
const generating = ref(false)
const paperList = ref<Paper[]>([])
const total = ref(0)
const showGenerateDialog = ref(false)
const subjectOptions = ref<EducationSubject[]>([])
const versionOptions = ref<TextbookVersion[]>([])
const volumeOptions = ref<TextbookVolume[]>([])

const queryParams = reactive<PaperQuery>({
  pageNum: 1,
  pageSize: 10,
  paperName: '',
  paperType: undefined,
  subjectId: undefined,
  versionId: undefined,
  volumeId: undefined
})

const generateForm = reactive<GeneratePaperParams>({
  paperName: '',
  paperType: 1,
  subjectId: 1,
  duration: 120,
  totalQuestion: 20,
  difficulty: undefined
})

async function fetchPaperList() {
  loading.value = true
  try {
    const result = await getPaperList(queryParams)
    paperList.value = result.rows
    total.value = result.total
  } catch (error) {
    paperList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  fetchPaperList()
}

function handleSubjectChange(subjectId?: number) {
  queryParams.versionId = undefined
  queryParams.volumeId = undefined
  versionOptions.value = []
  volumeOptions.value = []
  if (subjectId) {
    getVersionOptionsBySubject(subjectId).then(list => { versionOptions.value = list })
  }
  handleSearch()
}

function handleVersionChange(versionId?: number) {
  queryParams.volumeId = undefined
  volumeOptions.value = []
  if (versionId) {
    getVolumeOptionsByVersion(versionId).then(list => { volumeOptions.value = list })
  }
  handleSearch()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchPaperList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchPaperList()
}

function handlePaperClick(paper: Paper) {
  router.push(`/papers/${paper.paperId}`)
}

async function handleGenerate() {
  if (!generateForm.paperName || !generateForm.subjectId) {
    ElMessage.warning('请填写试卷名称和选择学科')
    return
  }
  generating.value = true
  try {
    await generatePaper(generateForm)
    ElMessage.success('组卷成功')
    showGenerateDialog.value = false
    fetchPaperList()
  } catch (error) {
    ElMessage.error('组卷失败')
  } finally {
    generating.value = false
  }
}

function getPaperTypeText(type: number): string {
  const map: Record<number, string> = { 1: '练习卷', 2: '测试卷', 3: '考试卷', 4: '作业卷' }
  return map[type] || '未知'
}

async function initOptions() {
  const [subjects] = await Promise.all([
    getSubjectOptions().catch(() => [] as EducationSubject[])
  ])
  subjectOptions.value = subjects
}

onMounted(() => {
  initOptions()
  fetchPaperList()
})

useSeoMeta({ title: '试卷中心 - 教育云平台' })
</script>

<style scoped>
.paper-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); }
.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; font-weight: 600; color: var(--text-primary); margin: 0 0 8px; }
.page-desc { font-size: 14px; color: var(--text-secondary); margin: 0; }
.action-bar { margin-bottom: 16px; display: flex; justify-content: flex-end; }
.filter-section { background: var(--bg-color); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.filter-form { display: flex; flex-wrap: wrap; gap: 12px; }
.filter-form :deep(.el-form-item) { margin-bottom: 0; }
.paper-list { min-height: 400px; }
.paper-items { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.paper-item { background: var(--bg-color); border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.3s; border: 1px solid var(--border-color); }
.paper-item:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.paper-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.paper-type { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.paper-type.type-1 { background: #e6f7ff; color: #1890ff; }
.paper-type.type-2 { background: #fff7e6; color: #fa8c16; }
.paper-type.type-3 { background: #fff0f6; color: #eb2f96; }
.paper-type.type-4 { background: #f6ffed; color: #52c41a; }
.paper-score { font-size: 14px; color: var(--text-secondary); }
.paper-name { font-size: 16px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary); }
.paper-info { display: flex; gap: 12px; font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }
.paper-footer { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-secondary); padding-top: 12px; border-top: 1px solid var(--border-color); }
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: center; }
</style>
