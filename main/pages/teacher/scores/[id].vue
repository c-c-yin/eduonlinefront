<template>
  <div class="score-detail-page">
    <div class="container">
      <div class="page-header">
        <el-button text @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
        <h1 class="page-title">{{ detail?.homeworkName || '成绩录入' }}</h1>
        <p class="page-desc">逐题打分，每题关联知识点，系统自动汇总学生知识点掌握度</p>
      </div>

      <div v-if="detail" class="score-content">
        <!-- 信息栏 -->
        <div class="info-bar">
          <span>满分：{{ detail.totalScore }}分</span>
          <span>试题数：{{ detail.questions.length }}题</span>
          <span>学生数：{{ detail.students.length }}人</span>
          <el-button type="primary" @click="handleSave" :loading="saving">保存全部</el-button>
          <el-button type="info" plain @click="showLogDialog">修改日志</el-button>
        </div>

        <!-- 逐题打分表格 -->
        <div class="score-table-wrapper">
          <el-table
            :data="scoreTableData"
            border
            stripe
            :max-height="500"
            style="width: 100%"
            class="score-table"
          >
            <!-- 固定列：学生信息 -->
            <el-table-column prop="studentName" label="姓名" width="100" fixed="left" />
            <el-table-column prop="studentNo" label="学号" width="100" fixed="left" />

            <!-- 每道题的打分列 -->
            <el-table-column
              v-for="(q, qIdx) in detail.questions"
              :key="q.questionId"
              :width="120"
              :min-width="110"
            >
              <template #header>
                <div class="question-header">
                  <span>第{{ qIdx + 1 }}题</span>
                  <span class="q-max-score">({{ q.maxScore }}分)</span>
                  <el-tooltip :content="'关联知识点：' + (q.knowledgeName || '未关联')" placement="top">
                    <span class="q-knowledge-tag">{{ q.knowledgeName || '未关联' }}</span>
                  </el-tooltip>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number
                  v-model="row.scores[qIdx]"
                  :min="0"
                  :max="q.maxScore"
                  :step="0.5"
                  :precision="1"
                  size="small"
                  controls-position="right"
                  style="width: 100%"
                  @change="(val: number) => onScoreChange(row, qIdx, val)"
                />
              </template>
            </el-table-column>

            <!-- 总分列 -->
            <el-table-column label="总分" width="80" fixed="right">
              <template #default="{ row }">
                <span
                  class="total-score"
                  :class="{ 'score-error': row.totalScore > detail!.totalScore }"
                >
                  {{ row.totalScore }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 知识点汇总预览 -->
        <div v-if="knowledgeSummary.length > 0" class="knowledge-summary">
          <h3 class="section-title">知识点得分汇总预览</h3>
          <div class="knowledge-grid">
            <div v-for="k in knowledgeSummary" :key="k.knowledgeName" class="knowledge-item">
              <span class="know-name">{{ k.knowledgeName }}</span>
              <span class="know-score">{{ k.totalScore }} / {{ k.maxTotal }}</span>
              <el-progress
                :percentage="Math.round(k.totalScore / k.maxTotal * 100)"
                :color="getProgressColor(k.totalScore / k.maxTotal)"
                :stroke-width="6"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading" class="empty-state">
        <el-empty description="暂无成绩数据" />
      </div>
    </div>

    <!-- 修改日志对话框 -->
    <el-dialog v-model="logDialogVisible" title="成绩修改日志" width="700px">
      <el-table :data="logList" v-loading="logLoading" stripe max-height="400">
        <el-table-column prop="studentName" label="学生" width="100" />
        <el-table-column label="原分数" width="80" align="center">
          <template #default="{ row }">{{ row.oldScore ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="新分数" width="80" align="center">
          <template #default="{ row }">
            <span :style="{ color: row.newScore > row.oldScore ? '#67C23A' : '#F56C6C' }">{{ row.newScore ?? '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="changeType" label="修改类型" width="100" />
        <el-table-column prop="changeReason" label="修改原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="100" />
        <el-table-column prop="operTime" label="修改时间" width="160" />
      </el-table>
      <div v-if="logTotal > logParams.pageSize" class="log-pagination">
        <el-pagination
          v-model:current-page="logParams.pageNum"
          :total="logTotal"
          :page-size="logParams.pageSize"
          layout="prev, pager, next"
          @current-change="fetchLogs"
        />
      </div>
      <el-empty v-if="!logLoading && logList.length === 0" description="暂无修改记录" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useScoreApi, type ScoreDetail, type ScoreQuestion, type ScoreLog } from '@/composables/useScoreApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const route = useRoute()
const router = useRouter()
const { getScoreDetail, batchSaveScoreDetail, getScoreLogs } = useScoreApi()

const homeworkId = computed(() => Number(route.params.id))
const detail = ref<ScoreDetail | null>(null)
const loading = ref(false)
const saving = ref(false)

// 表格数据：每个学生一行，包含每道题的得分
interface ScoreRow {
  studentId: number
  studentNo: string
  studentName: string
  className: string
  scores: number[]    // 每道题得分
  totalScore: number  // 总分
  originalTotal: number  // 原始总分（用于判断是否修改）
}

const scoreTableData = ref<ScoreRow[]>([])

// 知识点汇总
interface KnowledgeSummaryItem {
  knowledgeName: string
  totalScore: number
  maxTotal: number
}

const knowledgeSummary = computed<KnowledgeSummaryItem[]>(() => {
  if (!detail.value || scoreTableData.value.length === 0) return []
  const map: Record<string, { total: number; max: number; count: number }> = {}

  detail.value.questions.forEach((q, qIdx) => {
    const name = q.knowledgeName || '未关联'
    if (!map[name]) map[name] = { total: 0, max: 0, count: 0 }
    map[name].count += 1
    map[name].max += q.maxScore * detail.value!.students.length
    scoreTableData.value.forEach(row => {
      map[name].total += row.scores[qIdx] || 0
    })
  })

  return Object.entries(map).map(([knowledgeName, data]) => ({
    knowledgeName,
    totalScore: Math.round(data.total * 10) / 10,
    maxTotal: data.max
  }))
})

function onScoreChange(row: ScoreRow, qIdx: number, val: number) {
  // 重新计算总分
  row.totalScore = row.scores.reduce((sum, s) => sum + (s || 0), 0)
}

function getProgressColor(rate: number): string {
  if (rate >= 0.8) return '#43e97b'
  if (rate >= 0.6) return '#4facfe'
  if (rate >= 0.4) return '#e6a23c'
  return '#f56c6c'
}

function goBack() {
  router.push('/teacher/scores')
}

async function fetchDetail() {
  loading.value = true
  try {
    const data = await getScoreDetail(homeworkId.value)
    detail.value = data

    // 构建表格数据
    scoreTableData.value = data.students.map(s => {
      const scores = data.questions.map((_q, qIdx) => s.scoreList?.[qIdx] ?? 0)
      const total = scores.reduce((sum, v) => sum + v, 0)
      return {
        studentId: s.studentId,
        studentNo: s.studentNo,
        studentName: s.studentName,
        className: s.className,
        scores,
        totalScore: total,
        originalTotal: total
      }
    })
  } catch {
    detail.value = null
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  const scores = scoreTableData.value.map(row => ({
    studentId: row.studentId,
    scoreList: row.scores
  }))

  saving.value = true
  try {
    await batchSaveScoreDetail(homeworkId.value, scores)
    ElMessage.success('成绩保存成功，知识点掌握度已自动更新')
    // 刷新数据
    await fetchDetail()
  } catch {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

// 成绩修改日志
const logDialogVisible = ref(false)
const logLoading = ref(false)
const logList = ref<ScoreLog[]>([])
const logTotal = ref(0)
const logParams = ref({ pageNum: 1, pageSize: 10 })

async function fetchLogs() {
  logLoading.value = true
  try {
    const result = await getScoreLogs(homeworkId.value, logParams.value)
    logList.value = result.rows
    logTotal.value = result.total
  } catch (e) {
    console.error('获取修改日志失败:', e)
  } finally {
    logLoading.value = false
  }
}

function showLogDialog() {
  logParams.value.pageNum = 1
  logDialogVisible.value = true
  fetchLogs()
}

useSeoMeta({
  title: '成绩录入 - 教育云平台'
})
</script>

<style scoped>
.score-detail-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 100%;
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

.score-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.info-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  color: #666;
}

.info-bar > :last-child {
  margin-left: auto;
}

.score-table-wrapper {
  overflow-x: auto;
}

.score-table {
  font-size: 13px;
}

.question-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  font-size: 13px;
}

.q-max-score {
  font-size: 11px;
  color: #909399;
}

.q-knowledge-tag {
  font-size: 10px;
  color: #409eff;
  background: #ecf5ff;
  padding: 1px 6px;
  border-radius: 4px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

.total-score {
  font-size: 16px;
  font-weight: 700;
  color: #303133;
}

.total-score.score-error {
  color: #f56c6c;
}

.knowledge-summary {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.knowledge-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #f7f8fa;
  border-radius: 8px;
}

.know-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.know-score {
  font-size: 12px;
  color: #909399;
}

.empty-state {
  padding: 80px 0;
}

@media (max-width: 768px) {
  .container {
    padding: 16px 12px 0;
  }

  .score-content {
    padding: 16px;
  }

  .info-bar {
    flex-wrap: wrap;
    gap: 12px;
  }
}

.log-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>