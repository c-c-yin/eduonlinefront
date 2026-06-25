<template>
  <div class="teacher-paper-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">我的试卷</h1>
        <p class="page-desc">创建和管理试卷</p>
      </div>

      <div class="toolbar">
        <el-input v-model="searchName" placeholder="搜索试卷名称" clearable style="width: 200px" @keyup.enter="handleSearch" />
        <el-select v-model="queryParams.paperType" placeholder="全部类型" clearable style="width: 120px" @change="handleSearch">
          <el-option label="练习卷" :value="1" />
          <el-option label="测试卷" :value="2" />
          <el-option label="考试卷" :value="3" />
          <el-option label="作业卷" :value="4" />
        </el-select>
        <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable style="width: 140px" @change="onSubjectChange">
          <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
        </el-select>
        <el-select v-model="queryParams.versionId" placeholder="全部版本" clearable style="width: 120px" :disabled="!queryParams.subjectId" @change="onVersionChange">
          <el-option v-for="v in versionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
        </el-select>
        <el-select v-model="queryParams.volumeId" placeholder="全部册次" clearable style="width: 120px" :disabled="!queryParams.versionId" @change="handleSearch">
          <el-option v-for="v in volumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
        </el-select>
        <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
          <el-option label="草稿" :value="0" />
        </el-select>
        <el-button @click="handleReset">重置</el-button>
        <div style="flex:1" />
        <el-button type="primary" @click="goCreate">手动组卷</el-button>
        <el-button type="success" @click="showGenerateDialog = true">
          <el-icon><MagicStick /></el-icon>智能组卷
        </el-button>
      </div>

      <div v-loading="loading" class="paper-list">
        <el-empty v-if="!loading && list.length === 0" description="暂无试卷" />
        <el-card v-for="item in list" :key="item.paperId" class="paper-card" shadow="hover">
          <div class="card-content">
            <div class="card-main">
              <h3 class="card-title" @click="goDetail(item.paperId)">{{ item.paperName }}</h3>
              <div class="card-tags">
                <el-tag size="small" :type="paperTypeTag(item.paperType)">{{ paperTypeLabel(item.paperType) }}</el-tag>
                <el-tag size="small" type="info">{{ item.generateType === 1 ? '手动组卷' : '自动组卷' }}</el-tag>
                <el-tag v-if="item.status === 0" size="small" type="info">草稿</el-tag>
              </div>
              <div class="card-info">
                <span>{{ item.subjectName || '-' }}</span>
                <span>{{ item.gradeName || '-' }}</span>
                <span>{{ item.totalScore }}分</span>
                <span>{{ item.totalQuestion }}题</span>
                <span>{{ item.duration }}分钟</span>
                <span>{{ item.createTime?.substring(0, 10) }}</span>
              </div>
            </div>
            <div class="card-actions">
              <el-button size="small" @click="goDetail(item.paperId)">预览</el-button>
              <el-button v-if="item.status === 0" size="small" type="primary" @click="goEdit(item.paperId)">修改</el-button>
              <el-button v-if="item.status === 0" size="small" type="danger" @click="handleDelete(item)">删除</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <!-- 智能组卷对话框 -->
    <el-dialog v-model="showGenerateDialog" title="智能组卷" width="700px" top="5vh">
      <el-form :model="generateForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="试卷名称" required>
              <el-input v-model="generateForm.paperName" placeholder="请输入试卷名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="试卷类型" required>
              <el-select v-model="generateForm.paperType" placeholder="请选择" style="width:100%">
                <el-option label="练习卷" :value="1" />
                <el-option label="测试卷" :value="2" />
                <el-option label="考试卷" :value="3" />
                <el-option label="作业卷" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">教材信息</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="学科" required>
              <el-select v-model="generateForm.subjectId" placeholder="请选择" style="width:100%" @change="onGenSubjectChange">
                <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版本">
              <el-select v-model="generateForm.versionId" placeholder="请选择" clearable style="width:100%" @change="onGenVersionChange">
                <el-option v-for="v in genVersionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="册次">
              <el-select v-model="generateForm.volumeId" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="v in genVolumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="年级">
              <el-select v-model="generateForm.gradeId" placeholder="请选择" clearable style="width:100%">
                <el-option v-for="g in gradeOptions" :key="g.gradeId" :label="g.gradeName" :value="g.gradeId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="考试时长">
              <el-input-number v-model="generateForm.duration" :min="10" :max="300" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-select v-model="generateForm.difficulty" placeholder="不限" clearable style="width:100%">
                <el-option label="容易" :value="1" />
                <el-option label="中等" :value="2" />
                <el-option label="较难" :value="3" />
                <el-option label="困难" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">题型配置</el-divider>
        <el-table :data="genQuestionTypeConfig" border size="small" style="width:100%">
          <el-table-column label="题型" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{ row.label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="难度" width="120">
            <template #default="{ row }">
              <el-select v-model="row.difficulty" placeholder="不限" clearable size="small" style="width:100%">
                <el-option label="容易" :value="1" /><el-option label="中等" :value="2" />
                <el-option label="较难" :value="3" /><el-option label="困难" :value="4" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="题目数量" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.count" :min="0" :max="50" size="small" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="每题分值" width="120">
            <template #default="{ row }">
              <el-input-number v-model="row.score" :min="0.5" :max="100" :step="0.5" :precision="1" size="small" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="100">
            <template #default="{ row }">
              {{ (row.count || 0) * (row.score || 0) }}分
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top:8px;font-size:13px;color:#606266">
          总题数：{{ genTotalQuestion }}，总分：{{ genTotalScore }}分
        </div>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Paper } from '@/types'
