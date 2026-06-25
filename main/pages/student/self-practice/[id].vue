<template>
  <div class="self-practice-detail-page">
    <div class="container">
      <div class="page-header">
        <el-button text @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <h1 class="page-title">自批练习</h1>
        <p class="page-desc">线下做题后，对照答案逐题自批。错题自动归入错题本，知识点掌握度自动更新</p>
      </div>

      <div v-if="practice" class="practice-content">
        <!-- 题目列表 -->
        <div class="question-list">
          <div
            v-for="(q, idx) in practice.questions"
            :key="q.questionId"
            class="question-card"
            :class="{
              'is-correct': answers[idx]?.isCorrect === true,
              'is-wrong': answers[idx]?.isCorrect === false
            }"
          >
            <div class="question-header">
              <span class="q-number">第{{ idx + 1 }}题</span>
              <el-tag size="small" type="info">{{ q.questionTypeName }}</el-tag>
              <span class="q-score">{{ q.maxScore }}分</span>
              <el-tag size="small" type="success" effect="plain">{{ q.knowledgeName }}</el-tag>
            </div>

            <div class="question-body" v-html="q.content"></div>

            <!-- 选项（选择题） -->
            <div v-if="q.options && q.options.length > 0" class="options-list">
              <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="option-item">
                {{ optionLabel(oIdx) }}. {{ opt }}
              </div>
            </div>

            <!-- 自批区域 -->
            <div class="self-score-area">
              <div class="answer-row">
                <span class="answer-label">你的答案：</span>
                <el-input
                  v-model="answers[idx].studentAnswer"
                  placeholder="请输入你的答案"
                  style="width: 300px"
                  :disabled="submitted"
                />
              </div>
              <div class="answer-row">
                <span class="answer-label">正确答案：</span>
                <span class="correct-answer">{{ q.answer }}</span>
              </div>

              <div v-if="!submitted" class="judge-row">
                <span class="answer-label">判对错：</span>
                <el-radio-group v-model="answers[idx].isCorrectBool">
                  <el-radio :value="true">正确</el-radio>
                  <el-radio :value="false">错误</el-radio>
                </el-radio-group>
              </div>

              <div v-if="submitted && !answers[idx].isCorrect" class="analysis-box">
                <strong>解析：</strong>
                <span v-html="q.analysis"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div v-if="!submitted" class="submit-area">
          <el-button type="primary" size="large" :loading="submitting" @click="handleSubmit">
            提交自批结果
          </el-button>
        </div>

        <!-- 结果展示 -->
        <div v-if="submitted && result" class="result-panel">
          <h3 class="result-title">批改完成！</h3>
          <div class="result-stats">
            <div class="result-stat">
              <span class="rs-value">{{ result.totalScore }}</span>
              <span class="rs-label">总分</span>
            </div>
            <div class="result-stat">
              <span class="rs-value correct">{{ result.correctCount }}</span>
              <span class="rs-label">正确</span>
            </div>
            <div class="result-stat">
              <span class="rs-value wrong">{{ result.wrongCount }}</span>
              <span class="rs-label">错误</span>
            </div>
            <div class="result-stat">
              <span class="rs-value rate">{{ result.correctRate }}%</span>
              <span class="rs-label">正确率</span>
            </div>
          </div>

          <div v-if="result.wrongKnowledge.length > 0" class="wrong-knowledge">
            <h4>错题知识点：</h4>
            <div class="wk-tags">
              <el-tag
                v-for="w in result.wrongKnowledge"
                :key="w.knowledgeName"
                type="danger"
                effect="dark"
              >
                {{ w.knowledgeName }} ({{ w.wrongCount }}题)
              </el-tag>
            </div>
            <p class="auto-hint">错题已自动归入错题本，知识点掌握度已更新</p>
          </div>

          <div class="result-actions">
            <el-button type="primary" @click="goPractice">再练一组</el-button>
            <el-button @click="goWrongBook">查看错题本</el-button>
            <el-button @click="goKnowledgeReport">查看学习报告</el-button>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <el-empty description="练习不存在或已过期" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useSelfPracticeApi, type SelfPracticeHomework, type SelfScoreAnswer, type SelfScoreResult } from '@/composables/useSelfPracticeApi'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const route = useRoute()
