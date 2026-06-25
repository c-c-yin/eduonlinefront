<template>
  <div class="score-analysis-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">成绩分析</h1>
        <p class="page-desc">深入分析班级成绩数据，定位教学薄弱环节</p>
      </div>

      <!-- Class selector -->
      <div class="filter-bar">
        <el-select v-model="selectedClassId" placeholder="选择班级" style="width: 200px" @change="onClassChange">
          <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
        </el-select>
      </div>

      <div v-if="!selectedClassId" class="empty-state">
        <el-empty description="请选择班级查看成绩分析" />
      </div>

      <div v-else>
        <!-- Overview stats -->
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ overview?.avgScore ?? '-' }}</span>
            <span class="stat-label">平均分</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ overview?.maxScore ?? '-' }}</span>
            <span class="stat-label">最高分</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ overview?.minScore ?? '-' }}</span>
            <span class="stat-label">最低分</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ overview?.passRate ?? '-' }}%</span>
            <span class="stat-label">及格率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ overview?.excellentRate ?? '-' }}%</span>
            <span class="stat-label">优秀率</span>
          </div>
        </div>

        <!-- Charts: distribution + trend side by side -->
        <div class="charts-row">
          <div class="chart-panel">
            <h3 class="panel-title">成绩分布</h3>
            <BaseChart :option="distributionChartOption" height="300px" v-if="distribution.length > 0" />
            <el-empty v-else description="暂无数据" :image-size="60" />
          </div>
          <div class="chart-panel">
            <h3 class="panel-title">成绩趋势</h3>
            <BaseChart :option="trendChartOption" height="300px" v-if="trend.length > 0" />
            <el-empty v-else description="暂无数据" :image-size="60" />
          </div>
        </div>

        <!-- Knowledge radar + detail -->
        <div class="charts-row">
          <div class="chart-panel">
            <h3 class="panel-title">知识点雷达图</h3>
            <BaseChart :option="radarChartOption" height="350px" v-if="radarData.length > 0" />
            <el-empty v-else description="暂无数据" :image-size="60" />
          </div>
          <div class="chart-panel">
            <h3 class="panel-title">知识点得分详情</h3>
            <div v-if="knowledgeDetail.length > 0" class="knowledge-list">
              <div v-for="k in knowledgeDetail" :key="k.knowledgeId" class="knowledge-row">
                <span class="know-name">{{ k.knowledgeName }}</span>
                <span class="know-score">{{ k.avgScore }} / {{ k.totalScore }}</span>
                <el-progress :percentage="Math.round(k.correctRate)" :stroke-width="8" :color="getProgressColor(k.correctRate)" />
              </div>
            </div>
            <el-empty v-else description="暂无数据" :image-size="60" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatisticsApi, type ScoreOverview, type ScoreDistribution, type ScoreTrend, type KnowledgeRadar, type KnowledgeDetail } from '@/composables/useStatisticsApi'
import { useScoreApi } from '@/composables/useScoreApi'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/common/BaseChart.vue'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const { getScoreOverview, getScoreDistribution, getScoreTrend, getKnowledgeRadar, getKnowledgeDetail } = useStatisticsApi()
const { getTeacherClasses } = useScoreApi()

const classes = ref<{ classId: number; className: string }[]>([])
const selectedClassId = ref<number | null>(null)

const overview = ref<ScoreOverview | null>(null)
const distribution = ref<ScoreDistribution[]>([])
const trend = ref<ScoreTrend[]>([])
const radarData = ref<KnowledgeRadar[]>([])
const knowledgeDetail = ref<KnowledgeDetail[]>([])

async function fetchClasses() {
  try {
    const data = await getTeacherClasses()
    classes.value = data
    if (data.length > 0) {
      selectedClassId.value = data[0].classId
      onClassChange(data[0].classId)
    }
  } catch {
    classes.value = []
  }
}

