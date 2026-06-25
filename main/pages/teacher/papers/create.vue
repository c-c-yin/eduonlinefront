<template>
  <div class="create-paper-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回试卷列表
        </el-button>
      </div>

      <div class="page-header">
        <h1 class="page-title">{{ isEdit ? '编辑试卷' : '手动组卷' }}</h1>
      </div>

      <el-card shadow="never">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" v-loading="submitting">
          <el-form-item label="试卷名称" prop="paperName">
            <el-input v-model="form.paperName" placeholder="请输入试卷名称" maxlength="200" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="试卷类型" prop="paperType">
                <el-select v-model="form.paperType" placeholder="请选择" style="width:100%">
                  <el-option label="练习卷" :value="1" />
                  <el-option label="测试卷" :value="2" />
                  <el-option label="考试卷" :value="3" />
                  <el-option label="作业卷" :value="4" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="考试时长" prop="duration">
                <el-input-number v-model="form.duration" :min="10" :max="600" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="难度">
                <el-select v-model="form.difficulty" placeholder="请选择" clearable style="width:100%">
                  <el-option label="容易" :value="1" />
                  <el-option label="中等" :value="2" />
                  <el-option label="较难" :value="3" />
                  <el-option label="困难" :value="4" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">教材信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="学科" prop="subjectId">
                <el-select v-model="form.subjectId" placeholder="请选择" style="width:100%" @change="onSubjectChange">
                  <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="年级">
                <el-select v-model="form.gradeId" placeholder="请选择" clearable style="width:100%">
                  <el-option v-for="g in gradeOptions" :key="g.gradeId" :label="g.gradeName" :value="g.gradeId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="版本">
                <el-select v-model="form.versionId" placeholder="请选择" clearable style="width:100%" @change="onVersionChange">
                  <el-option v-for="v in versionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="册次">
                <el-select v-model="form.volumeId" placeholder="请选择" clearable style="width:100%" @change="onVolumeChange">
                  <el-option v-for="v in volumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="课题">
                <el-tree-select
                  v-model="form.topicId"
                  :data="topicTree"
                  :props="{ label: 'topicName', value: 'topicId', children: 'children' }"
                  placeholder="请选择课题"
                  clearable
                  check-strictly
                  style="width:100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="试卷描述">
            <el-input v-model="form.paperDesc" type="textarea" :rows="2" placeholder="可选描述" maxlength="500" show-word-limit />
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选备注" maxlength="500" show-word-limit />
          </el-form-item>

          <el-divider content-position="left">试题列表</el-divider>

          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 16px">
            <el-button type="primary" size="small" @click="openQuestionDialog">添加试题</el-button>
            <span style="font-size: 13px; color: #909399">
              共 {{ form.questionList.length }} 题，总分 {{ totalScore }} 分，及格分 {{ passScore }} 分
            </span>
          </div>

          <el-table :data="form.questionList" border size="small" style="width: 100%">
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column label="题型" width="90">
              <template #default="{ row }">
                <el-tag size="small">{{ questionTypeLabel(row.questionType) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="题干" min-width="200">
              <template #default="{ row }">
                <span v-html="truncateHtml(row.questionContent, 80)"></span>
              </template>
            </el-table-column>
            <el-table-column label="分组" width="120">
              <template #default="{ row }">
                <span>{{ row.groupName || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="难度" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="difficultyTagType(row.difficulty)">{{ difficultyLabel(row.difficulty) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="分值" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.score" :min="0.5" :max="100" :step="0.5" size="small" style="width:100px" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="form.questionList.splice($index, 1)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-form-item style="margin-top: 24px">
            <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
            <el-button @click="router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 选题对话框 -->
    <el-dialog v-model="showQuestionDialog" title="选择试题" width="900px" top="5vh">
      <el-alert v-if="form.subjectId" type="info" :closable="false" style="margin-bottom:12px">
        <template #title>
          当前筛选条件：学科{{ subjectLabel }}<span v-if="form.versionId"> / 版本{{ versionLabel }}</span><span v-if="form.volumeId"> / 册次{{ volumeLabel }}</span>
        </template>
      </el-alert>
      <div style="margin-bottom: 12px; display: flex; gap: 8px; flex-wrap: wrap">
        <el-select v-model="questionFilter.questionType" placeholder="题型" clearable size="small" style="width:120px">
          <el-option label="单选" :value="1" /><el-option label="多选" :value="2" />
          <el-option label="判断" :value="3" /><el-option label="填空" :value="4" />
          <el-option label="简答" :value="5" /><el-option label="计算" :value="6" />
        </el-select>
        <el-select v-model="questionFilter.difficulty" placeholder="难度" clearable size="small" style="width:100px">
          <el-option label="容易" :value="1" /><el-option label="中等" :value="2" />
          <el-option label="较难" :value="3" /><el-option label="困难" :value="4" />
        </el-select>
        <el-input v-model="questionFilter.keyword" placeholder="题干关键词" clearable size="small" style="width:200px" @keyup.enter="searchQuestions" />
        <el-button type="primary" size="small" @click="searchQuestions" :loading="questionLoading">查询</el-button>
      </div>
      <el-table ref="questionTableRef" :data="searchedQuestions" border size="small" max-height="400" @selection-change="onQuestionSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column label="题型" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ questionTypeLabel(row.questionType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="题干" min-width="250">
          <template #default="{ row }">
            <span v-html="truncateHtml(row.questionContent, 60)"></span>
          </template>
        </el-table-column>
        <el-table-column label="难度" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ difficultyLabel(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="defaultScore" label="默认分值" width="90" />
      </el-table>
      <template #footer>
        <el-button @click="showQuestionDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddQuestions">确认添加（{{ selectedQuestions.length }}题）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useTeacherPaperApi, type TeacherPaperForm } from '@/composables/useTeacherPaperApi'
import { useQuestionApi } from '@/composables/useQuestionApi'
import { useEducationApi } from '@/composables/useEducationApi'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const route = useRoute()
const { getPaperDetail, createPaper, updatePaper } = useTeacherPaperApi()
const { getQuestionList } = useQuestionApi()
const { getSubjectOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion, getGradeOptions, getTopicTree } = useEducationApi()

const isEdit = computed(() => !!route.query.id)
const submitting = ref(false)
const formRef = ref()
const questionTableRef = ref()

const subjectOptions = ref<any[]>([])
const gradeOptions = ref<any[]>([])
const versionOptions = ref<any[]>([])
const volumeOptions = ref<any[]>([])
const topicTree = ref<any[]>([])

const showQuestionDialog = ref(false)
const questionLoading = ref(false)
const searchedQuestions = ref<any[]>([])
const selectedQuestions = ref<any[]>([])
const questionFilter = reactive({
  questionType: null as number | null,
  difficulty: null as number | null,
  keyword: ''
})

const form = reactive<TeacherPaperForm>({
  paperName: '',
  paperType: 1,
  paperDesc: '',
  subjectId: null as any,
  gradeId: undefined,
  versionId: undefined,
  volumeId: undefined,
  topicId: undefined,
  duration: 120,
  difficulty: 2,
  questionList: [],
  remark: ''
})

const rules = {
  paperName: [{ required: true, message: '请输入试卷名称', trigger: 'blur' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  duration: [{ required: true, message: '请输入考试时长', trigger: 'blur' }]
}

const totalScore = computed(() => (form.questionList || []).reduce((sum: number, q: any) => sum + (q.score || 0), 0))
const passScore = computed(() => Math.round(totalScore.value * 0.6 * 10) / 10)

const subjectLabel = computed(() => subjectOptions.value.find((s: any) => s.subjectId === form.subjectId)?.subjectName || '')
const versionLabel = computed(() => versionOptions.value.find((v: any) => v.versionId === form.versionId)?.versionName || '')
const volumeLabel = computed(() => volumeOptions.value.find((v: any) => v.volumeId === form.volumeId)?.volumeName || '')

function questionTypeLabel(type: number): string {
  const labels: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算', 7: '应用', 8: '作文' }
  return labels[type] || '其他'
}

function difficultyLabel(d: number): string {
  const labels: Record<number, string> = { 1: '容易', 2: '中等', 3: '较难', 4: '困难' }
  return labels[d] || '未知'
}

function difficultyTagType(d: number): string {
  const map: Record<number, string> = { 1: 'success', 2: '', 3: 'warning', 4: 'danger' }
  return map[d] || ''
}

function truncateHtml(html: string, len: number): string {
  if (!html) return ''
  const text = html.replace(/<[^>]+>/g, '')
  return text.length > len ? text.substring(0, len) + '...' : text
}

async function onSubjectChange(subjectId: number) {
  form.versionId = undefined
  form.volumeId = undefined
  form.topicId = undefined
  versionOptions.value = []
  volumeOptions.value = []
  topicTree.value = []
  if (subjectId) {
    try { versionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { versionOptions.value = [] }
  }
}

async function onVersionChange(versionId: number) {
  form.volumeId = undefined
  form.topicId = undefined
  volumeOptions.value = []
  topicTree.value = []
  if (versionId) {
    try { volumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { volumeOptions.value = [] }
  }
}

async function onVolumeChange(volumeId: number) {
  form.topicId = undefined
  topicTree.value = []
  if (volumeId) {
    try { topicTree.value = await getTopicTree(volumeId) } catch { topicTree.value = [] }
  }
}

function openQuestionDialog() {
  showQuestionDialog.value = true
  searchQuestions()
}

async function searchQuestions() {
  questionLoading.value = true
  try {
    const params: any = { pageNum: 1, pageSize: 50, status: 2 }
    if (form.subjectId) params.subjectId = form.subjectId
    if (form.versionId) params.versionId = form.versionId
    if (form.volumeId) params.volumeId = form.volumeId
    if (form.gradeId) params.gradeId = form.gradeId
    if (questionFilter.questionType) params.questionType = questionFilter.questionType
    if (questionFilter.difficulty) params.difficulty = questionFilter.difficulty
    if (questionFilter.keyword) params.keyword = questionFilter.keyword
    const res = await getQuestionList(params)
    searchedQuestions.value = res.rows || []
    // 已选回显
    nextTick(() => {
      if (questionTableRef.value) {
        const existingIds = new Set((form.questionList || []).map((q: any) => q.questionId))
        searchedQuestions.value.forEach((row: any) => {
          if (existingIds.has(row.questionId)) {
            questionTableRef.value?.toggleRowSelection(row, true)
          }
        })
      }
    })
  } catch (e) {
    console.error(e)
  } finally {
    questionLoading.value = false
  }
}

function onQuestionSelectionChange(selection: any[]) {
  selectedQuestions.value = selection
}

function confirmAddQuestions() {
  const existingIds = new Set((form.questionList || []).map((q: any) => q.questionId))
  const newQuestions = selectedQuestions.value
    .filter(q => !existingIds.has(q.questionId))
    .map((q, idx) => ({
      questionId: q.questionId,
      questionType: q.questionType,
      questionContent: q.questionContent,
      difficulty: q.difficulty,
      score: q.defaultScore || 5,
      sort: (form.questionList?.length || 0) + idx + 1
    }))
  form.questionList = [...(form.questionList || []), ...newQuestions]
  showQuestionDialog.value = false
  ElMessage.success(`已添加 ${newQuestions.length} 题`)
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    submitting.value = true
    try {
      const data: any = { ...form }
      data.totalScore = totalScore.value
      data.totalQuestion = data.questionList?.length || 0
      if (isEdit.value) {
        data.paperId = Number(route.query.id)
        await updatePaper(data)
        ElMessage.success('修改成功')
      } else {
        await createPaper(data)
        ElMessage.success('创建成功')
      }
      router.push('/teacher/papers')
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  })
}

async function init() {
  try {
    const [subjects, grades] = await Promise.all([
      getSubjectOptions().catch(() => []),
      getGradeOptions().catch(() => [])
    ])
    subjectOptions.value = subjects
    gradeOptions.value = grades
  } catch { subjectOptions.value = []; gradeOptions.value = [] }

  if (isEdit.value) {
    try {
      const paper = await getPaperDetail(Number(route.query.id))
      if (paper) {
        form.paperName = paper.paperName
        form.paperType = paper.paperType
        form.paperDesc = paper.paperDesc || ''
        form.subjectId = paper.subjectId
        form.gradeId = paper.gradeId
        form.versionId = paper.versionId
        form.volumeId = paper.volumeId
        form.topicId = paper.topicId
        form.duration = paper.duration || 120
        form.difficulty = paper.difficulty
        form.questionList = (paper.questionList || []).map((q: any) => ({
          ...q,
          questionContent: q.questionContent,
          questionType: q.questionType,
          difficulty: q.difficulty,
          score: q.score || q.defaultScore || 5
        }))
        // 加载级联选项
        if (paper.subjectId) {
          try { versionOptions.value = await getVersionOptionsBySubject(paper.subjectId) } catch {}
        }
        if (paper.versionId) {
          try { volumeOptions.value = await getVolumeOptionsByVersion(paper.versionId) } catch {}
        }
        if (paper.volumeId) {
          try { topicTree.value = await getTopicTree(paper.volumeId) } catch {}
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
}

onMounted(() => { init() })

useSeoMeta({ title: isEdit.value ? '编辑试卷 - 教育云平台' : '手动组卷 - 教育云平台' })
</script>

<style scoped>
.create-paper-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-bar {
  margin-bottom: 12px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
}
</style>
