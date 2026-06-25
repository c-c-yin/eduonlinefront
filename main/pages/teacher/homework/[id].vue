<template>
  <div class="teacher-homework-detail-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回作业列表
        </el-button>
      </div>

      <div v-loading="loading">
        <div class="homework-header" v-if="homework">
          <h1 class="homework-title">{{ homework.homeworkName }}</h1>
          <div class="homework-tags">
            <el-tag :type="homework.homeworkSource === 1 ? 'success' : homework.homeworkSource === 3 ? 'primary' : 'warning'">
              {{ homework.homeworkSource === 1 ? '在线试卷' : homework.homeworkSource === 3 ? '在线试题' : '线下习题' }}
            </el-tag>
            <el-tag v-if="homework.publisherType === 1" type="info" size="small">管理员发布</el-tag>
            <el-tag size="small">{{ homework.subjectName }}</el-tag>
            <el-tag size="small" type="info">{{ homework.totalScore }}分</el-tag>
            <el-tag v-if="homework.status === 1" type="success">已发布</el-tag>
            <el-tag v-else-if="homework.status === 2" type="danger">已关闭</el-tag>
            <el-tag v-else type="info">草稿</el-tag>
          </div>
        </div>

        <div v-if="homework?.content" class="homework-content-box">
          <strong>作业内容：</strong>
          <p>{{ homework.content }}</p>
        </div>

        <div class="action-bar" v-if="homework">
          <el-button @click="handlePrint">打印</el-button>
          <el-button @click="handleDownloadTemplate">下载模板</el-button>
          <el-upload :action="''" :show-file-list="false" :http-request="handleImport" accept=".xlsx,.xls" style="display:inline-block;margin:0 8px">
            <el-button>导入Excel</el-button>
          </el-upload>
          <el-button type="primary" @click="handleSave" :disabled="homework.status === 2" :loading="saving">保存成绩</el-button>
          <el-button v-if="homework.publishMode === 3" type="warning" @click="goTierStats">分层统计</el-button>
        </div>

        <div class="knowledge-tags" v-if="knowledgeColumns.length > 0 && !isPaperBased">
          <span class="knowledge-label">知识点：</span>
          <el-tag v-for="(k, i) in knowledgeColumns" :key="i" size="small" style="margin-right:6px">
            {{ k.knowledge_name }}({{ k.score }}分)
          </el-tag>
        </div>

        <!-- 试卷试题模式：按题目分组录入 -->
        <template v-if="isPaperBased && paperQuestions.length > 0">
          <div v-for="(group, gIdx) in groupedQuestions" :key="'g' + gIdx" class="question-group">
            <el-tag type="info" size="large" effect="plain" class="group-tag">{{ group.name }}</el-tag>
            <div class="score-table">
              <el-table :data="scoreSheet" border stripe style="width:100%">
                <el-table-column label="学号" prop="studentNo" width="100" fixed />
                <el-table-column label="姓名" prop="studentName" width="80" fixed />
                <el-table-column label="班级" prop="className" width="100" />
                <el-table-column v-for="q in group.questions" :key="'q' + q.questionId" width="130" align="center">
                  <template #header>
                    <el-tooltip :content="q.questionContentText || '试题内容'" placement="top">
                      <span class="question-header">Q{{ globalQIdx(q.questionId) + 1 }}</span>
                    </el-tooltip>
                    <br/><span class="question-score-tip">满分{{ q.score }}</span>
                    <div v-if="q.knowledgeList && q.knowledgeList.length">
                      <el-tag v-for="k in q.knowledgeList" :key="k.knowledgeId" size="small" type="warning" effect="plain" style="margin:1px;font-size:10px">{{ k.knowledgeName }}</el-tag>
                    </div>
                  </template>
                  <template #default="{ row }">
                    <el-input-number
                      :model-value="getQScore(row.studentId, q.questionId)"
                      @update:model-value="(v: number | undefined) => setQScore(row.studentId, q.questionId, v ?? 0)"
                      :min="0" :max="q.score" :precision="1" size="small" controls-position="right" style="width:100%" placeholder="0" />
                  </template>
                </el-table-column>
                <el-table-column label="小计" width="90" align="center">
                  <template #header><span class="total-label">小计</span></template>
                  <template #default="{ row }">
                    <span class="total-value">{{ groupTotal(row.studentId, group.questions) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div class="knowledge-summary" v-if="knowledgeColumns.length">
            <span class="summary-label">知识点得分（自动计算）：</span>
            <el-tag v-for="k in knowledgeColumns" :key="k.knowledge_id" size="small" type="success" style="margin:2px">
              {{ k.knowledge_name }}
            </el-tag>
          </div>
        </template>

        <!-- 传统模式：按知识点录入 -->
        <template v-else>
          <div class="score-table">
            <el-table :data="scoreSheet" border stripe style="width:100%" :key="tableKey">
              <el-table-column label="学号" prop="studentNo" width="120" fixed />
              <el-table-column label="姓名" prop="studentName" width="100" fixed />
              <el-table-column label="班级" prop="className" width="120" />
              <el-table-column label="总分" width="140">
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.score"
                    :min="0"
                    :max="homework?.totalScore || 100"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    style="width:110px"
                    @change="calcTotal(row)"
                  />
                </template>
              </el-table-column>
              <el-table-column
                v-for="(kc, ki) in knowledgeColumns"
                :key="'k' + ki"
                :label="kc.knowledge_name + '(' + kc.score + ')'"
                min-width="130"
              >
                <template #default="{ row }">
                  <el-input-number
                    v-model="row.scoreList[ki]"
                    :min="0"
                    :max="kc.score"
                    :precision="1"
                    size="small"
                    controls-position="right"
                    style="width:90px"
                    @change="calcTotal(row)"
                  />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useHomeworkApi } from '@/composables/useHomeworkApi'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const route = useRoute()
const homeworkApi = useHomeworkApi()

const homeworkId = computed(() => Number(route.params.id))
const loading = ref(false)
const saving = ref(false)
const homework = ref<any>(null)
const scoreSheet = ref<any[]>([])
const knowledgeColumns = ref<any[]>([])
const tableKey = ref(0)

// 试卷模式相关
const isPaperBased = computed(() => homework.value?.homeworkSource === 1 && homework.value?.paperId)
const paperQuestions = ref<any[]>([])
// qScoreMap: { [studentId]: { [questionId]: number } }
const qScoreMap = reactive<Record<number, Record<number, number>>>({})

const groupedQuestions = computed(() => {
  if (paperQuestions.value.length === 0) return []
  const groupMap: Record<string, { name: string; questions: any[] }> = {}
  for (const q of paperQuestions.value) {
    const key = q.groupName || '默认'
    if (!groupMap[key]) groupMap[key] = { name: key, questions: [] }
    groupMap[key].questions.push(q)
  }
  return Object.values(groupMap)
})

function globalQIdx(qId: number): number {
  let idx = 0
  for (const g of groupedQuestions.value) {
    for (const q of g.questions) {
      if (q.questionId === qId) return idx
      idx++
    }
  }
  return idx
}

function getQScore(studentId: number, questionId: number): any {
  if (!qScoreMap[studentId]) {
    qScoreMap[studentId] = {}
  }
  // 使用 Proxy 拦截读取来支持 v-model 双向绑定
  if (!(questionId in qScoreMap[studentId])) {
    qScoreMap[studentId][questionId] = null as any
  }
  return qScoreMap[studentId][questionId]
}

function setQScore(studentId: number, questionId: number, val: number | null) {
  if (!qScoreMap[studentId]) {
    qScoreMap[studentId] = {}
  }
  qScoreMap[studentId][questionId] = val as any
}

function groupTotal(studentId: number, questions: any[]): number {
  let total = 0
  const map = qScoreMap[studentId]
  if (!map) return 0
  for (const q of questions) {
    const v = map[q.questionId]
    if (v != null && !isNaN(Number(v))) total += Number(v)
  }
  return Math.round(total * 10) / 10
}

async function init() {
  if (!homeworkId.value) return

  loading.value = true
  try {
    homework.value = await homeworkApi.getTeacherHomeworkDetail(homeworkId.value)

    if (homework.value?.knowledgeJson) {
      try {
        knowledgeColumns.value = typeof homework.value.knowledgeJson === 'string'
          ? JSON.parse(homework.value.knowledgeJson)
          : homework.value.knowledgeJson
      } catch { knowledgeColumns.value = [] }
    }

    // 试卷模式：加载试题和已有逐题得分
    if (isPaperBased.value) {
      try {
        const paperData = await homeworkApi.getPaperQuestionsForScore(homeworkId.value)
        paperQuestions.value = paperData?.questions || []
        // 回填已有得分
        const students = paperData?.students || []
        scoreSheet.value = (students || []).map((item: any) => {
          if (item.score != null && typeof item.score === 'string') {
            item.score = parseFloat(item.score)
          }
          return item
        })
        // 回填已有逐题得分
        for (const s of students) {
          if (s.questionScores && s.questionScores.length) {
            if (!qScoreMap[s.studentId]) qScoreMap[s.studentId] = {}
            for (const qs of s.questionScores) {
              (qScoreMap[s.studentId] as any)[qs.questionId] = qs.questionScore != null ? Number(qs.questionScore) : null as any
            }
          }
        }
      } catch { paperQuestions.value = [] }
    } else {
      // 传统模式
      const scores = await homeworkApi.getScoreSheet(homeworkId.value)
      scoreSheet.value = (scores || []).map((item: any) => {
        if (!item.scoreList) {
          item.scoreList = new Array(knowledgeColumns.value.length || 0).fill(null)
        }
        if (item.score != null && typeof item.score === 'string') {
          item.score = parseFloat(item.score)
        }
        if (item.scoreList && item.scoreList.length < knowledgeColumns.value.length) {
          const old = item.scoreList
          item.scoreList = new Array(knowledgeColumns.value.length).fill(null)
          for (let i = 0; i < old.length; i++) {
            item.scoreList[i] = old[i] != null ? parseFloat(old[i]) : null
          }
        }
        return item
      })
    }
    tableKey.value++
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function calcTotal(row: any) {
  if (knowledgeColumns.value.length > 0 && row.scoreList) {
    let total = 0
    let hasValue = false
    row.scoreList.forEach((s: any) => {
      if (s != null) { total += parseFloat(s); hasValue = true }
    })
    row.score = hasValue ? total : null
  }
}

async function handleSave() {
  // 试卷模式：提交逐题得分
  if (isPaperBased.value) {
    const items: any[] = []
    for (const s of scoreSheet.value) {
      const map = qScoreMap[s.studentId]
      if (!map) continue
      const questionScores: any[] = []
      let hasScore = false
      for (const q of paperQuestions.value) {
        const v = map[q.questionId]
        if (v != null && !isNaN(Number(v))) {
          hasScore = true
          questionScores.push({
            questionId: q.questionId,
            questionScore: Number(v),
            questionTotal: q.score || 0
          })
        }
      }
      if (hasScore) {
        items.push({
          studentId: s.studentId,
          classId: s.classId,
          questionScores
        })
      }
    }
    if (items.length === 0) {
      ElMessage.warning('没有填写任何成绩')
      return
    }

    saving.value = true
    try {
      await homeworkApi.batchSaveScores(homeworkId.value, items)
      ElMessage.success('成绩保存成功')
    } catch (e) {
      console.error(e)
    } finally {
      saving.value = false
    }
    return
  }

  // 传统模式
  const items = scoreSheet.value.filter((s: any) => s.score != null)
  if (items.length === 0) {
    ElMessage.warning('没有填写任何成绩')
    return
  }

  const data = items.map((s: any) => {
    const item: any = { studentId: s.studentId, classId: s.classId, score: s.score }
    if (knowledgeColumns.value.length > 0 && s.scoreList) {
      item.knowledgeList = knowledgeColumns.value.map((kc: any, i: number) => ({
        knowledgeName: kc.knowledge_name,
        knowledgeScore: s.scoreList[i] != null ? s.scoreList[i] : 0,
        knowledgeTotal: kc.score
      }))
    }
    return item
  })

  saving.value = true
  try {
    await homeworkApi.batchSaveScores(homeworkId.value, data)
    ElMessage.success('成绩保存成功')
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function handleDownloadTemplate() {
  try {
    const blob = await homeworkApi.downloadTemplate(homeworkId.value)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '成绩模板.xlsx'
    link.click()
    URL.revokeObjectURL(link.href)
  } catch (e) {
    console.error(e)
  }
}

async function handleImport(param: any) {
  const formData = new FormData()
  formData.append('file', param.file)
  loading.value = true
  try {
    await homeworkApi.importScores(homeworkId.value, formData)
    ElMessage.success('导入成功')
    init()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function goTierStats() {
  router.push(`/teacher/homework/tier-stats/${homeworkId.value}`)
}

function handlePrint() {
  window.print()
}

onMounted(() => {
  init()
})
</script>

<style scoped>
.teacher-homework-detail-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-bar {
  margin-bottom: 12px;
}
.homework-header {
  margin-bottom: 20px;
}
.homework-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.homework-tags {
  display: flex;
  gap: 8px;
}
.action-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.action-bar > :last-child {
  margin-left: auto;
}
.homework-content-box {
  background: #f0f9eb;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #303133;
}
.homework-content-box p {
  margin: 4px 0 0 0;
  white-space: pre-wrap;
  line-height: 1.6;
}
.knowledge-tags {
  margin-bottom: 16px;
  font-size: 13px;
  color: #606266;
}
.knowledge-label {
  font-weight: 500;
  margin-right: 4px;
}
.score-table {
  overflow-x: auto;
}
</style>