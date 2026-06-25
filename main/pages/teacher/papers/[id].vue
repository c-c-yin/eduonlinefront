<template>
  <div class="paper-detail-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回我的试卷
        </el-button>
      </div>

      <div v-loading="loading">
        <template v-if="paper">
          <div class="paper-header">
            <h1 class="paper-title">{{ paper.paperName }}</h1>
            <div class="paper-meta">
              <el-tag :type="paperTypeTag(paper.paperType)">{{ paperTypeLabel(paper.paperType) }}</el-tag>
              <el-tag type="info">{{ paper.generateType === 1 ? '手动组卷' : '自动组卷' }}</el-tag>
              <span class="meta-item">总分：{{ paper.totalScore }}分</span>
              <span class="meta-item">题数：{{ paper.totalQuestion }}题</span>
              <span class="meta-item">时长：{{ paper.duration }}分钟</span>
              <span class="meta-item">创建时间：{{ paper.createTime?.substring(0, 10) }}</span>
            </div>
          </div>

          <el-divider />

          <!-- 试卷正式格式区域 -->
          <div class="exam-sheet" id="exam-sheet">
            <div class="exam-header">
              <div class="exam-title">{{ paper.paperName }}</div>
              <div class="exam-info-row">
                <span v-if="paper.subjectName">学科：{{ paper.subjectName }}</span>
                <span v-if="paper.gradeName">年级：{{ paper.gradeName }}</span>
                <span>时长：{{ paper.duration }}分钟</span>
                <span>满分：{{ paper.totalScore }}分</span>
              </div>
              <div class="exam-info-row exam-fill-row">
                <span>姓名：__________</span>
                <span>班级：__________</span>
                <span>得分：__________</span>
              </div>
              <div class="exam-divider"></div>
            </div>

            <div v-if="paper.paperDesc" class="exam-notice">
              <div class="notice-title">注意事项</div>
              <div v-html="paper.paperDesc"></div>
            </div>

            <div class="exam-body">
              <template v-for="(group, type) in groupedQuestions" :key="type">
                <div class="question-group">
                  <h3 class="group-title">
                    {{ questionTypeLabel(Number(type)) }}
                    <span class="group-count">共{{ group.length }}题，每题{{ group[0].score }}分</span>
                  </h3>
                  <div v-for="(q, idx) in group" :key="q.id || idx" class="question-item">
                    <div class="question-header">
                      <span class="question-num">{{ idx + 1 }}.</span>
                      <span class="question-content" v-html="q.questionContent"></span>
                      <span class="question-score">（{{ q.score }}分）</span>
                    </div>
                    <div v-if="q.optionsJson" class="question-options">
                      <div v-for="(opt, oidx) in parseOptions(q.optionsJson)" :key="oidx" class="option-item">
                        <span class="option-key">{{ opt.key }}.</span>
                        <span v-html="opt.content"></span>
                      </div>
                    </div>
                    <div v-if="showAnswer" class="question-answer">
                      <div v-if="q.answerContent" class="answer-line">
                        <span class="answer-label">答案：</span>
                        <span class="answer-text" v-html="q.answerContent"></span>
                      </div>
                      <div v-if="q.answerAnalysis" class="analysis-line">
                        <span class="analysis-label">解析：</span>
                        <span class="analysis-text" v-html="q.answerAnalysis"></span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <div class="paper-actions">
            <el-checkbox v-model="showAnswer">显示答案和解析</el-checkbox>
            <div style="flex:1" />
            <el-button @click="handlePrint">打印试卷</el-button>
            <el-button v-if="paper.status === 0" type="primary" @click="goEdit">编辑试卷</el-button>
          </div>
        </template>

        <el-empty v-else-if="!loading" description="试卷不存在或无权访问" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import type { Paper, PaperQuestion } from '@/types'
import { useTeacherPaperApi } from '@/composables/useTeacherPaperApi'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const route = useRoute()
const { getPaperDetail } = useTeacherPaperApi()

const loading = ref(true)
const paper = ref<Paper | null>(null)
const showAnswer = ref(false)

