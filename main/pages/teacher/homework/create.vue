<template>
  <div class="create-homework-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回作业列表
        </el-button>
      </div>

      <div class="page-header">
        <h1 class="page-title">{{ isEdit ? '编辑作业' : '创建作业' }}</h1>
      </div>

      <el-card shadow="never">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" v-loading="submitting">
          <el-form-item label="作业名称" prop="homeworkName">
            <el-input v-model="form.homeworkName" placeholder="请输入作业名称" maxlength="100" />
          </el-form-item>

          <el-form-item label="作业类型" prop="homeworkType">
            <el-select v-model="form.homeworkType" placeholder="请选择" style="width: 200px">
              <el-option label="练习作业" :value="1" />
              <el-option label="课后作业" :value="2" />
              <el-option label="随堂作业" :value="3" />
              <el-option label="月考作业" :value="4" />
              <el-option label="期中作业" :value="5" />
              <el-option label="期末作业" :value="6" />
            </el-select>
          </el-form-item>

          <el-form-item label="作业来源" prop="homeworkSource">
            <el-radio-group v-model="form.homeworkSource" @change="onSourceChange">
              <el-radio :value="1">在线试卷</el-radio>
              <el-radio :value="2">线下习题</el-radio>
              <el-radio :value="3">在线试题</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.homeworkSource === 1" label="选择试卷">
            <div style="width:100%">
              <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
                <el-select v-model="paperFilter.subjectId" placeholder="学科" clearable size="small" style="width:140px" @change="onPaperSubjectChange">
                  <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
                </el-select>
                <el-select v-model="paperFilter.versionId" placeholder="版本" clearable size="small" style="width:120px" :disabled="!paperFilter.subjectId" @change="onPaperVersionChange">
                  <el-option v-for="v in paperVersionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
                </el-select>
                <el-select v-model="paperFilter.volumeId" placeholder="册次" clearable size="small" style="width:120px" :disabled="!paperFilter.versionId">
                  <el-option v-for="v in paperVolumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
                </el-select>
                <el-button type="primary" size="small" @click="loadPapers">查询试卷</el-button>
              </div>
              <el-select
                v-model="form.paperId"
                filterable
                placeholder="请搜索并选择试卷"
                style="width: 400px"
                @change="onPaperSelected"
              >
                <el-option
                  v-for="p in paperOptions"
                  :key="p.paperId"
                  :label="p.paperName"
                  :value="p.paperId"
                />
              </el-select>
              <span v-if="form.paperName" style="margin-left:12px;color:#409EFF">{{ form.paperName }}（{{ form.totalScore }}分）</span>
            </div>
          </el-form-item>

          <el-form-item v-if="form.homeworkSource === 3" label="选择试题">
            <div style="width:100%">
              <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
                <el-select v-model="questionFilter.knowledgeId" placeholder="知识点" clearable size="small" style="width:160px">
                  <el-option v-for="k in knowledgeOptions" :key="k.knowledge_id" :label="k.knowledge_name" :value="k.knowledge_id" />
                </el-select>
                <el-select v-model="questionFilter.questionType" placeholder="题型" clearable size="small" style="width:120px">
                  <el-option label="单选" :value="1" /><el-option label="多选" :value="2" />
                  <el-option label="判断" :value="3" /><el-option label="填空" :value="4" />
                  <el-option label="简答" :value="5" />
                </el-select>
                <el-select v-model="questionFilter.difficulty" placeholder="难度" clearable size="small" style="width:100px">
                  <el-option label="简单" :value="1" /><el-option label="中等" :value="2" /><el-option label="困难" :value="3" />
                </el-select>
                <el-button type="primary" size="small" @click="searchQuestions" :loading="questionLoading">查询试题</el-button>
              </div>
              <div v-if="searchedQuestions.length > 0" style="margin-bottom:12px">
                <el-checkbox v-model="selectAllQuestions" @change="(val: any) => toggleAllQuestions(val)" style="margin-bottom:8px">全选/反选</el-checkbox>
                <div class="question-search-list">
                  <div v-for="q in searchedQuestions" :key="q.question_id" class="question-search-item">
                    <el-checkbox v-model="q._selected" @change="onQuestionSelect(q)">
                      <el-tag size="small" style="margin-right:4px">{{ questionTypeLabel(q.question_type) }}</el-tag>
                      <el-tag size="small" type="warning" style="margin-right:4px">{{ difficultyLabel(q.difficulty) }}</el-tag>
                      <span>{{ truncate(q.question_content, 60) }}</span>
                    </el-checkbox>
                    <el-input-number v-if="q._selected" v-model="q._score" :min="1" :max="50" size="small" style="width:90px;margin-left:8px" />
                  </div>
                </div>
              </div>
              <div v-if="selectedQuestions.length > 0" style="margin-top:12px">
                <span style="font-weight:600">已选 {{ selectedQuestions.length }} 题</span>
                <span style="margin-left:12px;color:#909399">总分: {{ selectedTotalScore }} 分</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item v-if="form.homeworkSource === 2" label="作业内容" prop="content">
            <el-input
              v-model="form.content"
              type="textarea"
              :rows="3"
              placeholder="描述线下习题内容，如：第三课课后1-5题"
              maxlength="2000"
              show-word-limit
            />
          </el-form-item>

          <el-divider content-position="left">基本信息</el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学科" prop="subjectId">
                <el-select v-model="form.subjectId" placeholder="请选择" style="width:100%" @change="onSubjectChange">
                  <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="满分" prop="totalScore">
                <el-input-number v-model="form.totalScore" :min="1" :max="999" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="学段" prop="stageId">
                <el-select v-model="form.stageId" placeholder="请选择" clearable style="width:100%">
                  <el-option v-for="s in stageOptions" :key="s.stageId" :label="s.stageName" :value="s.stageId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="年级" prop="gradeId">
                <el-select v-model="form.gradeId" placeholder="请选择" clearable style="width:100%">
                  <el-option v-for="g in gradeOptions" :key="g.gradeId" :label="g.gradeName" :value="g.gradeId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="版本" prop="versionId">
                <el-select v-model="form.versionId" placeholder="请选择" clearable style="width:100%" @change="onVersionChange">
                  <el-option v-for="v in versionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="册别" prop="volumeId">
                <el-select v-model="form.volumeId" placeholder="请选择" clearable style="width:100%" @change="onVolumeChange">
                  <el-option v-for="v in volumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="发布范围" prop="publishScope">
                <el-select v-model="form.publishScope" style="width:100%">
                  <el-option label="按年级" :value="1" />
                  <el-option label="按班级" :value="2" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="权重">
                <el-input-number v-model="form.weight" :min="0.1" :max="10" :precision="2" :step="0.1" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item v-if="form.publishScope === 2" label="班级">
            <el-select v-model="form.classIds" multiple placeholder="请选择班级" style="width:100%">
              <el-option v-for="c in myClasses" :key="c.classId" :label="c.className" :value="c.classId" />
            </el-select>
          </el-form-item>

          <el-divider content-position="left">发布模式</el-divider>

          <el-form-item label="发布模式" prop="publishMode">
            <el-radio-group v-model="form.publishMode">
              <el-radio :value="1">全班统一</el-radio>
              <el-radio :value="2">指定学生</el-radio>
              <el-radio :value="3">分层发布</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item v-if="form.publishMode === 2 && form.classIds.length > 0" label="选择学生">
            <ClassStudentSelector
              v-for="cid in form.classIds"
              :key="cid"
              :class-id="cid"
              :subject-id="form.subjectId"
              v-model="selectedStudentIds"
              style="margin-bottom:12px"
            />
          </el-form-item>

          <el-form-item v-if="form.publishMode === 3" label="分层配置">
            <TierConfigPanel
              :homework-id="savedHomeworkId"
              :reference-homework-id="referenceHomeworkId"
              :class-id="form.classIds[0]"
              :subject-id="form.subjectId"
              @tier-updated="onTierUpdated"
            />
            <div v-if="!savedHomeworkId" style="color:#e6a23c;font-size:13px;margin-top:4px">
              请先保存作业基本信息，再进行分层配置
            </div>
          </el-form-item>

          <el-divider content-position="left">知识点配置（可选）</el-divider>

          <div style="margin-bottom: 12px">
            <el-button size="small" @click="addKnowledge" :disabled="form.homeworkSource === 1">+ 添加知识点</el-button>
            <el-button
              v-if="form.homeworkSource === 1 && form.paperId"
              size="small"
              type="primary"
              @click="autoFillKnowledge"
            >从试卷自动填充</el-button>
          </div>

          <div v-for="(item, idx) in form.knowledgeList" :key="idx" class="knowledge-row">
            <el-input v-model="item.knowledge_name" placeholder="知识点名称" style="flex:2" />
            <el-input-number v-model="item.score" :min="1" placeholder="分值" style="flex:1" controls-position="right" />
            <el-button link type="danger" @click="form.knowledgeList.splice(idx, 1)">删除</el-button>
          </div>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" placeholder="可选备注" maxlength="500" show-word-limit />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">保存</el-button>
            <el-button @click="router.back()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useHomeworkApi } from '@/composables/useHomeworkApi'