async function onClassChange(classId: number) {
  if (!classId) return
  try {
    const [overviewData, distributionData, trendData, radarRes, detailRes] = await Promise.all([
      getScoreOverview({ classId }),
      getScoreDistribution({ classId }),
      getScoreTrend({ classId }),
      getKnowledgeRadar({ classId }),
      getKnowledgeDetail({ classId })
    ])
    overview.value = overviewData
    distribution.value = distributionData
    trend.value = trendData
    radarData.value = radarRes
    knowledgeDetail.value = detailRes
  } catch {
    overview.value = null
    distribution.value = []
    trend.value = []
    radarData.value = []
    knowledgeDetail.value = []
  }
}

function getProgressColor(correctRate: number): string {
  if (correctRate >= 80) return '#43e97b'
  if (correctRate >= 60) return '#4facfe'
  if (correctRate >= 40) return '#f0ad4e'
  return '#f56c6c'
}

// 成绩分布柱状图
const distributionChartOption = computed<EChartsOption>(() => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: { left: 40, right: 20, bottom: 20, top: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: distribution.value.map(d => d.range),
      axisLabel: { fontSize: 11, color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#666' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [{
      type: 'bar',
      data: distribution.value.map(d => ({
        value: d.count,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      })),
      barWidth: 28
    }]
  }
})

// 成绩趋势折线图
const trendChartOption = computed<EChartsOption>(() => {
  return {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['平均分', '及格率'],
      bottom: 0,
      textStyle: { fontSize: 12, color: '#666' }
    },
    grid: { left: 40, right: 20, bottom: 40, top: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: trend.value.map(t => t.date),
      axisLabel: { fontSize: 11, color: '#666' }
    },
    yAxis: [
      {
        type: 'value',
        name: '分数',
        axisLabel: { fontSize: 11, color: '#666' },
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
      },
      {
        type: 'value',
        name: '百分比',
        max: 100,
        axisLabel: { fontSize: 11, color: '#666', formatter: '{value}%' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '平均分',
        type: 'line',
        data: trend.value.map(t => t.avgScore),
        smooth: true,
        itemStyle: { color: '#667eea' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '及格率',
        type: 'line',
        yAxisIndex: 1,
        data: trend.value.map(t => t.passRate),
        smooth: true,
        itemStyle: { color: '#43e97b' },
        lineStyle: { width: 2 },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  }
})

// 知识点雷达图
const radarChartOption = computed<EChartsOption>(() => {
  const indicators = radarData.value.map(k => ({
    name: k.knowledgeName,
    max: 100
  }))

  return {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: radarData.value[0]?.gradeAvg !== undefined ? ['班级平均', '年级平均'] : ['班级平均'],
      bottom: 0,
      textStyle: { fontSize: 12, color: '#666' }
    },
    radar: {
      indicator: indicators,
      center: ['50%', '45%'],
      radius: '65%',
      axisName: {
        color: '#666',
        fontSize: 11
      }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: radarData.value.map(k => k.classAvg),
          name: '班级平均',
          areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
          lineStyle: { color: '#667eea', width: 2 },
          itemStyle: { color: '#667eea' },
          symbol: 'circle',
          symbolSize: 4
        },
        ...(radarData.value[0]?.gradeAvg !== undefined ? [{
          value: radarData.value.map(k => k.gradeAvg),
          name: '年级平均',
          areaStyle: { color: 'rgba(67, 233, 123, 0.2)' },
          lineStyle: { color: '#43e97b', width: 2 },
          itemStyle: { color: '#43e97b' },
          symbol: 'circle',
          symbolSize: 4
        }] : [])
      ]
    }]
  }
})

onMounted(() => {
  fetchClasses()
})

useSeoMeta({
  title: '成绩分析 - 教育云平台'
})
</script>

<style scoped>
.score-analysis-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.empty-state {
  padding: 80px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.stat-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border-radius: 8px;
  background: #f7f8fa;
  transition: background 0.2s;
}

.knowledge-row:hover {
  background: #f0f2ff;
}

.know-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.know-score {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>