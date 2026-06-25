<template>
  <div class="student-practice-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回我的作业
        </el-button>
      </div>

      <div class="page-header">
        <h1 class="page-title">智能练习</h1>
        <p class="page-desc">系统根据你的薄弱知识点智能推荐试题，帮你针对性提升</p>
      </div>

      <el-card shadow="never">
        <el-form label-width="100px">
          <el-form-item label="学科">
            <el-select v-model="subjectId" placeholder="请选择学科" style="width:240px">
              <el-option v-for="s in subjectList" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
            </el-select>
          </el-form-item>

          <el-form-item label="题目数量">
            <el-slider v-model="totalCount" :min="5" :max="30" :step="5" show-stops style="width:300px" />
            <span style="margin-left:12px">{{ totalCount }} 题</span>
          </el-form-item>

          <el-form-item label="难度偏好">
            <el-radio-group v-model="difficulty">
              <el-radio :value="null as any">自适应</el-radio>
              <el-radio :value="1">简单</el-radio>
              <el-radio :value="2">中等</el-radio>
              <el-radio :value="3">困难</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSmartSelect" :loading="loading" :disabled="!subjectId">
              智能选题
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <div v-if="questions.length > 0" class="questions-preview">
        <h3 style="margin:20px 0 12px">已选试题（{{ questions.length }}题）</h3>
        <el-card v-for="(q, idx) in questions" :key="q.question_id" class="question-card" shadow="never">
          <div class="question-header">
            <el-tag size="small">{{ questionTypeLabel(q.question_type) }}</el-tag>
            <el-tag size="small" type="warning">{{ difficultyLabel(q.difficulty) }}</el-tag>
            <span class="question-index">第{{ idx + 1 }}题</span>
          </div>
          <div class="question-content">{{ q.question_content }}</div>
        </el-card>

        <div style="margin-top:20px;text-align:center">
          <el-button type="primary" size="large" @click="handleCreatePractice" :loading="creating">
            生成练习
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()

const subjectId = ref<number | null>(null)
const totalCount = ref(10)
const difficulty = ref<number | undefined>(undefined)
const loading = ref(false)
const creating = ref(false)
const questions = ref<any[]>([])
const subjectList = ref<any[]>([])

let homeworkApi: any = null

async function init() {
  const mod = await import('@/composables/useHomeworkApi')
  homeworkApi = mod.useHomeworkApi()
  try {
    const res = await homeworkApi.getStudentPaperList({ pageSize: 100 })
    subjectList.value = (res?.rows || []).reduce((acc: any[], item: any) => {
      if (item.subjectId && !acc.find((s: any) => s.subjectId === item.subjectId)) {
        acc.push({ subjectId: item.subjectId, subjectName: item.subjectName })
      }
      return acc
    }, [])
  } catch { subjectList.value = [] }
}

function questionTypeLabel(type: number): string {
  const labels: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答' }
  return labels[type] || '其他'
}

function difficultyLabel(d: number): string {
  const labels: Record<number, string> = { 1: '简单', 2: '中等', 3: '困难' }
  return labels[d] || '未知'
}

async function handleSmartSelect() {
  if (!subjectId.value || !homeworkApi) return
  loading.value = true
  try {
    const res = await homeworkApi.smartSelectQuestions({
      subjectId: subjectId.value,
      totalCount: totalCount.value,
      difficulty: difficulty.value || undefined
    })
    questions.value = res || []
    if (questions.value.length === 0) {
      ElMessage.warning('未找到合适的试题，请调整筛选条件')
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleCreatePractice() {
  if (!homeworkApi || questions.value.length === 0) return
  creating.value = true
  try {
    const practiceData: any = {
      homeworkName: `智能练习-${subjectList.value.find((s: any) => s.subjectId === subjectId.value)?.subjectName || ''}`,
      homeworkType: 1,
      homeworkSource: 3,
      subjectId: subjectId.value,
      totalScore: questions.value.length * 10,
      questionCount: questions.value.length,
      publisherType: 3,
      status: 1
    }
    const createRes = await homeworkApi.createHomework(practiceData)
    const homeworkId = createRes?.data || createRes?.homeworkId
    if (homeworkId) {
      const questionList = questions.value.map((q: any, idx: number) => ({
        questionId: q.question_id,
        score: 10,
        sort: idx + 1
      }))
      await homeworkApi.saveHomeworkQuestions(homeworkId, questionList)
      ElMessage.success('练习创建成功，请前往"我的作业"查看')
      router.push('/student/homework')
    } else {
      ElMessage.error('创建练习失败')
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('创建练习失败')
  } finally {
    creating.value = false
  }
}

onMounted(() => {
  init()
})

definePageMeta({
  layout: 'default',
  middleware: ['auth']
})
</script>

<style scoped>
.student-practice-page {
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
.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.questions-preview {
  margin-top: 20px;
}
.question-card {
  margin-bottom: 12px;
}
.question-header {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
}
.question-index {
  font-weight: 600;
  color: #303133;
  margin-left: 8px;
}
.question-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}
</style>