import { useTeacherPaperApi } from '@/composables/useTeacherPaperApi'
import { useEducationApi } from '@/composables/useEducationApi'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const { getMyPaperList, deletePaper, generatePaper } = useTeacherPaperApi()
const { getSubjectOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion, getGradeOptions } = useEducationApi()

const loading = ref(false)
const generating = ref(false)
const list = ref<Paper[]>([])
const total = ref(0)
const showGenerateDialog = ref(false)

const subjectOptions = ref<any[]>([])
const gradeOptions = ref<any[]>([])
const versionOptions = ref<any[]>([])
const volumeOptions = ref<any[]>([])
const genVersionOptions = ref<any[]>([])
const genVolumeOptions = ref<any[]>([])

const searchName = ref('')
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  paperName: '',
  paperType: null as number | null,
  subjectId: null as number | null,
  versionId: null as number | null,
  volumeId: null as number | null,
  status: null as number | null
})

const generateForm = reactive({
  paperName: '',
  paperType: 1,
  subjectId: null as number | null,
  gradeId: null as number | null,
  versionId: null as number | null,
  volumeId: null as number | null,
  duration: 120,
  difficulty: null as number | null,
  totalQuestion: 20
})

const QUESTION_TYPES = [
  { type: 1, label: '单选题' },
  { type: 2, label: '多选题' },
  { type: 3, label: '判断题' },
  { type: 4, label: '填空题' },
  { type: 5, label: '简答题' },
  { type: 6, label: '计算题' },
  { type: 7, label: '应用题' }
]

const genQuestionTypeConfig = reactive(
  QUESTION_TYPES.map(t => ({ ...t, count: 0, score: 5, difficulty: null as number | null }))
)

const genTotalQuestion = computed(() => genQuestionTypeConfig.reduce((s, r) => s + (r.count || 0), 0))
const genTotalScore = computed(() => genQuestionTypeConfig.reduce((s, r) => s + (r.count || 0) * (r.score || 0), 0))

function paperTypeLabel(type: number): string {
  const map: Record<number, string> = { 1: '练习卷', 2: '测试卷', 3: '考试卷', 4: '作业卷' }
  return map[type] || '未知'
}

function paperTypeTag(type: number): string {
  const map: Record<number, string> = { 1: '', 2: 'warning', 3: 'danger', 4: 'success' }
  return map[type] || ''
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (searchName.value) params.paperName = searchName.value
    const res = await getMyPaperList(params)
    list.value = res.rows
    total.value = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  queryParams.pageNum = 1
  fetchList()
}

