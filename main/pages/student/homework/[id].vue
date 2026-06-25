<template>
  <div class="homework-detail-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回作业列表
        </el-button>
      </div>

      <div v-loading="loading">
        <div v-if="homework" class="detail-content">
          <div class="homework-header">
            <h1 class="homework-title">{{ homework.homeworkName }}</h1>
            <div class="homework-tags">
              <el-tag :type="homework.homeworkSource === 1 ? 'success' : homework.homeworkSource === 3 ? 'primary' : 'warning'" size="small">
                {{ homework.homeworkSource === 1 ? '在线试卷' : homework.homeworkSource === 3 ? '在线试题' : '线下习题' }}
              </el-tag>
              <el-tag size="small">{{ homework.subjectName }}</el-tag>
              <el-tag size="small" type="info">{{ homework.totalScore }}分</el-tag>
            </div>
          </div>

          <!-- 文字作业内容 -->
          <el-card v-if="homework.content" class="content-card">
            <template #header><strong>作业内容</strong></template>
            <p class="content-text">{{ homework.content }}</p>
          </el-card>

          <!-- 知识点 -->
          <div v-if="knowledgeColumns.length > 0" class="knowledge-section">
            <strong>知识点：</strong>
            <el-tag v-for="(k, i) in knowledgeColumns" :key="i" size="small" style="margin-right:6px;margin-bottom:4px">
              {{ k.knowledge_name }}({{ k.score }}分)
            </el-tag>
          </div>

          <!-- 试卷试题展示 -->
          <div v-if="homework.homeworkSource === 1 && paperQuestions.length > 0" class="paper-questions">
            <el-divider content-position="left">试卷试题</el-divider>
            <div v-for="(group, gIdx) in questionGroups" :key="gIdx" class="question-group">
              <h3 class="group-title">{{ group.typeName }}（共{{ group.questions.length }}题，每题{{ group.perScore }}分）</h3>
              <div v-for="(q, qIdx) in group.questions" :key="q.questionId" class="question-item">
                <div class="question-number">{{ qIdx + 1 }}.</div>
                <div class="question-body">
                  <div class="question-text" v-html="q.questionContent || q.questionContentText" />
                  <!-- 知识点标签 -->
                  <div v-if="q.knowledgeList && q.knowledgeList.length" class="knowledge-tags">
                    <el-tag
                      v-for="k in q.knowledgeList"
                      :key="k.knowledgeId"
                      size="small"
                      :type="k.isMain === 1 ? 'warning' : 'info'"
                      effect="plain"
                      style="margin-right:4px;margin-bottom:2px"
                    >
                      {{ k.knowledgeName }}
                      <template v-if="k.isMain === 1">(主)</template>
                    </el-tag>
                  </div>
                  <div v-if="q.optionsJson" class="question-options">
                    <div v-for="(opt, oIdx) in parseOptions(q.optionsJson)" :key="oIdx" class="option-line">
                      <span class="opt-label">{{ opt.optionKey }}.</span>
                      <span v-html="opt.optionContent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="action-bar">
            <el-button @click="handlePrint">
              <el-icon><Printer /></el-icon>
              打印
            </el-button>
            <el-button v-if="homework.homeworkSource === 1 && homework.paperId" type="success" @click="goSelfScore">
              <el-icon><EditPen /></el-icon>
              录入评分
            </el-button>
          </div>

          <!-- 已有成绩 -->
          <div v-if="myScore" class="my-score-section">
            <el-alert type="success" :closable="false" show-icon>
              <template #title>我的成绩：{{ myScore }} / {{ homework.totalScore }} 分</template>
            </el-alert>
          </div>
        </div>

        <el-empty v-else-if="!loading" description="作业不存在" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Printer, EditPen } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const homeworkId = computed(() => Number(route.params.id))
const loading = ref(false)
const homework = ref<any>(null)
const myScore = ref<number | null>(null)
const knowledgeColumns = ref<any[]>([])
const paperQuestions = ref<any[]>([])

const questionGroups = computed(() => {
  if (paperQuestions.value.length === 0) return []
  const typeMap: Record<number, string> = {
    1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题'
  }
  const groups: Record<number, { typeName: string; perScore: number; questions: any[] }> = {}
  for (const q of paperQuestions.value) {
    const t = q.questionType || 0
    if (!groups[t]) {
      groups[t] = { typeName: typeMap[t] || '其他', perScore: q.score || 0, questions: [] }
    }
    groups[t].questions.push(q)
  }
  return Object.values(groups)
})

function parseOptions(optionsJson: string) {
  try {
    return JSON.parse(optionsJson)
  } catch {
    return []
  }
}

async function init() {
  const mod = await import('@/composables/useHomeworkApi')
  const api = mod.useHomeworkApi()

  loading.value = true
  try {
    homework.value = await api.getStudentHomeworkDetail(homeworkId.value)

    if (homework.value?.knowledgeJson) {
      try {
        knowledgeColumns.value = typeof homework.value.knowledgeJson === 'string'
          ? JSON.parse(homework.value.knowledgeJson)
          : homework.value.knowledgeJson
      } catch { knowledgeColumns.value = [] }
    }

    // 如果有试卷，加载试题
    if (homework.value?.homeworkSource === 1 && homework.value?.paperId) {
      try {
        const paper = await api.getStudentPaperDetail(homework.value.paperId)
        paperQuestions.value = paper?.questionList || []
      } catch { paperQuestions.value = [] }
    }

    // 成绩信息
    if (homework.value?.myScore != null) {
      myScore.value = homework.value.myScore
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handlePrint() {
  window.print()
}

function goSelfScore() {
  if (homework.value?.paperId) {
    router.push(`/papers/${homework.value.paperId}/score?homeworkId=${homeworkId.value}`)
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
.homework-detail-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
  background: #f5f7fa;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-bar {
  margin-bottom: 12px;
}
.detail-content {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.homework-header {
  margin-bottom: 20px;
}
.homework-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #303133;
}
.homework-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.content-card {
  margin-bottom: 16px;
  background: #f0f9eb;
}
.content-text {
  white-space: pre-wrap;
  line-height: 1.6;
  margin: 0;
  color: #303133;
  font-size: 15px;
}
.knowledge-section {
  margin-bottom: 16px;
  font-size: 14px;
  color: #606266;
}
.paper-questions {
  margin-bottom: 16px;
}
.question-group {
  margin-bottom: 16px;
}
.group-title {
  font-size: 16px;
  color: #409eff;
  margin: 0 0 12px 0;
}
.question-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}
.question-number {
  font-weight: 700;
  color: #303133;
  min-width: 28px;
}
.question-body {
  flex: 1;
}
.question-text {
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
  margin-bottom: 6px;
}
.question-options {
  margin-top: 6px;
}
.option-line {
  padding: 3px 0;
  font-size: 14px;
  color: #606266;
}
.opt-label {
  font-weight: 600;
  margin-right: 4px;
}
.action-bar {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
.my-score-section {
  margin-top: 16px;
}

@media print {
  .back-bar, .action-bar, .container {
    padding: 0 !important;
  }
  .detail-content {
    box-shadow: none !important;
    padding: 0 !important;
  }
  .homework-detail-page {
    background: #fff !important;
  }
  @page { margin: 1.5cm; size: A4; }
}
</style>
