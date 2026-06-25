<template>
  <div class="question-options">
    <template v-if="questionType === 1">
      <el-radio-group v-model="modelValue" :disabled="disabled" class="option-group">
        <div
          v-for="option in options"
          :key="option.optionKey"
          class="option-item"
          :class="getOptionClass(option.optionKey)"
        >
          <el-radio :value="option.optionKey" size="large">
            <span class="option-key">{{ option.optionKey }}.</span>
            <span class="option-content" v-html="option.optionContent" />
            <el-image
              v-if="option.optionImage"
              :src="option.optionImage"
              fit="contain"
              class="option-image"
            />
          </el-radio>
        </div>
      </el-radio-group>
    </template>
    
    <template v-else-if="questionType === 2">
      <el-checkbox-group v-model="multiAnswers" :disabled="disabled" class="option-group">
        <div
          v-for="option in options"
          :key="option.optionKey"
          class="option-item"
          :class="getOptionClass(option.optionKey)"
        >
          <el-checkbox :value="option.optionKey" size="large">
            <span class="option-key">{{ option.optionKey }}.</span>
            <span class="option-content" v-html="option.optionContent" />
            <el-image
              v-if="option.optionImage"
              :src="option.optionImage"
              fit="contain"
              class="option-image"
            />
          </el-checkbox>
        </div>
      </el-checkbox-group>
    </template>
    
    <template v-else-if="questionType === 3">
      <el-radio-group v-model="modelValue" :disabled="disabled" class="option-group">
        <div class="option-item" :class="getOptionClass('T')">
          <el-radio value="T" size="large">
            <span class="option-key">T.</span>
            <span class="option-content">正确</span>
          </el-radio>
        </div>
        <div class="option-item" :class="getOptionClass('F')">
          <el-radio value="F" size="large">
            <span class="option-key">F.</span>
            <span class="option-content">错误</span>
          </el-radio>
        </div>
      </el-radio-group>
    </template>
    
    <template v-else-if="questionType === 4">
      <div class="fill-blanks">
        <div
          v-for="(blank, index) in blankCount"
          :key="index"
          class="fill-item"
        >
          <span class="fill-label">填空 {{ index + 1 }}:</span>
          <el-input
            v-model="fillAnswers[index]"
            :disabled="disabled"
            placeholder="请输入答案"
            class="fill-input"
            @change="updateFillAnswer"
          />
          <span v-if="showResult && correctAnswerParts[index]" class="correct-fill">
            正确答案: {{ correctAnswerParts[index] }}
          </span>
        </div>
      </div>
    </template>
    
    <template v-else-if="questionType === 5">
      <el-input
        v-model="modelValue"
        type="textarea"
        :rows="6"
        :disabled="disabled"
        placeholder="请输入答案"
        class="essay-input"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { QuestionOption } from '@/types'

interface Props {
  options: QuestionOption[]
  questionType: number
  showResult?: boolean
  correctAnswer?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showResult: false,
  correctAnswer: '',
  disabled: false
})

const modelValue = defineModel<string>({ default: '' })

const multiAnswers = ref<string[]>([])
const fillAnswers = ref<string[]>([])

const blankCount = computed(() => {
  if (props.questionType !== 4) return 0
  return (props.correctAnswer?.match(/\|/g) || []).length + 1 || 1
})

const correctAnswerParts = computed(() => {
  if (props.questionType !== 4 || !props.correctAnswer) return []
  return props.correctAnswer.split('|')
})

watch(multiAnswers, (val) => {
  modelValue.value = val.sort().join('')
})

function updateFillAnswer() {
  modelValue.value = fillAnswers.value.join('|')
}

function getOptionClass(optionKey: string): Record<string, boolean> {
  if (!props.showResult) return {}
  
  const isUserAnswer = props.questionType === 2
    ? modelValue.value.includes(optionKey)
    : modelValue.value === optionKey
  
  const isCorrect = props.questionType === 2
    ? props.correctAnswer?.includes(optionKey)
    : props.correctAnswer === optionKey
  
  return {
    'user-answer': isUserAnswer && !isCorrect,
    'correct-answer': isCorrect,
    'wrong-answer': isUserAnswer && !isCorrect
  }
}

watch(() => props.questionType, () => {
  modelValue.value = ''
  multiAnswers.value = []
  fillAnswers.value = []
}, { immediate: true })
</script>

<style scoped>
.question-options {
  width: 100%;
}

.option-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  transition: all 0.3s;
  background: var(--bg-color);
}

.option-item:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-light-9);
}

.option-item.correct-answer {
  border-color: var(--success-color);
  background: rgba(103, 194, 58, 0.1);
}

.option-item.wrong-answer {
  border-color: var(--danger-color);
  background: rgba(245, 108, 108, 0.1);
}

.option-item :deep(.el-radio),
.option-item :deep(.el-checkbox) {
  width: 100%;
  height: auto;
  align-items: flex-start;
}

.option-key {
  font-weight: 500;
  margin-right: 8px;
}

.option-content {
  flex: 1;
}

.option-content :deep(p) {
  margin: 0;
}

.option-image {
  margin-top: 8px;
  max-width: 200px;
}

.fill-blanks {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.fill-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fill-label {
  font-weight: 500;
  color: var(--text-primary);
}

.fill-input {
  max-width: 400px;
}

.correct-fill {
  font-size: 12px;
  color: var(--success-color);
}

.essay-input {
  width: 100%;
}
</style>