import { useEducationApi } from '@/composables/useEducationApi'
import ClassStudentSelector from '@/components/homework/ClassStudentSelector.vue'
import TierConfigPanel from '@/components/homework/TierConfigPanel.vue'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const route = useRoute()
const homeworkApi = useHomeworkApi()
const { getSubjectOptions, getStageOptions, getGradeOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion, getTopicTree } = useEducationApi()

const isEdit = computed(() => !!route.query.id)
const submitting = ref(false)
const formRef = ref()

const myClasses = ref<any[]>([])
const paperOptions = ref<any[]>([])
const subjectOptions = ref<any[]>([])
const stageOptions = ref<any[]>([])
const gradeOptions = ref<any[]>([])
const versionOptions = ref<any[]>([])
const volumeOptions = ref<any[]>([])
const paperVersionOptions = ref<any[]>([])
const paperVolumeOptions = ref<any[]>([])
const knowledgeOptions = ref<any[]>([])
const searchedQuestions = ref<any[]>([])
const questionLoading = ref(false)
const questionFilter = reactive({ knowledgeId: null, questionType: null, difficulty: null })
const selectAllQuestions = ref(false)
const selectedStudentIds = ref<number[]>([])
const savedHomeworkId = ref<number | null>(null)
const referenceHomeworkId = ref<number | undefined>(undefined)

