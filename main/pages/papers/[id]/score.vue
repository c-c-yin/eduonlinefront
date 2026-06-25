<template>
  <div class="score-page">
    <div class="page-container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <div v-loading="loading" class="content-area">
        <template v-if="paper">
          <div class="paper-header">
            <h1 class="paper-title">{{ paper.paperName }}</h1>
            <div class="paper-meta">
              <el-tag type="info">{{ paper.totalScore }}分</el-tag>
              <el-tag type="success">{{ paper.totalQuestion }}题</el-tag>
            </div>
          </div>

          <div v-if="alreadyScored" class="already-scored">
            <el-alert
              title="您已完成此试卷评分"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>总分: {{ answerSheet?.totalScore }}分 | 正确: {{ answerSheet?.correctCount }} | 错误: {{ answerSheet?.wrongCount }}</p>
              </template>
            </el-alert>
          </div>

          <div class="scoring-progress">
            <div class="progress-bar">
              <el-progress :percentage="scoringProgress" :stroke-width="12" :color="'#409eff'" />
            </div>
            <div class="progress-info">
              <span>需评分: {{ paper.totalQuestion }} 题</span>
              <span>已评: {{ scoredCount }} 题</span>
              <span>预估得分: {{ currentTotalScore }} / {{ paper.totalScore }}</span>
            </div>
          </div>

          <el-divider />

          <div class="score-questions">
            <div v-for="(group, gIdx) in questionGroups" :key="gIdx" class="question-group">
              <h3 class="group-title">{{ group.typeName }}（共{{ group.questions.length }}题，每题{{ group.perScore }}分）</h3>

              <div v-for="(q, qIdx) in group.questions" :key="q.questionId" class="question-item">
                <div class="question-header">
                  <span class="question-num">{{ getGlobalIndex(group, gIdx, qIdx) }}.</span>
                  <span class="question-type-tag">
                    <el-tag size="small" :type="getQuestionTypeTag(group.typeName)">
                      {{ group.typeName }}
                    </el-tag>
                  </span>
                  <span class="question-score">满分 {{ q.score || group.perScore }} 分</span>
                </div>

                <div class="question-content" v-html="q.questionContent || q.questionContentText" />

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

                <div v-if="showAnswers && q.answerContent" class="question-answer">
                  <span class="answer-label">正确答案：</span>
                  <span class="answer-value" v-html="q.answerContent" />
                </div>

                <div class="score-controls">
                  <div v-if="isObjectiveType(q.questionType)" class="quick-buttons">
                    <span class="score-label">评分：</span>
                    <el-radio-group
                      v-model="scoreMap[q.questionId]"
                      size="small"
                      @change="onScoreChange(q, $event)"
                    >
                      <el-radio-button :value="q.score || group.perScore">
                        <el-icon><Check /></el-icon> 正确
                      </el-radio-button>
                      <el-radio-button :value="0">
                        <el-icon><Close /></el-icon> 错误
                      </el-radio-button>
                      <el-radio-button v-if="supportsPartial(q.questionType)" :value="Math.floor((q.score || group.perScore) / 2)">
                        部分对
                      </el-radio-button>
                    </el-radio-group>
                  </div>

                  <div v-else class="manual-score">
                    <span class="score-label">得分：</span>
                    <el-input-number
                      v-model="scoreMap[q.questionId]"
                      :min="0"
                      :max="q.score || group.perScore"
                      :step="1"
                      size="small"
                      @change="onScoreChange(q, $event)"
                    />
                    <span class="max-score"> / {{ q.score || group.perScore }} 分</span>
                  </div>

                  <div v-if="scoreMap[q.questionId] !== undefined && scoreMap[q.questionId] !== null" class="scored-badge">
                    <template v-if="scoreMap[q.questionId] != null && (scoreMap[q.questionId] ?? 0) >= (q.score || group.perScore)">
                      <el-tag type="success" size="small">正确</el-tag>
                    </template>
                    <template v-else-if="scoreMap[q.questionId] != null && (scoreMap[q.questionId] ?? 0) <= 0">
                      <el-tag type="danger" size="small">错误</el-tag>
                    </template>
                    <template v-else>
                      <el-tag type="warning" size="small">部分正确</el-tag>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="score-actions">
            <el-checkbox v-model="showAnswers" :disabled="alreadyScored">
              显示正确答案
            </el-checkbox>
            <div class="action-buttons">
              <el-button @click="handleReset" :disabled="submitting">重置评分</el-button>
              <el-button type="primary" :loading="submitting" :disabled="alreadyScored" @click="handleSubmit">
                提交评分（总分: {{ currentTotalScore }} / {{ paper.totalScore }}）
              </el-button>
            </div>
          </div>
        </template>

        <el-empty v-else-if="!loading" description="试卷不存在" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Check, Close } from '@element-plus/icons-vue'
