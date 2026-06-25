<template>
  <div class="self-practice-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">组题练习</h1>
        <p class="page-desc">自主选择题型、难度和知识点，生成练习作业，线下做题后在线自批</p>
      </div>

      <div class="practice-form">
        <el-form :model="form" label-width="100px" class="config-form">
          <el-form-item label="学科">
            <el-select v-model="form.subjectId" placeholder="选择学科" style="width: 200px">
              <el-option label="数学" :value="2" />
              <el-option label="语文" :value="1" />
              <el-option label="英语" :value="3" />
              <el-option label="物理" :value="4" />
              <el-option label="化学" :value="5" />
            </el-select>
          </el-form-item>

          <el-form-item label="题型">
            <el-checkbox-group v-model="form.questionTypes">
              <el-checkbox :value="1">单选题</el-checkbox>
              <el-checkbox :value="2">多选题</el-checkbox>
              <el-checkbox :value="3">判断题</el-checkbox>
              <el-checkbox :value="4">填空题</el-checkbox>
              <el-checkbox :value="5">简答题</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item label="难度">
            <el-radio-group v-model="form.difficulty">
              <el-radio :value="0">不限</el-radio>
              <el-radio :value="1">简单</el-radio>
              <el-radio :value="2">中等</el-radio>
              <el-radio :value="3">困难</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="题目数量">
            <el-input-number v-model="form.questionCount" :min="5" :max="50" :step="5" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="generating" @click="handleGenerate">
              开始组题
            </el-button>
            <el-button @click="handleSmartSelect" :loading="generating">
              智能组题（基于薄弱点）
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 生成的练习 -->
      <div v-if="practice" class="practice-result">
        <div class="result-header">
          <h3>练习已生成</h3>
          <el-button type="primary" @click="goPracticeDetail(practice.homeworkId)">
            开始自批
          </el-button>
        </div>
        <div class="result-info">
          <span>题目数量：{{ practice.questionCount }} 题</span>
          <span>总分：{{ practice.totalScore }} 分</span>
          <span>难度：{{ difficultyLabel(form.difficulty) }}</span>
        </div>
        <div class="question-preview">
          <div v-for="(q, idx) in practice.questions.slice(0, 5)" :key="q.questionId" class="question-item">
            <span class="q-index">{{ idx + 1 }}.</span>
            <span class="q-type">{{ q.questionTypeName }}</span>
            <span class="q-knowledge">{{ q.knowledgeName }}</span>
          </div>
          <p v-if="practice.questions.length > 5" class="more-hint">
            ... 还有 {{ practice.questions.length - 5 }} 道题
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useSelfPracticeApi, type SelfPracticeHomework } from '@/composables/useSelfPracticeApi'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const router = useRouter()
const { smartSelectQuestions, selectQuestions } = useSelfPracticeApi()

const form = reactive({
  subjectId: 2,
  questionTypes: [1, 2, 4] as number[],
  difficulty: 0,
  questionCount: 10
})

const generating = ref(false)
const practice = ref<SelfPracticeHomework | null>(null)

const DIFFICULTY_LABELS: Record<number, string> = { 0: '不限', 1: '简单', 2: '中等', 3: '困难' }

function difficultyLabel(d: number): string {
  return DIFFICULTY_LABELS[d] || '不限'
}

async function handleGenerate() {
  if (form.questionTypes.length === 0) {
    ElMessage.warning('请至少选择一种题型')
    return
  }
  generating.value = true
  try {
    practice.value = await selectQuestions({
      subjectId: form.subjectId,
      questionTypes: form.questionTypes,
      difficulty: form.difficulty || undefined,
      questionCount: form.questionCount
    })
    ElMessage.success('练习生成成功')
  } catch {
    ElMessage.error('生成练习失败，请重试')
  } finally {
    generating.value = false
  }
}

async function handleSmartSelect() {
  generating.value = true
  try {
    practice.value = await smartSelectQuestions({
      subjectId: form.subjectId,
      questionCount: form.questionCount,
      difficulty: form.difficulty || undefined
    })
    ElMessage.success('已根据薄弱知识点智能生成练习')
  } catch {
    ElMessage.error('生成失败，请重试')
  } finally {
    generating.value = false
  }
}

function goPracticeDetail(homeworkId: number) {
  router.push(`/student/self-practice/${homeworkId}`)
}

useSeoMeta({
  title: '组题练习 - 教育云平台'
})
</script>

<style scoped>
.self-practice-page {
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
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.practice-form {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.config-form {
  max-width: 500px;
}

.practice-result {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border: 2px solid #43e97b;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-header h3 {
  margin: 0;
  font-size: 18px;
  color: #43e97b;
}

.result-info {
  display: flex;
  gap: 24px;
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.question-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.question-item {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #333;
  padding: 6px 0;
}

.q-index {
  color: #999;
  min-width: 24px;
}

.q-type {
  color: #409eff;
  font-size: 12px;
  padding: 0 6px;
  background: #ecf5ff;
  border-radius: 4px;
}

.q-knowledge {
  color: #67c23a;
  font-size: 12px;
}

.more-hint {
  color: #999;
  font-size: 13px;
  margin: 8px 0 0;
}
</style>