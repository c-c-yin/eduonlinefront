<template>
  <div class="practice-page">
    <div class="page-container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回试题列表
        </el-button>
      </div>

      <div v-if="!practiceStarted" class="practice-setup">
        <el-card>
          <template #header>
            <h2>练习模式</h2>
          </template>
          <el-form :model="setupForm" label-width="100px">
            <el-form-item label="题目数量">
              <el-input-number v-model="setupForm.count" :min="5" :max="50" :step="5" />
            </el-form-item>
            <el-form-item label="知识点">
              <el-input-number v-model="setupForm.knowledgeId" :min="0" placeholder="知识点ID" controls-position="right" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" size="large" :loading="starting" @click="startPractice">
                开始练习
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <div v-else class="practice-area">
        <div class="practice-header">
          <div class="progress-info">
            <span>第 {{ currentIndex + 1 }} / {{ questions.length }} 题</span>
            <el-progress :percentage="progressPercent" :stroke-width="10" style="width: 200px" />
          </div>
          <div class="timer">
            <el-icon><Clock /></el-icon>
            {{ formatTime(elapsedTime) }}
          </div>
          <el-button type="danger" @click="finishPractice">结束练习</el-button>
        </div>

        <div v-if="currentQuestion" class="question-card">
          <div class="question-meta">
            <el-tag :type="questionTypeTag">{{ questionTypeText }}</el-tag>
            <el-tag type="info">{{ difficultyText }}</el-tag>
          </div>

          <div class="question-content" v-html="currentQuestion.questionContentText || currentQuestion.questionCode" />

          <div v-if="currentQuestion.questionType <= 3" class="question-options">
            <div
              v-for="(opt, idx) in currentOptions"
              :key="idx"
              class="option-item"
              :class="{ selected: isOptionSelected(opt.optionKey) }"
              @click="selectAnswer(opt.optionKey)"
            >
              <span class="option-label">{{ opt.optionKey }}.</span>
              <span class="option-content" v-html="opt.optionContent" />
            </div>
          </div>

          <div v-else class="question-input">
            <el-input
              v-model="userAnswers[currentQuestion.questionId]"
              type="textarea"
              :rows="3"
              placeholder="请输入答案"
            />
          </div>

          <div class="question-nav">
            <el-button :disabled="currentIndex === 0" @click="prevQuestion">上一题</el-button>
            <el-button :disabled="currentIndex === questions.length - 1" @click="nextQuestion">下一题</el-button>
          </div>
        </div>

        <el-dialog v-model="showResult" title="练习结果" width="600px" :close-on-click-modal="false">
          <div class="result-summary">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="总题数">{{ questions.length }}</el-descriptions-item>
              <el-descriptions-item label="已作答">{{ answeredCount }}</el-descriptions-item>
              <el-descriptions-item label="用时">{{ formatTime(elapsedTime) }}</el-descriptions-item>
              <el-descriptions-item label="正确率">{{ correctRate }}%</el-descriptions-item>
            </el-descriptions>
          </div>
          <template #footer>
            <el-button @click="showResult = false">关闭</el-button>
            <el-button type="primary" @click="resetPractice">再来一次</el-button>
          </template>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Clock } from '@element-plus/icons-vue'
import type { Question } from '@/types'

const router = useRouter()
const { startPractice: apiStartPractice, submitAnswer: apiSubmitAnswer } = useQuestionApi()

const practiceStarted = ref(false)
const starting = ref(false)
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const userAnswers = ref<Record<number, string>>({})
const elapsedTime = ref(0)
const showResult = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const setupForm = reactive({
  count: 10,
  knowledgeId: undefined as number | undefined
})

const currentQuestion = computed(() => questions.value[currentIndex.value])
const progressPercent = computed(() =>
  questions.value.length ? Math.round(((currentIndex.value + 1) / questions.value.length) * 100) : 0
)
const answeredCount = computed(() => Object.keys(userAnswers.value).length)
const correctRate = computed(() => {
  let correct = 0
  let total = 0
  questions.value.forEach(q => {
    const answer = userAnswers.value[q.questionId]
    if (answer !== undefined && answer !== '') {
      total++
      if (checkAnswerCorrect(q, answer)) correct++
    }
  })
  return total > 0 ? Math.round((correct / total) * 100) : 0
})