import type { Paper, PaperQuestion } from '@/types'
import { usePaperApi } from '@/composables/usePaperApi'

definePageMeta({ layout: 'default', middleware: ['teacher'], ssr: false })

const route = useRoute()
const router = useRouter()
const { getPaperDetail, getAnswerSheet, submitScore } = usePaperApi()

const paperId = computed(() => Number(route.params.id))

const loading = ref(true)
const submitting = ref(false)
const paper = ref<Paper | null>(null)
const answerSheet = ref<any>(null)
const alreadyScored = ref(false)
const showAnswers = ref(false)
const scoreMap = ref<Record<number, number>>({})

const scoredCount = computed(() => {
  if (!scoreMap.value) return 0
  return Object.keys(scoreMap.value).filter((k) => {
    const v = scoreMap.value[Number(k)]
    return v !== undefined && v !== null
  }).length
})

const scoringProgress = computed(() => {
  if (!paper.value || paper.value.totalQuestion === 0) return 0
  return Math.round((scoredCount.value / paper.value.totalQuestion) * 100)
})

const currentTotalScore = computed(() => {
  if (!scoreMap.value) return 0
  return Object.values(scoreMap.value).reduce((sum: number, v) => {
    return sum + (typeof v === 'number' ? v : 0)
  }, 0)
})

interface GroupQuestions {
  typeName: string
  perScore: number
  questions: any[]
}

const questionGroups = computed((): GroupQuestions[] => {
  if (!paper.value?.questionList) return []
  const typeMap: Record<number, string> = {
    1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题', 7: '应用题'
  }
  const groups: Record<number, GroupQuestions> = {}
  for (const q of paper.value.questionList) {
    const t = q.questionType || 0
    if (!groups[t]) {
      groups[t] = { typeName: typeMap[t] || '其他', perScore: q.score || 0, questions: [] }
    }
    groups[t].questions.push(q)
  }
  return Object.values(groups)
})

function getGlobalIndex(group: GroupQuestions, gIdx: number, qIdx: number): number {
  let index = 0
  for (let i = 0; i < gIdx; i++) {
    index += (questionGroups.value[i] as any)?.questions?.length || 0
  }
  return index + qIdx + 1
}

function getQuestionTypeTag(typeName: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = { '单选题': undefined, '多选题': 'warning', '判断题': 'success', '填空题': 'info', '简答题': 'danger', '计算题': undefined, '应用题': 'danger' }
  return map[typeName]
}

function isObjectiveType(questionType: number): boolean {
  return questionType <= 4
}

function supportsPartial(questionType: number): boolean {
  return questionType >= 4 || questionType === 2
}

function parseOptions(optionsJson: string) {
  try {
    return JSON.parse(optionsJson)
  } catch {
    return []
  }
}

function onScoreChange(question: any, newVal: any) {
  scoreMap.value[question.questionId] = typeof newVal === 'number' ? newVal : Number(newVal) || 0
}

