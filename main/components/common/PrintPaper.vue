<template>
  <div class="print-paper">
    <!-- 打印控制栏 -->
    <div class="print-toolbar">
      <span class="toolbar-label">纸张：</span>
      <el-radio-group v-model="paperSizeModel">
        <el-radio-button label="A4" />
        <el-radio-button label="A3" />
      </el-radio-group>
      <el-checkbox v-model="showAnswerModel">显示答案</el-checkbox>
      <el-button type="primary" @click="print">
        <el-icon><Printer /></el-icon>
        打印
      </el-button>
    </div>

    <!-- 打印内容区域 -->
    <div ref="printAreaRef" :class="['print-area', `paper-${paperSizeModel}`]">
      <div class="paper-sheet">
        <h1 class="paper-title">{{ paperName }}</h1>
        <div class="paper-info">
          <span>姓名：__________</span>
          <span>班级：__________</span>
          <span>得分：__________</span>
        </div>
        <div class="divider" />

        <div class="total-score">总分：{{ totalScore }} 分</div>

        <div
          v-for="(group, gIdx) in groupedQuestions"
          :key="gIdx"
          class="question-group"
        >
          <h3 class="group-title">{{ group.title }}（共{{ group.questions.length }}题）</h3>
          <div
            v-for="(q, qIdx) in group.questions"
            :key="q.questionId"
            class="question-item"
          >
            <div class="question-line">
              <span class="question-number">{{ qIdx + 1 }}.</span>
              <span class="question-content" v-html="q.questionContent || q.questionContentText" />
              <span class="question-score">（{{ q.score || q.defaultScore || 0 }}分）</span>
            </div>
            <div v-if="parseOptions(q.optionsJson).length" class="question-options">
              <div
                v-for="(opt, oIdx) in parseOptions(q.optionsJson)"
                :key="oIdx"
                class="option-line"
              >
                <span class="opt-label">{{ opt.optionKey }}.</span>
                <span v-html="opt.optionContent" />
              </div>
            </div>
            <div v-if="showAnswerModel && q.answerContent" class="question-answer">
              参考答案：<span v-html="q.answerContent" />
            </div>
          </div>
        </div>

        <div class="paper-footer">— 试卷结束 —</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Printer } from '@element-plus/icons-vue'

interface Props {
  paperName: string
  questions: any[]
  totalScore: number
  showAnswer?: boolean
  paperSize?: 'A4' | 'A3'
}

const props = withDefaults(defineProps<Props>(), {
  showAnswer: false,
  paperSize: 'A4'
})

const printAreaRef = ref<HTMLElement | null>(null)

const paperSizeModel = ref(props.paperSize)
const showAnswerModel = ref(props.showAnswer)

watch(() => props.paperSize, (val) => {
  paperSizeModel.value = val
})
watch(() => props.showAnswer, (val) => {
  showAnswerModel.value = val
})

const typeMap: Record<number, string> = {
  1: '一、单选题',
  2: '二、多选题',
  3: '三、判断题',
  4: '四、填空题',
  5: '五、简答题',
  6: '六、计算题',
  7: '七、综合题',
  8: '八、听力题'
}

const groupedQuestions = computed(() => {
  const groups: Record<number, any[]> = {}
  for (const q of props.questions || []) {
    const t = q.questionType || 0
    if (!groups[t]) groups[t] = []
    groups[t].push(q)
  }
  return Object.keys(groups)
    .map(Number)
    .sort((a, b) => a - b)
    .map(t => ({
      type: t,
      title: typeMap[t] || '其他题',
      questions: groups[t]
    }))
})

function parseOptions(optionsJson: string) {
  if (!optionsJson) return []
  try {
    return JSON.parse(optionsJson)
  } catch {
    return []
  }
}

function print() {
  window.print()
}

defineExpose({ print })
</script>

<style scoped>
.print-paper {
  font-family: 'SimSun', '宋体', serif;
  color: #000;
}

.print-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 16px;
}

.toolbar-label {
  font-size: 14px;
  color: #606266;
}

.print-area {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.paper-sheet {
  padding: 20mm 15mm;
}

.paper-title {
  text-align: center;
  font-size: 16pt;
  font-weight: bold;
  margin-bottom: 16px;
}

.paper-info {
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  font-size: 12pt;
  margin-bottom: 8px;
}

.divider {
  border-top: 2px solid #000;
  margin-bottom: 16px;
}

.total-score {
  font-size: 12pt;
  margin-bottom: 16px;
}

.question-group {
  margin-bottom: 20px;
}

.group-title {
  font-size: 14pt;
  font-weight: bold;
  margin-bottom: 10px;
}

.question-item {
  margin-bottom: 12px;
  page-break-inside: avoid;
}

.question-line {
  font-size: 12pt;
  line-height: 1.8;
}

.question-number {
  font-weight: bold;
}

.question-content {
  font-weight: normal;
}

.question-score {
  color: #666;
}

.question-options {
  margin-top: 4px;
}

.option-line {
  font-size: 12pt;
  padding: 2px 0 2px 24px;
  line-height: 1.6;
}

.opt-label {
  font-weight: bold;
  margin-right: 4px;
}

.question-answer {
  font-size: 12pt;
  color: #c0392b;
  margin-top: 4px;
  padding-left: 24px;
}

.paper-footer {
  text-align: center;
  font-size: 12pt;
  color: #999;
  margin-top: 24px;
}

@media print {
  .print-toolbar {
    display: none !important;
  }
  .print-area {
    box-shadow: none !important;
  }
  .paper-A4 .paper-sheet {
    width: 210mm;
    min-height: 297mm;
  }
  .paper-A3 .paper-sheet {
    width: 420mm;
    min-height: 297mm;
  }
}

@page {
  margin: 20mm 15mm;
  @bottom-center {
    content: '第 ' counter(page) ' 页 / 共 ' counter(pages) ' 页';
  }
}

@page a4page {
  size: A4;
  margin: 20mm 15mm;
}

@page a3page {
  size: A3;
  margin: 20mm 15mm;
}

.paper-A4 .paper-sheet {
  page: a4page;
}

.paper-A3 .paper-sheet {
  page: a3page;
}
</style>