const paperFilter = reactive({
  subjectId: null as number | null,
  versionId: null as number | null,
  volumeId: null as number | null
})

const form = reactive<any>({
  homeworkName: '',
  homeworkType: 1,
  homeworkSource: 1,
  paperId: null,
  paperName: null,
  content: '',
  subjectId: null,
  totalScore: 100,
  stageId: null,
  gradeId: null,
  versionId: null,
  volumeId: null,
  publishScope: 1,
  classIds: [],
  weight: 1.0,
  publishMode: 1,
  knowledgeList: [],
  remark: ''
})

const rules = {
  homeworkName: [{ required: true, message: '请输入作业名称', trigger: 'blur' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  homeworkSource: [{ required: true, message: '请选择来源', trigger: 'change' }],
  totalScore: [{ required: true, message: '请输入满分', trigger: 'blur' }],
  stageId: [{ required: true, message: '请选择学段', trigger: 'change' }]
}

async function init() {
  try {
    const [subjects, stages, grades, classes] = await Promise.all([
      getSubjectOptions().catch(() => []),
      getStageOptions().catch(() => []),
      getGradeOptions().catch(() => []),
      homeworkApi.getMyClasses().catch(() => [])
    ])
    subjectOptions.value = subjects
    stageOptions.value = stages
    gradeOptions.value = grades
    myClasses.value = classes || []
  } catch { myClasses.value = [] }

  if (isEdit.value) {
    try {
      const res = await homeworkApi.getTeacherHomeworkDetail(Number(route.query.id))
      if (res) {
        Object.assign(form, res)
        if (res.knowledgeJson) {
          try {
            form.knowledgeList = typeof res.knowledgeJson === 'string'
              ? JSON.parse(res.knowledgeJson)
              : res.knowledgeJson
          } catch { form.knowledgeList = [] }
        }
        // 加载级联选项
        if (res.subjectId) {
          try { versionOptions.value = await getVersionOptionsBySubject(res.subjectId) } catch {}
        }
        if (res.versionId) {
          try { volumeOptions.value = await getVolumeOptionsByVersion(res.versionId) } catch {}
        }
      }
    } catch (e) {
      console.error(e)
    }
  }
}

function onSourceChange() {
  if (form.homeworkSource === 1) {
    form.paperId = null
    form.paperName = null
    form.knowledgeList = []
  }
  if (form.homeworkSource === 3) {
    form.paperId = null
    form.paperName = null
  }
}

// 试卷选择器级联
async function onPaperSubjectChange(subjectId: number | null) {
  paperFilter.versionId = null
  paperFilter.volumeId = null
  paperVersionOptions.value = []
  paperVolumeOptions.value = []
  if (subjectId) {
    try { paperVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { paperVersionOptions.value = [] }
  }
}

async function onPaperVersionChange(versionId: number | null) {
  paperFilter.volumeId = null
  paperVolumeOptions.value = []
  if (versionId) {
    try { paperVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { paperVolumeOptions.value = [] }
  }
}

async function loadPapers() {
  try {
    const res = await homeworkApi.getAvailablePapers({
      subjectId: paperFilter.subjectId || undefined,
      versionId: paperFilter.versionId || undefined,
      volumeId: paperFilter.volumeId || undefined
    })
    paperOptions.value = res.rows || []
  } catch { paperOptions.value = [] }
}

function onPaperSelected(val: number) {
  const p = paperOptions.value.find((x: any) => x.paperId === val)
  if (p) {
    form.paperName = p.paperName
    form.totalScore = p.totalScore
    if (p.subjectId) form.subjectId = p.subjectId
    if (p.stageId) form.stageId = p.stageId
  }
}

// 基本信息级联
async function onSubjectChange(subjectId: number) {
  form.versionId = undefined
  form.volumeId = undefined
  versionOptions.value = []
  volumeOptions.value = []
  knowledgeOptions.value = []
  if (subjectId) {
    try { versionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { versionOptions.value = [] }
  }
}

async function onVersionChange(versionId: number) {
  form.volumeId = undefined
  volumeOptions.value = []
  knowledgeOptions.value = []
  if (versionId) {
    try { volumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { volumeOptions.value = [] }
  }
}

async function onVolumeChange(volumeId: number) {
  knowledgeOptions.value = []
  if (volumeId) {
    try {
      const tree = await getTopicTree(volumeId)
      knowledgeOptions.value = flattenTree(tree)
    } catch { knowledgeOptions.value = [] }
  }
}

function flattenTree(tree: any[]): any[] {
  const result: any[] = []
  function walk(nodes: any[]) {
    for (const node of nodes) {
      result.push({ knowledge_id: node.topicId, knowledge_name: node.topicName })
      if (node.children?.length) walk(node.children)
    }
  }
  walk(tree)
  return result
}

async function autoFillKnowledge() {
  if (!form.paperId) return
  try {
    const data = await homeworkApi.getKnowledgeFromPaper(form.paperId)
    if (Array.isArray(data)) {
      form.knowledgeList = data.map((item: any) => ({
        knowledge_id: item.knowledge_id,
        knowledge_name: item.knowledge_name,
        score: item.score
      }))
      ElMessage.success('已从试卷自动填充知识点')
    }
  } catch (e) {
    console.error(e)
  }
}

function addKnowledge() {
  form.knowledgeList.push({ knowledge_id: null, knowledge_name: '', score: 20 })
}

const selectedQuestions = computed(() => searchedQuestions.value.filter((q: any) => q._selected))
const selectedTotalScore = computed(() => {
  return selectedQuestions.value.reduce((sum: number, q: any) => sum + (q._score || 0), 0)
})

function questionTypeLabel(type: number): string {
  const labels: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答' }
  return labels[type] || '其他'
}

function difficultyLabel(d: number): string {
  const labels: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' }
  return labels[d] || '未知'
}

function truncate(str: string, len: number): string {
  if (!str) return ''
  return str.length > len ? str.substring(0, len) + '...' : str
}

async function searchQuestions() {
  if (!form.subjectId) {
    ElMessage.warning('请先选择学科')
    return
  }
  questionLoading.value = true
  try {
    const res = await homeworkApi.selectQuestions({
      subjectId: form.subjectId,
      knowledgeId: questionFilter.knowledgeId || undefined,
      questionType: questionFilter.questionType || undefined,
      difficulty: questionFilter.difficulty || undefined,
      limit: 30
    })
    searchedQuestions.value = (res || []).map((q: any) => ({
      ...q,
      _selected: false,
      _score: q.difficulty === 3 ? 5 : q.difficulty === 2 ? 4 : 3
    }))
  } catch (e) {
    console.error(e)
  } finally {
    questionLoading.value = false
  }
}

function toggleAllQuestions(val: boolean) {
  searchedQuestions.value.forEach((q: any) => { q._selected = val })
}

function onQuestionSelect(q: any) {
  if (q._selected && !q._score) {
    q._score = q.difficulty === 3 ? 5 : q.difficulty === 2 ? 4 : 3
  }
}

function onTierUpdated(tierConfig: string, studentTierMap: Record<number, number>) {
  form.tierConfig = tierConfig
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    if (form.homeworkSource === 1 && !form.paperId) {
      ElMessage.warning('请选择关联试卷')
      return
    }
    if (form.homeworkSource === 3 && selectedQuestions.value.length === 0) {
      ElMessage.warning('请至少选择一道试题')
      return
    }

    submitting.value = true
    try {
      const data = { ...form }
      if (data.knowledgeList?.length > 0) {
        const hasEmpty = data.knowledgeList.some((k: any) => !k.knowledge_name)
        if (hasEmpty) {
          ElMessage.warning('知识点名称不能为空')
          submitting.value = false
          return
        }
        data.knowledgeJson = JSON.stringify(data.knowledgeList.map((k: any) => ({
          knowledge_id: k.knowledge_id || null,
          knowledge_name: k.knowledge_name,
          score: k.score
        })))
      } else {
        data.knowledgeJson = null
      }
      delete data.knowledgeList

      if (isEdit.value) {
        await homeworkApi.updateHomework(data)
        ElMessage.success('修改成功')
      } else {
        const res = await homeworkApi.createHomework(data)
        if (res?.data?.homeworkId || res?.homeworkId) {
          savedHomeworkId.value = res?.data?.homeworkId || res?.homeworkId
        }
        if (form.publishMode === 2 && selectedStudentIds.value.length > 0 && savedHomeworkId.value) {
          await homeworkApi.assignStudents(savedHomeworkId.value, selectedStudentIds.value)
        }
        if (form.publishMode !== 3) {
          router.push('/teacher/homework')
          return
        }
        ElMessage.success('作业已保存，请继续配置分层')
        return
      }
      router.push('/teacher/homework')
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  init()
})
</script>

<style scoped>
.create-homework-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 800px;
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
.knowledge-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}
.question-search-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 8px;
}
.question-search-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f2f6fc;
}
.question-search-item:last-child {
  border-bottom: none;
}
</style>