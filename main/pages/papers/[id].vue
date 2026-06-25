<template>
  <div class="paper-detail-page">
    <div class="page-container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回试卷列表
        </el-button>
      </div>

      <div v-loading="loading" class="content-area">
        <template v-if="paper">
          <div class="paper-header">
            <h1 class="paper-title">{{ paper.paperName }}</h1>
            <div class="paper-meta">
              <el-tag type="info">{{ paper.totalScore }}分</el-tag>
              <el-tag type="success">{{ paper.totalQuestion }}题</el-tag>
              <el-tag>{{ difficultyText }}</el-tag>
              <span class="meta-time">{{ paper.createTime?.substring(0, 10) }}</span>
            </div>
          </div>

          <el-divider />

          <div class="paper-questions">
            <div
              v-for="(group, gIdx) in questionGroups"
              :key="gIdx"
              class="question-group"
            >
              <h3 class="group-title">{{ group.typeName }}（共{{ group.questions.length }}题，每题{{ group.perScore }}分）</h3>
              <div
                v-for="(q, qIdx) in group.questions"
                :key="q.questionId"
                class="question-item"
              >
                <div class="question-number">{{ qIdx + 1 }}.</div>
                <div class="question-body">
                  <div class="question-text" v-html="q.questionContent" />
                  <div v-if="q.optionsJson" class="question-options">
                    <div
                      v-for="(opt, oIdx) in parseOptions(q.optionsJson)"
                      :key="oIdx"
                      class="option-line"
                    >
                      <span class="opt-label">{{ opt.optionKey }}.</span>
                      <span v-html="opt.optionContent" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="paper-actions">
            <el-button type="primary" @click="handlePrint">
              <el-icon><Printer /></el-icon>
              打印试卷
            </el-button>
            <el-button v-if="userStore.isTeacher" type="success" @click="handleScoreInput">
              <el-icon><EditPen /></el-icon>
              录入评分
            </el-button>
            <el-button v-if="userStore.isStudent" type="warning" :loading="practiceLoading" @click="handleRepractice">
              <el-icon><Refresh /></el-icon>
              重新练习
            </el-button>
          </div>
        </template>

        <el-empty v-else-if="!loading" description="试卷不存在" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Printer, EditPen, Refresh } from '@element-plus/icons-vue'
import type { Paper } from '@/types'
import { useHomeworkApi } from '@/composables/useHomeworkApi'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { getPaperDetail } = useQuestionApi()
const { createStudentPractice } = useHomeworkApi()

definePageMeta({ layout: 'default' })

const loading = ref(true)
const paper = ref<Paper | null>(null)
const practiceLoading = ref(false)

const paperId = computed(() => Number(route.params.id))

const difficultyMap: Record<number, string> = {
  1: '简单', 2: '中等', 3: '较难', 4: '困难', 5: '极难'
}
const difficultyText = computed(() => {
  const avgScore = paper.value?.avgScore || 0
  const totalScore = paper.value?.totalScore || 100
  const rate = totalScore > 0 ? avgScore / totalScore : 0
  if (rate >= 0.8) return '简单'
  if (rate >= 0.6) return '中等'
  if (rate >= 0.4) return '较难'
  return '困难'
})

const questionGroups = computed(() => {
  if (!paper.value?.questionList) return []
  const typeMap: Record<number, string> = {
    1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题'
  }
  const groups: Record<number, { typeName: string; perScore: number; questions: any[] }> = {}
  for (const q of paper.value.questionList) {
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

async function fetchPaper() {
  loading.value = true
  try {
    const res: any = await getPaperDetail(paperId.value)
    paper.value = res
  } catch (e) {
    console.error('获取试卷详情失败', e)
  } finally {
    loading.value = false
  }
}

function handleScoreInput() {
  router.push(`/papers/${paperId.value}/score`)
}

function handlePrint() {
  window.print()
}

async function handleRepractice() {
  practiceLoading.value = true
  try {
    const res: any = await createStudentPractice(paperId.value)
    const homeworkId = res?.data?.homeworkId ?? res?.data
    if (homeworkId) {
      router.push(`/papers/${paperId.value}/score?homeworkId=${homeworkId}`)
    } else {
      ElMessage.error('创建练习失败，未获取到作业ID')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '创建练习失败，请重试')
  } finally {
    practiceLoading.value = false
  }
}

onMounted(() => {
  fetchPaper()
})
</script>

<style scoped>
.paper-detail-page {
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
  padding: 32px;
}
.paper-header {
  text-align: center;
}
.paper-title {
  font-size: 24px;
  margin-bottom: 12px;
}
.paper-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.meta-time {
  color: #909399;
  font-size: 14px;
}
.question-group {
  margin-bottom: 24px;
}
.group-title {
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}
.question-item {
  display: flex;
  margin-bottom: 16px;
}
.question-number {
  min-width: 30px;
  font-weight: bold;
}
.question-body {
  flex: 1;
}
.question-text {
  line-height: 1.8;
  margin-bottom: 8px;
}
.option-line {
  padding: 2px 0;
  line-height: 1.6;
}
.opt-label {
  font-weight: bold;
  margin-right: 4px;
}
.paper-actions {
  text-align: center;
  margin-top: 24px;
}
</style>