const router = useRouter()
const { getPracticeDetail, submitSelfScore } = useSelfPracticeApi()

const homeworkId = computed(() => Number(route.params.id))
const practice = ref<SelfPracticeHomework | null>(null)
const loading = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const result = ref<SelfScoreResult | null>(null)

interface AnswerItem {
  studentAnswer: string
  isCorrect: boolean
  isCorrectBool: boolean | null
}

const answers = ref<AnswerItem[]>([])

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function optionLabel(idx: number): string {
  return OPTION_LABELS[idx] || String(idx)
}

function goBack() {
  router.push('/student/self-practice')
}

async function fetchPractice() {
  loading.value = true
  try {
    practice.value = await getPracticeDetail(homeworkId.value)
    // 初始化答案数组
    answers.value = practice.value.questions.map(() => ({
      studentAnswer: '',
      isCorrect: false,
      isCorrectBool: null
    }))
  } catch {
    practice.value = null
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  // 检查是否有未判对错的题目
  const unchecked = answers.value.findIndex(a => a.isCorrectBool === null)
  if (unchecked >= 0) {
    ElMessage.warning(`第${unchecked + 1}题尚未判对错`)
    return
  }

  // 构建提交数据
  const scoreAnswers: SelfScoreAnswer[] = answers.value.map((a, idx) => ({
    questionId: practice.value!.questions[idx].questionId,
    studentAnswer: a.studentAnswer,
    isCorrect: a.isCorrectBool!
  }))

  submitting.value = true
  try {
    result.value = await submitSelfScore(homeworkId.value, scoreAnswers)
    submitted.value = true
    ElMessage.success('自批完成，错题已自动归入错题本')
  } catch {
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function goPractice() {
  router.push('/student/self-practice')
}

function goWrongBook() {
  router.push('/student/wrong')
}

function goKnowledgeReport() {
  router.push('/student/knowledge-report')
}

onMounted(() => {
  fetchPractice()
})

useSeoMeta({
  title: '自批练习 - 教育云平台'
})
</script>

<style scoped>
.self-practice-detail-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin: 8px 0 4px;
}

.page-desc {
  font-size: 13px;
  color: #909399;
  margin: 0;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #e0e0e0;
  transition: border-color 0.2s;
}

.question-card.is-correct {
  border-left-color: #43e97b;
}

.question-card.is-wrong {
  border-left-color: #f56c6c;
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.q-number {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.q-score {
  font-size: 13px;
  color: #999;
}

.question-body {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  margin-bottom: 12px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.option-item {
  font-size: 14px;
  color: #555;
}

.self-score-area {
  padding-top: 16px;
  border-top: 1px dashed #e0e0e0;
}

.answer-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.answer-label {
  font-size: 14px;
  color: #666;
  min-width: 90px;
  text-align: right;
}

.correct-answer {
  font-size: 15px;
  font-weight: 600;
  color: #43e97b;
}

.judge-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.analysis-box {
  margin-top: 8px;
  padding: 12px;
  background: #fef0f0;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.submit-area {
  text-align: center;
  padding: 24px 0;
}

.result-panel {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
  border: 2px solid #43e97b;
}

.result-title {
  font-size: 22px;
  color: #43e97b;
  margin: 0 0 20px;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 24px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.rs-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
}

.rs-value.correct {
  color: #43e97b;
}

.rs-value.wrong {
  color: #f56c6c;
}

.rs-value.rate {
  color: #667eea;
}

.rs-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.wrong-knowledge {
  padding: 16px;
  background: #fef0f0;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: left;
}

.wrong-knowledge h4 {
  margin: 0 0 10px;
  font-size: 14px;
  color: #333;
}

.wk-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.auto-hint {
  font-size: 12px;
  color: #999;
  margin: 0;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.empty-state {
  padding: 80px 0;
}
</style>