const groupedQuestions = computed(() => {
  if (!paper.value?.questionList) return {}
  const groups: Record<number, PaperQuestion[]> = {}
  for (const q of paper.value.questionList) {
    const type = q.questionType || 0
    if (!groups[type]) groups[type] = []
    groups[type].push(q)
  }
  return groups
})

function paperTypeLabel(type: number): string {
  const map: Record<number, string> = { 1: '练习卷', 2: '测试卷', 3: '考试卷', 4: '作业卷' }
  return map[type] || '未知'
}

function paperTypeTag(type: number): string {
  const map: Record<number, string> = { 1: '', 2: 'warning', 3: 'danger', 4: 'success' }
  return map[type] || ''
}

function questionTypeLabel(type: number): string {
  const labels: Record<number, string> = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题', 8: '作文题' }
  return labels[type] || '其他题'
}

function parseOptions(optionsJson: string): { key: string; content: string }[] {
  if (!optionsJson) return []
  try {
    const parsed = JSON.parse(optionsJson)
    if (Array.isArray(parsed)) return parsed
    if (typeof parsed === 'object') {
      return Object.entries(parsed).map(([key, content]) => ({ key, content: String(content) }))
    }
    return []
  } catch {
    return []
  }
}

function handlePrint() {
  window.print()
}

function goEdit() {
  if (paper.value) {
    router.push(`/teacher/papers/create?id=${paper.value.paperId}`)
  }
}

onMounted(async () => {
  const paperId = Number(route.params.id)
  if (!paperId) {
    loading.value = false
    return
  }
  try {
    paper.value = await getPaperDetail(paperId)
  } catch (e) {
    console.error(e)
    paper.value = null
  } finally {
    loading.value = false
  }
})

useSeoMeta({ title: '试卷详情 - 教育云平台' })

useHead({
  link: [
    { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css' }
  ]
})
</script>

<style scoped>
.paper-detail-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-bar {
  margin-bottom: 12px;
}
.paper-header {
  margin-bottom: 8px;
}
.paper-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0 0 12px;
}
.paper-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 14px;
  color: #606266;
}

/* 试卷正式格式 */
.exam-sheet {
  background: #fff;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.exam-header {
  text-align: center;
  margin-bottom: 16px;
}
.exam-title {
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}
.exam-info-row {
  display: flex;
  justify-content: center;
  gap: 24px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}
.exam-fill-row {
  margin-top: 12px;
  justify-content: flex-start;
  padding: 0 40px;
}
.exam-divider {
  border-top: 2px solid #303133;
  margin: 16px 0;
}
.exam-notice {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 4px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.8;
}
.notice-title {
  font-weight: 600;
  margin-bottom: 4px;
}
.exam-body {
  margin-top: 16px;
}
.question-group {
  margin-bottom: 32px;
}
.group-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}
.group-count {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
  margin-left: 8px;
}
.question-item {
  margin-bottom: 20px;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}
.question-header {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 8px;
}
.question-num {
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}
.question-content {
  flex: 1;
  font-size: 15px;
  line-height: 1.6;
  color: #303133;
}
.question-content :deep(img) {
  max-width: 100%;
}
.question-score {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}
.question-options {
  margin-top: 8px;
  padding-left: 20px;
}
.option-item {
  margin-bottom: 4px;
  font-size: 14px;
  line-height: 1.6;
}
.option-key {
  font-weight: 500;
  margin-right: 4px;
}
.question-answer {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
}
.answer-line {
  margin-bottom: 4px;
}
.answer-label {
  color: #67c23a;
  font-weight: 600;
}
.answer-text {
  color: #303133;
}
.analysis-line {
  margin-bottom: 0;
}
.analysis-label {
  color: #409eff;
  font-weight: 600;
}
.analysis-text {
  color: #606266;
}
.paper-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

@media print {
  .back-bar, .paper-actions, .paper-header, .el-divider { display: none !important; }
  .paper-detail-page { padding: 0; }
  .exam-sheet { border: none; padding: 0; }
  .question-item { background: none; }
  .question-answer { background: none; }
}
</style>
