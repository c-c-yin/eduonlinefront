<template>
  <div class="question-detail-page">
    <div class="page-container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回试题列表
        </el-button>
      </div>

      <div v-loading="loading" class="content-area">
        <template v-if="question">
          <div class="question-header">
            <el-tag :type="questionTypeTag" size="large">{{ questionTypeText }}</el-tag>
            <el-tag type="info" size="large">{{ difficultyText }}</el-tag>
            <span class="knowledge-tags">
              <el-tag
                v-for="(kn, idx) in knowledgeList"
                :key="idx"
                type="success"
                size="small"
                class="knowledge-tag"
              >
                {{ kn.knowledgeName }}
              </el-tag>
            </span>
          </div>

          <div class="question-content">
            <div class="content-text" v-html="question.questionContentText || question.questionCode" />
          </div>

          <div v-if="parsedOptions.length > 0" class="question-options">
            <div
              v-for="(opt, idx) in parsedOptions"
              :key="idx"
              class="option-item"
            >
              <span class="option-label">{{ opt.optionKey }}.</span>
              <span class="option-content" v-html="opt.optionContent" />
            </div>
          </div>

          <div class="question-actions">
            <el-button
              :type="isCollected ? 'warning' : 'default'"
              @click="toggleCollect"
            >
              <el-icon><Star /></el-icon>
              {{ isCollected ? '已收藏' : '收藏' }}
            </el-button>
          </div>

          <el-divider />

          <div class="answer-section">
            <h3>参考答案</h3>
            <div class="answer-content">{{ question.answerContent }}</div>
          </div>

          <div class="analysis-section">
            <h3>解析</h3>
            <div class="analysis-content" v-html="question.answerAnalysis" />
          </div>

          <div v-if="question.answerImage" class="analysis-image">
            <el-image :src="question.answerImage" fit="contain" style="max-width: 600px" />
          </div>
        </template>

        <el-empty v-else-if="!loading" description="试题不存在" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Star } from '@element-plus/icons-vue'
import type { Question, QuestionKnowledge } from '@/types'

const route = useRoute()
const router = useRouter()
const { getQuestionDetail, collectQuestion, removeCollect, checkCollected } = useQuestionApi()

definePageMeta({ layout: 'default' })

const loading = ref(true)
const question = ref<Question | null>(null)
const isCollected = ref(false)

const questionId = computed(() => Number(route.params.id))

const questionTypeMap: Record<number, string> = {
  1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题'
}
const difficultyMap: Record<number, string> = {
  1: '简单', 2: '中等', 3: '较难', 4: '困难', 5: '极难'
}
const questionTypeTagMap: Record<number, 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = {
  1: undefined, 2: 'success', 3: 'info', 4: 'warning', 5: 'danger', 6: 'danger', 7: 'danger'
}

const questionTypeText = computed(() => questionTypeMap[question.value?.questionType || 0] || '未知')
const difficultyText = computed(() => difficultyMap[question.value?.difficulty || 0] || '未知')
const questionTypeTag = computed(() => questionTypeTagMap[question.value?.questionType || 0] || 'info')

const knowledgeList = computed<QuestionKnowledge[]>(() => {
  if (!question.value) return []
  return question.value.knowledgeList || []
})

const parsedOptions = computed(() => {
  if (!question.value) return []
  if (question.value.optionsJson) {
    try {
      return JSON.parse(question.value.optionsJson)
    } catch {
      return []
    }
  }
  return []
})

async function fetchQuestion() {
  loading.value = true
  try {
    const res: any = await getQuestionDetail(questionId.value)
    question.value = res
  } catch (e) {
    console.error('获取试题详情失败', e)
  } finally {
    loading.value = false
  }
}

async function checkCollectStatus() {
  try {
    const res: any = await checkCollected(questionId.value)
    isCollected.value = res === true
  } catch {
    isCollected.value = false
  }
}

async function toggleCollect() {
  try {
    if (isCollected.value) {
      await removeCollect(questionId.value)
      isCollected.value = false
      ElMessage.success('已取消收藏')
    } else {
      await collectQuestion(questionId.value)
      isCollected.value = true
      ElMessage.success('收藏成功')
    }
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  fetchQuestion()
  checkCollectStatus()
})
</script>

<style scoped>
.question-detail-page {
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
.content-area {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}
.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.knowledge-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
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
  padding: 8px 0;
  font-size: 15px;
  line-height: 1.6;
}
.option-label {
  font-weight: bold;
  margin-right: 8px;
}
.question-actions {
  margin-bottom: 16px;
}
.answer-section h3,
.analysis-section h3 {
  margin-bottom: 12px;
  color: #303133;
}
.answer-content {
  font-size: 15px;
  color: #409eff;
  font-weight: bold;
  margin-bottom: 16px;
}
.analysis-content {
  font-size: 14px;
  line-height: 1.8;
  color: #606266;
}
.analysis-image {
  margin-top: 12px;
}
</style>