async function fetchPaper() {
  loading.value = true
  try {
    paper.value = await getPaperDetail(paperId.value)
    const sheet = await getAnswerSheet(paperId.value)
    if (sheet) {
      answerSheet.value = sheet
      alreadyScored.value = true
      if (sheet.detailList) {
        for (const d of sheet.detailList) {
          scoreMap.value[d.questionId] = d.score
        }
      }
    }
  } catch (e) {
    console.error('获取试卷详情失败', e)
  } finally {
    loading.value = false
  }
}

function handleReset() {
  scoreMap.value = {}
}

async function handleSubmit() {
  if (scoredCount.value < (paper.value?.totalQuestion || 0)) {
    ElMessage.warning(`还有 ${(paper.value?.totalQuestion || 0) - scoredCount.value} 题未评分，请完成所有评分后再提交`)
    return
  }

  submitting.value = true
  try {
    const details = (paper.value?.questionList || []).map((q: any) => ({
      questionId: q.questionId,
      questionType: q.questionType,
      isCorrect: (scoreMap.value[q.questionId] ?? 0) >= (q.score || 0) ? 1 : ((scoreMap.value[q.questionId] ?? 0) > 0 ? 2 : 0),
      score: scoreMap.value[q.questionId] || 0,
      maxScore: q.score || 0
    }))

    const result = await submitScore(paperId.value, { details })
    ElMessage.success('评分提交成功！错题已自动归入错题本，知识点掌握度已更新')
    router.push('/papers')
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchPaper()
})

useSeoMeta({ title: '试卷评分 - 教育云平台' })
</script>

<style scoped>
.score-page { min-height: calc(100vh - var(--header-height) - var(--footer-height)); background: #f5f7fa; }
.page-container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
.back-bar { margin-bottom: 16px; }
.content-area { background: #fff; border-radius: 8px; padding: 32px; }
.paper-header { text-align: center; margin-bottom: 16px; }
.paper-title { font-size: 24px; font-weight: 600; color: #303133; margin: 0 0 12px; }
.paper-meta { display: flex; justify-content: center; gap: 8px; }
.already-scored { margin-bottom: 16px; }
.already-scored p { margin: 8px 0 0; color: #606266; }
.scoring-progress { background: #f0f5ff; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
.progress-bar { margin-bottom: 8px; }
.progress-info { display: flex; justify-content: space-between; font-size: 13px; color: #606266; }
.question-group { margin-bottom: 32px; }
.group-title { font-size: 16px; font-weight: 500; color: #303133; margin: 0 0 16px; padding-bottom: 8px; border-bottom: 2px solid #409eff; }
.question-item { background: #fafafa; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #ebeef5; }
.question-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.question-num { font-weight: 500; font-size: 14px; color: #409eff; }
.question-score { font-size: 13px; color: #909399; margin-left: auto; }
.question-content { font-size: 14px; color: #303133; line-height: 1.7; margin-bottom: 8px; }
.question-options { margin-bottom: 8px; }
.option-line { font-size: 14px; color: #606266; line-height: 1.6; padding: 2px 0; }
.opt-label { font-weight: 500; margin-right: 4px; }
.question-answer { background: #f0f9eb; padding: 8px 12px; border-radius: 4px; margin-bottom: 8px; font-size: 14px; }
.answer-label { color: #67c23a; font-weight: 500; }
.answer-value { color: #303133; }
.score-controls { display: flex; align-items: center; gap: 12px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #dcdfe6; }
.quick-buttons { display: flex; align-items: center; gap: 8px; }
.score-label { font-size: 14px; color: #606266; font-weight: 500; }
.manual-score { display: flex; align-items: center; gap: 8px; }
.max-score { font-size: 13px; color: #909399; }
.scored-badge { margin-left: auto; }
.score-actions { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #ebeef5; }
.action-buttons { display: flex; gap: 12px; }
</style>