function handleReset() {
  searchName.value = ''
  queryParams.pageNum = 1
  queryParams.paperType = null
  queryParams.subjectId = null
  queryParams.versionId = null
  queryParams.volumeId = null
  queryParams.status = null
  versionOptions.value = []
  volumeOptions.value = []
  fetchList()
}

async function onSubjectChange(subjectId: number | null) {
  queryParams.versionId = null
  queryParams.volumeId = null
  versionOptions.value = []
  volumeOptions.value = []
  if (subjectId) {
    try { versionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { versionOptions.value = [] }
  }
  handleSearch()
}

async function onVersionChange(versionId: number | null) {
  queryParams.volumeId = null
  volumeOptions.value = []
  if (versionId) {
    try { volumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { volumeOptions.value = [] }
  }
  handleSearch()
}

async function onGenSubjectChange(subjectId: number | null) {
  generateForm.versionId = null
  generateForm.volumeId = null
  genVersionOptions.value = []
  genVolumeOptions.value = []
  if (subjectId) {
    try { genVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { genVersionOptions.value = [] }
  }
}

async function onGenVersionChange(versionId: number | null) {
  generateForm.volumeId = null
  genVolumeOptions.value = []
  if (versionId) {
    try { genVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { genVolumeOptions.value = [] }
  }
}

function goCreate() {
  router.push('/teacher/papers/create')
}

function goDetail(paperId: number) {
  router.push(`/teacher/papers/${paperId}`)
}

function goEdit(paperId: number) {
  router.push(`/teacher/papers/create?id=${paperId}`)
}

async function handleDelete(item: Paper) {
  try {
    await ElMessageBox.confirm(`确认删除试卷【${item.paperName}】？`, '警告', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
    })
    await deletePaper(item.paperId)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleGenerate() {
  if (!generateForm.paperName || !generateForm.subjectId) {
    ElMessage.warning('请填写试卷名称和选择学科')
    return
  }
  const activeTypes = genQuestionTypeConfig.filter(r => r.count > 0)
  if (activeTypes.length === 0) {
    ElMessage.warning('请至少配置一种题型的题目数量')
    return
  }
  generating.value = true
  try {
    const generateRule = activeTypes.map(r => ({
      questionType: r.type,
      count: r.count,
      score: r.score,
      difficulty: r.difficulty
    }))
    await generatePaper({
      paperName: generateForm.paperName,
      paperType: generateForm.paperType,
      subjectId: generateForm.subjectId!,
      gradeId: generateForm.gradeId || undefined,
      versionId: generateForm.versionId || undefined,
      volumeId: generateForm.volumeId || undefined,
      duration: generateForm.duration,
      difficulty: generateForm.difficulty || undefined,
      totalQuestion: genTotalQuestion.value,
      generateRule: JSON.stringify(generateRule)
    })
    ElMessage.success('组卷成功')
    showGenerateDialog.value = false
    fetchList()
  } catch (e) {
    console.error(e)
  } finally {
    generating.value = false
  }
}

onMounted(async () => {
  try {
    const [subjects, grades] = await Promise.all([
      getSubjectOptions().catch(() => []),
      getGradeOptions().catch(() => [])
    ])
    subjectOptions.value = subjects
    gradeOptions.value = grades
  } catch { subjectOptions.value = []; gradeOptions.value = [] }
  fetchList()
})

useSeoMeta({ title: '我的试卷 - 教育云平台' })
</script>

<style scoped>
.teacher-paper-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.paper-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.paper-card {
  cursor: pointer;
}
.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  cursor: pointer;
}
.card-title:hover {
  color: #409eff;
}
.card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.card-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}
.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
@media (max-width: 768px) {
  .card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .card-actions {
    width: 100%;
    justify-content: flex-end;
  }
  .card-info {
    flex-wrap: wrap;
    gap: 8px;
  }
}
</style>
