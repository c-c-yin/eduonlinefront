<template>
  <div class="question-card" :class="{ 'show-result': showResult, 'is-correct': isCorrect }">
    <div class="question-header">
      <div class="question-type-tag" :class="`type-${question.questionType}`">
        {{ questionTypeText }}
      </div>
      <div class="question-difficulty">
        <el-rate
          v-model="difficulty"
          :max="5"
          disabled
          :show-score="false"
          size="small"
        />
      </div>
      <div v-if="showResult" class="result-tag" :class="isCorrect ? 'correct' : 'wrong'">
        {{ isCorrect ? '正确' : '错误' }}
      </div>
    </div>

    <div class="question-content">
      <div class="content-text" v-html="question.questionCode || question.questionContentText" />
      <el-image
        v-if="question.questionImage"
        :src="question.questionImage"
        :preview-src-list="[question.questionImage]"
        fit="contain"
        class="question-image"
      />
    </div>

    <div v-if="parsedOptions.length > 0 && question.questionType <= 3" class="question-options">
      <QuestionOptions
        v-model="selectedAnswer"
        :options="parsedOptions"
        :question-type="question.questionType"
        :show-result="showResult"
        :correct-answer="question.answerContent"
        :disabled="disabled || showResult"
      />
    </div>

    <div v-if="showResult" class="question-analysis">
      <div class="analysis-header">
        <span class="analysis-title">答案解析</span>
        <span class="correct-answer">正确答案: {{ question.answerContent }}</span>
      </div>
      <div class="analysis-content" v-html="question.answerAnalysis" />
      <el-image
        v-if="question.answerImage"
        :src="question.answerImage"
        fit="contain"
        class="analysis-image"
      />
    </div>

    <div class="question-footer">
      <div class="question-meta">
        <span v-if="question.knowledgeNames" class="meta-item">
          <el-icon><CollectionTag /></el-icon>
          {{ question.knowledgeNames }}
        </span>
      </div>
      <div v-if="showActions" class="question-actions">
        <el-button v-if="!showResult" type="primary" :disabled="!selectedAnswer" @click="handleSubmit">
          提交答案
        </el-button>
        <el-button v-else type="primary" @click="handleNext">
          下一题
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CollectionTag } from '@element-plus/icons-vue'
import type { Question, QuestionOption } from '@/types'
import QuestionOptions from './QuestionOptions.vue'

interface Props {
  question: Question
  showResult?: boolean
  disabled?: boolean
  showActions?: boolean
}

interface Emits {
  (e: 'submit', answer: string): void
  (e: 'next'): void
}

const props = withDefaults(defineProps<Props>(), {
  showResult: false,
  disabled: false,
  showActions: true
})

const emit = defineEmits<Emits>()

const selectedAnswer = ref('')

const questionTypeText = computed(() => {
  const typeMap: Record<number, string> = {
    1: '单选题',
    2: '多选题',
    3: '判断题',
    4: '填空题',
    5: '简答题',
    6: '计算题',
    7: '应用题'
  }
  return typeMap[props.question.questionType] || '未知题型'
})

const difficulty = computed(() => props.question.difficulty || 3)

const isCorrect = computed(() => {
  if (!props.showResult) return false
  return selectedAnswer.value === props.question.answerContent
})

const parsedOptions = computed<QuestionOption[]>(() => {
  if (!props.question.optionsJson) return []
  try {
    return JSON.parse(props.question.optionsJson)
  } catch {
    return []
  }
})

watch(() => props.question, () => {
  selectedAnswer.value = ''
}, { immediate: true })

function handleSubmit() {
  if (selectedAnswer.value) {
    emit('submit', selectedAnswer.value)
  }
}

function handleNext() {
  emit('next')
}
</script>

<style scoped>
.question-card {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
  transition: all 0.3s;
}

.question-card.show-result.is-correct {
  border-color: var(--success-color);
  background: rgba(103, 194, 58, 0.05);
}

.question-card.show-result:not(.is-correct) {
  border-color: var(--danger-color);
  background: rgba(245, 108, 108, 0.05);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.question-type-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.question-type-tag.type-1 { background: #e6f7ff; color: #1890ff; }
.question-type-tag.type-2 { background: #fff7e6; color: #fa8c16; }
.question-type-tag.type-3 { background: #f6ffed; color: #52c41a; }
.question-type-tag.type-4 { background: #fff0f6; color: #eb2f96; }
.question-type-tag.type-5 { background: #f9f0ff; color: #722ed1; }
.question-type-tag.type-6 { background: #fff1f0; color: #f5222d; }
.question-type-tag.type-7 { background: #fcffe6; color: #a0d911; }

.question-difficulty {
  flex: 1;
}

.result-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.result-tag.correct { background: var(--success-color); color: #fff; }
.result-tag.wrong { background: var(--danger-color); color: #fff; }

.question-content {
  margin-bottom: 20px;
}

.content-text {
  font-size: 16px;
  line-height: 1.8;
  color: var(--text-primary);
}

.content-text :deep(p) { margin: 0 0 8px; }
.content-text :deep(img) { max-width: 100%; height: auto; }

.question-image {
  margin-top: 12px;
  max-width: 400px;
}

.question-options {
  margin-bottom: 20px;
}

.question-analysis {
  margin-top: 20px;
  padding: 16px;
  background: var(--bg-page);
  border-radius: 8px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.analysis-title {
  font-weight: 500;
  color: var(--text-primary);
}

.correct-answer {
  color: var(--success-color);
  font-weight: 500;
}

.analysis-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-regular);
}

.analysis-content :deep(p) { margin: 0 0 8px; }

.analysis-image {
  margin-top: 12px;
  max-width: 600px;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.question-meta {
  display: flex;
  gap: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.question-actions {
  display: flex;
  gap: 12px;
}
</style>
