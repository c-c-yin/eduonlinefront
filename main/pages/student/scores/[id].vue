<template>
  <div class="score-detail-page">
    <ErrorBoundary>
      <div class="container">
        <!-- 返回按钮 -->
        <div class="back-bar">
          <el-button text @click="router.push('/student/scores')">
            <el-icon><ArrowLeft /></el-icon>
            返回成绩列表
          </el-button>
        </div>

        <div v-loading="loading">
          <template v-if="data">
            <!-- 作业基本信息 -->
            <div class="panel info-panel">
              <h3 class="panel-title">作业基本信息</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">作业名称</span>
                  <span class="info-value">{{ data.homeworkName || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">学科</span>
                  <span class="info-value">
                    <el-tag size="small" type="info">{{ data.subjectName || '-' }}</el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">得分</span>
                  <span class="info-value">
                    <span class="score-text">{{ data.score }}</span>
                    <span class="score-total-text"> / {{ data.totalScore }}</span>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">得分率</span>
                  <span class="info-value rate-tag" :style="{ color: rateColor(scoreRate) }">
                    {{ scoreRate }}%
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">来源</span>
                  <span class="info-value">
                    <el-tag size="small" :type="sourceTagType(data.sourceType)">
                      {{ sourceLabel(data.sourceType) }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">提交时间</span>
                  <span class="info-value">{{ formatTime(data.submitTime) }}</span>
                </div>
              </div>
            </div>

            <!-- 薄弱知识点提示 -->
            <el-alert
              v-if="weakKnowledge.length > 0"
              class="weak-alert"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #title>
                检测到 {{ weakKnowledge.length }} 个薄弱知识点（得分率低于60%），建议加强练习
              </template>
            </el-alert>

            <!-- 知识点掌握雷达图 -->
            <div class="panel" v-if="knowledgeList.length > 0">
              <h3 class="panel-title">知识点掌握雷达图</h3>
              <BaseChart :option="radarChartOption" height="360px" />
            </div>

            <!-- 知识点得分明细 -->
            <div class="panel">
              <h3 class="panel-title">知识点得分明细</h3>
              <el-table
                :data="knowledgeList"
                stripe
                style="width: 100%"
                empty-text="暂无知识点数据"
                :row-class-name="rowClassName"
              >
                <el-table-column prop="knowledgeName" label="知识点名称" min-width="180" show-overflow-tooltip />
                <el-table-column prop="knowledgeScore" label="得分" width="120" align="center">
                  <template #default="{ row }">
                    <span class="score-text">{{ row.knowledgeScore }}</span>
                    <span class="score-total-text"> / {{ row.knowledgeTotal }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="得分率" width="140" align="center">
                  <template #default="{ row }">
                    <span class="rate-tag" :style="{ color: rateColor(knowledgeRate(row)) }">
                      {{ knowledgeRate(row) }}%
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="掌握情况" width="160" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" :type="masteryTagType(knowledgeRate(row))">
                      {{ masteryLabel(knowledgeRate(row)) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="120" align="center" fixed="right">
                  <template #default="{ row }">
                    <el-button
                      v-if="knowledgeRate(row) < 60"
                      size="small"
                      type="primary"
                      plain
                      @click="goPractice"
                    >
                      去练习
                    </el-button>
                    <span v-else class="mastered-text">已掌握</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>

          <el-empty v-else-if="!loading" description="成绩不存在或暂无知识点分析数据" />
        </div>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import type { EChartsOption } from 'echarts'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import BaseChart from '@/components/common/BaseChart.vue'
import { useHomeworkApi } from '@/composables/useHomeworkApi'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const router = useRouter()
const route = useRoute()
const { getScoreKnowledge } = useHomeworkApi()

const scoreId = computed(() => Number(route.params.id))
const loading = ref(false)
const data = ref<any>(null)

const SOURCE_LABELS: Record<number, string> = {
  1: '教师录入',
  2: 'Excel导入',
  3: '学生自评',
  4: '管理人员录入'
}

const knowledgeList = computed<any[]>(() => {
  return data.value?.knowledgeList || []
})

const scoreRate = computed(() => {
  if (!data.value || !data.value.totalScore) return 0
  return Math.round((data.value.score / data.value.totalScore) * 1000) / 10
})

const weakKnowledge = computed(() => {
  return knowledgeList.value.filter(k => knowledgeRate(k) < 60)
})

function sourceLabel(type: number): string {
  return SOURCE_LABELS[type] || '未知'
}

function sourceTagType(type: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (type) {
    case 1: return 'primary' as any
    case 2: return 'warning'
    case 3: return 'success'
    case 4: return 'info'
    default: return 'info'
  }
}

function knowledgeRate(row: any): number {
  if (!row || !row.knowledgeTotal) return 0
  return Math.round((row.knowledgeScore / row.knowledgeTotal) * 1000) / 10
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#43e97b'
  if (rate >= 60) return '#4facfe'
  if (rate >= 40) return '#f0ad4e'
  return '#f56c6c'
}

function masteryLabel(rate: number): string {
  if (rate >= 80) return '精通'
  if (rate >= 60) return '掌握'
  if (rate >= 40) return '理解'
  return '薄弱'
}

function masteryTagType(rate: number): '' | 'success' | 'warning' | 'info' | 'danger' {
  if (rate >= 80) return 'success'
  if (rate >= 60) return 'primary' as any
  if (rate >= 40) return 'warning'
  return 'danger'
}

function rowClassName({ row }: { row: any }): string {
  return knowledgeRate(row) < 60 ? 'weak-row' : ''
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}

function goPractice() {
  router.push('/questions')
}

// 知识点掌握雷达图
const radarChartOption = computed<EChartsOption>(() => {
  const knowledge = knowledgeList.value
  return {
    tooltip: {
      formatter: (params: any) => {
        const idx = 0
        const values = params.value || []
        const lines = knowledge.map((k, i) => {
          return `${k.knowledgeName}：${knowledgeRate(k)}%`
        })
        return lines.join('<br/>')
      }
    },
    radar: {
      indicator: knowledge.map(k => ({ name: k.knowledgeName, max: 100 })),
      center: ['50%', '55%'],
      radius: '65%',
      axisName: { color: '#666', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(67, 233, 123, 0.05)', 'rgba(79, 172, 254, 0.05)']
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: knowledge.map(k => knowledgeRate(k)),
        name: '得分率',
        areaStyle: { color: 'rgba(79, 172, 254, 0.25)' },
        lineStyle: { color: '#4facfe', width: 2 },
        itemStyle: { color: '#4facfe' },
        symbol: 'circle',
        symbolSize: 6
      }]
    }]
  }
})

async function init() {
  loading.value = true
  try {
    data.value = await getScoreKnowledge(scoreId.value)
  } catch (e) {
    console.error(e)
    data.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  init()
})

useSeoMeta({
  title: '知识点分析 - 教育云平台'
})
</script>

<style scoped>
.score-detail-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0 0;
}

.back-bar {
  margin-bottom: 16px;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-label {
  font-size: 12px;
  color: #909399;
}

.info-value {
  font-size: 15px;
  color: #303133;
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-text {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.score-total-text {
  font-size: 13px;
  color: #909399;
}

.rate-tag {
  font-size: 18px;
  font-weight: 700;
}

.weak-alert {
  margin-bottom: 24px;
}

.mastered-text {
  font-size: 13px;
  color: #c0c4cc;
}

:deep(.weak-row) {
  background-color: #fef0f0 !important;
}

:deep(.weak-row:hover > td) {
  background-color: #fde2e2 !important;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