const questionTypeMap: Record<number, string> = {
  1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题'
}
const difficultyMap: Record<number, string> = {
  1: '简单', 2: '中等', 3: '较难', 4: '困难', 5: '极难'
}
const questionTypeTagMap: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = {
  1: undefined, 2: 'success', 3: 'info', 4: 'warning', 5: 'danger', 6: 'danger', 7: 'danger'
}

const questionTypeText = computed(() => questionTypeMap[(currentQuestion.value as any)?.questionType || 0] || '未知')
const difficultyText = computed(() => difficultyMap[(currentQuestion.value as any)?.difficulty || 0] || '未知')
const questionTypeTag = computed(() => questionTypeTagMap[(currentQuestion.value as any)?.questionType || 0] || 'info')

const currentOptions = computed(() => {
  if (!currentQuestion.value?.optionsJson) return []
  try {
    return JSON.parse(currentQuestion.value.optionsJson)
  } catch {
    return []
  }
})

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

async function startPractice() {
  starting.value = true
  try {
    const res: any = await apiStartPractice({ count: setupForm.count })
    questions.value = res?.questions || []
    if (questions.value.length === 0) {
      ElMessage.warning('暂无符合条件的试题')
      return
    }
    practiceStarted.value = true
    userAnswers.value = {}
    currentIndex.value = 0
    elapsedTime.value = 0
    timer = setInterval(() => {
      elapsedTime.value++
    }, 1000)
  } catch (e) {
    console.error('开始练习失败', e)
    ElMessage.error('开始练习失败')
  } finally {
    starting.value = false
  }
}

function isOptionSelected(optionKey: string): boolean {
  const answer = userAnswers.value[(currentQuestion.value as any)?.questionId]
  if (!answer) return false
  if ((currentQuestion.value as any)?.questionType === 2) {
    return answer.split('').includes(optionKey)
  }
  return answer === optionKey
}

function selectAnswer(label: string) {
  if (!currentQuestion.value) return
  const qid = currentQuestion.value.questionId
  if (currentQuestion.value.questionType === 2) {
    const current = userAnswers.value[qid] || ''
    const selected = current.split('').filter(k => k)
    const idx = selected.indexOf(label)
    if (idx >= 0) {
      selected.splice(idx, 1)
    } else {
      selected.push(label)
    }
    userAnswers.value[qid] = selected.sort().join('')
  } else {
    userAnswers.value[qid] = label
  }
}

function checkAnswerCorrect(q: Question, answer: string): boolean {
  if (!q.answerContent) return false
  if (q.questionType === 2) {
    const userSorted = answer.split('').sort().join('')
    const correctSorted = q.answerContent.split('').sort().join('')
    return userSorted === correctSorted
  }
  if (q.questionType === 4) {
    const userParts = answer.split('|').map(s => s.trim()).filter(Boolean)
    const correctParts = q.answerContent.split('|').map(s => s.trim()).filter(Boolean)
    if (userParts.length !== correctParts.length) return false
    return userParts.every((part, i) => part === correctParts[i])
  }
  return answer === q.answerContent
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}

function finishPractice() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  showResult.value = true
}

function resetPractice() {
  showResult.value = false
  practiceStarted.value = false
  questions.value = []
  userAnswers.value = {}
  currentIndex.value = 0
  elapsedTime.value = 0
}

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

definePageMeta({ layout: 'default', middleware: ['auth'] })
</script>

<style scoped>
.practice-page {
  min-height: 100vh;
  background: #f5f7fa;
}
.page-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
}
.back-bar {
  margin-bottom: 16px;
}
.practice-setup {
  max-width: 500px;
  margin: 60px auto;
}
.practice-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}
.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}
.question-card {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.question-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.question-content {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 20px;
}
.question-options {
  margin-bottom: 20px;
}
.option-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: flex-start;
}
.option-item:hover {
  border-color: #409eff;
}
.option-item.selected {
  border-color: #409eff;
  background: #ecf5ff;
}
.option-label {
  font-weight: bold;
  margin-right: 8px;
  min-width: 24px;
}
.question-input {
  margin-bottom: 20px;
}
.question-nav {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}
</style>
