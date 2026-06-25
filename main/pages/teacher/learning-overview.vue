<template>
  <div class="learning-overview-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">学情概览</h1>
        <p class="page-desc">全面掌握所教班级学生的学情数据</p>
      </div>

      <!-- Summary cards: 班级数, 学生总数, 班级平均分, 预警数 -->
      <div class="summary-cards">
        <div class="summary-card" v-for="card in summaryCards" :key="card.label">
          <div class="card-icon" :style="{ background: card.color }">
            <el-icon :size="20"><component :is="card.icon" /></el-icon>
          </div>
          <div class="card-info">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-label">{{ card.label }}</div>
          </div>
        </div>
      </div>

      <!-- Tab sections: 成绩趋势, 知识点掌握, 班级对比 -->
      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="成绩趋势" name="trend">
          <div class="chart-panel">
            <BaseChart :option="trendChartOption" height="350px" v-if="trendData.length > 0" />
            <el-empty v-else description="暂无成绩趋势数据" :image-size="80" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="知识点掌握" name="knowledge">
          <div class="chart-panel">
            <BaseChart :option="knowledgeRadarOption" height="350px" v-if="knowledgeRadarData.length > 0" />
            <el-empty v-else description="暂无知识点数据" :image-size="80" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="班级对比" name="comparison">
          <div class="chart-panel">
            <BaseChart :option="comparisonChartOption" height="350px" v-if="comparisonData.length > 0" />
            <el-empty v-else description="暂无班级对比数据" :image-size="80" />
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- Quick links -->
      <div class="quick-links">
        <h3 class="section-title">快捷入口</h3>
        <div class="link-grid">
          <div class="link-item" @click="router.push('/teacher/knowledge-report')">
            <el-icon><DataAnalysis /></el-icon>
            <span>知识点报告</span>
          </div>
          <div class="link-item" @click="router.push('/teacher/scores')">
            <el-icon><Tickets /></el-icon>
            <span>成绩管理</span>
          </div>
          <div class="link-item" @click="router.push('/teacher/statistics/score')">
            <el-icon><TrendCharts /></el-icon>
            <span>成绩分析</span>
          </div>
          <div class="link-item" @click="router.push('/teacher/profile/students')">
            <el-icon><User /></el-icon>
            <span>学生画像</span>
          </div>
          <div class="link-item" @click="router.push('/teacher/alerts')">
            <el-icon><Warning /></el-icon>
            <span>预警中心<el-badge v-if="unreadAlertCount" :value="unreadAlertCount" class="badge" /></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { School, User, DataAnalysis, TrendCharts, Tickets, Warning } from '@element-plus/icons-vue'
import { useDashboardApi } from '@/composables/useDashboardApi'
import { useKnowledgeApi } from '@/composables/useKnowledgeApi'
import { useStatisticsApi, type ClassComparison, type KnowledgeRadar, type ScoreTrend } from '@/composables/useStatisticsApi'
import { useAlertApi } from '@/composables/useAlertApi'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/common/BaseChart.vue'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const { getTeacherDashboard } = useDashboardApi()
const { getTeacherClassesOverview } = useKnowledgeApi()
const { getScoreTrend, getKnowledgeRadar, getClassComparison } = useStatisticsApi()
const { getUnreadCount } = useAlertApi()

const activeTab = ref('trend')

// Summary data
const classCount = ref(0)
const studentCount = ref(0)
const avgScore = ref(0)
const unreadAlertCount = ref(0)

// Chart data
const trendData = ref<ScoreTrend[][]>([])
const knowledgeRadarData = ref<KnowledgeRadar[]>([])
const comparisonData = ref<ClassComparison[]>([])

// Summary cards config
const summaryCards = computed(() => [
  {
    label: '班级数',
    value: classCount.value || '-',
    icon: School,
    color: '#667eea'
  },
  {
    label: '学生总数',
    value: studentCount.value || '-',
    icon: User,
    color: '#4facfe'
  },
  {
    label: '班级平均分',
    value: avgScore.value ? `${avgScore.value.toFixed(1)}分` : '-',
    icon: DataAnalysis,
    color: '#43e97b'
  },
  {
    label: '预警数',
    value: unreadAlertCount.value || 0,
    icon: Warning,
    color: '#f093fb'
  }
])

// Trend chart option (multi-line for each class)
const trendChartOption = computed<EChartsOption>(() => {
  if (trendData.value.length === 0) return {}

  // Collect all unique dates across all classes
  const dateSet = new Set<string>()
  trendData.value.forEach(classTrends => {
    classTrends.forEach(t => dateSet.add(t.date))
  })
  const dates = Array.from(dateSet).sort()

  const colors = ['#667eea', '#4facfe', '#43e97b', '#f093fb', '#f0ad4e', '#f56c6c']

  const series = trendData.value.map((classTrends, idx) => {
    const dateMap = new Map(classTrends.map(t => [t.date, t.avgScore]))
    return {
      name: `班级${idx + 1}`,
      type: 'line',
      smooth: true,
      data: dates.map(d => dateMap.get(d) ?? null),
      lineStyle: { color: colors[idx % colors.length] },
      itemStyle: { color: colors[idx % colors.length] },
      symbol: 'circle',
      symbolSize: 6
    }
  })

  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 0, textStyle: { fontSize: 12 } },
    grid: { left: 40, right: 30, bottom: 20, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: { fontSize: 11, color: '#666' },
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      name: '平均分',
      axisLabel: { fontSize: 11, color: '#666' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series
  }
})

// Knowledge radar option
const knowledgeRadarOption = computed<EChartsOption>(() => {
  if (knowledgeRadarData.value.length === 0) return {}

  const indicators = knowledgeRadarData.value.map(k => ({
    name: k.knowledgeName,
    max: 100
  }))

  return {
    tooltip: { trigger: 'item' },
    legend: {
      top: 0,
      data: ['班级平均', '年级平均'].filter(Boolean),
      textStyle: { fontSize: 12 }
    },
    radar: {
      center: ['50%', '55%'],
      radius: '60%',
      indicator: indicators,
      axisName: { fontSize: 11, color: '#666' }
    },
    series: [{
      type: 'radar',
      data: [
        {
          name: '班级平均',
          value: knowledgeRadarData.value.map(k => k.classAvg),
          lineStyle: { color: '#667eea' },
          areaStyle: { color: 'rgba(102, 126, 234, 0.2)' },
          itemStyle: { color: '#667eea' }
        },
        ...(knowledgeRadarData.value.some(k => k.gradeAvg != null)
          ? [{
              name: '年级平均',
              value: knowledgeRadarData.value.map(k => k.gradeAvg ?? 0),
              lineStyle: { color: '#43e97b' },
              areaStyle: { color: 'rgba(67, 233, 123, 0.15)' },
              itemStyle: { color: '#43e97b' }
            }]
          : [])
      ]
    }]
  }
})

// Class comparison bar chart option
const comparisonChartOption = computed<EChartsOption>(() => {
  if (comparisonData.value.length === 0) return {}

  const classNames = comparisonData.value.map(c => c.className)
  const colors = ['#667eea', '#4facfe', '#43e97b']

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      top: 0,
      data: ['平均分', '及格率', '优秀率'],
      textStyle: { fontSize: 12 }
    },
    grid: { left: 40, right: 30, bottom: 20, top: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: classNames,
      axisLabel: { fontSize: 12, color: '#666' }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#666' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [
      {
        name: '平均分',
        type: 'bar',
        data: comparisonData.value.map(c => c.avgScore),
        itemStyle: { color: colors[0], borderRadius: [4, 4, 0, 0] },
        barWidth: 24
      },
      {
        name: '及格率',
        type: 'bar',
        data: comparisonData.value.map(c => c.passRate),
        itemStyle: { color: colors[1], borderRadius: [4, 4, 0, 0] },
        barWidth: 24
      },
      {
        name: '优秀率',
        type: 'bar',
        data: comparisonData.value.map(c => c.excellentRate),
        itemStyle: { color: colors[2], borderRadius: [4, 4, 0, 0] },
        barWidth: 24
      }
    ]
  }
})

onMounted(async () => {
  try {
    // Fetch dashboard data for class count and student count
    const dashboard = await getTeacherDashboard()
    classCount.value = dashboard?.classCount ?? 0
    studentCount.value = dashboard?.studentCount ?? 0
  } catch {
    // ignore
  }

  try {
    // Fetch class comparison data
    const comparison = await getClassComparison()
    comparisonData.value = comparison || []
    if (comparison && comparison.length > 0) {
      const total = comparison.reduce((sum, c) => sum + c.avgScore, 0)
      avgScore.value = total / comparison.length
    }
  } catch {
    // ignore
  }

  try {
    // Fetch unread alert count
    unreadAlertCount.value = await getUnreadCount()
  } catch {
    // ignore
  }

  try {
    // Fetch class overview for radar data from first class
    const overview = await getTeacherClassesOverview()
    if (overview && overview.length > 0) {
      const firstClassId = overview[0].classId
      const radar = await getKnowledgeRadar({ classId: firstClassId })
      knowledgeRadarData.value = radar || []

      // Fetch score trends for each class
      const trendPromises = overview.map(c => getScoreTrend({ classId: c.classId }).catch(() => [] as ScoreTrend[]))
      const allTrends = await Promise.all(trendPromises)
      trendData.value = allTrends.filter(t => t.length > 0)
    }
  } catch {
    // ignore
  }
})

useSeoMeta({
  title: '学情概览 - 教育云平台'
})
</script>

<style scoped>
.learning-overview-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.summary-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.card-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.content-tabs {
  margin-bottom: 24px;
}

.content-tabs :deep(.el-tabs__header) {
  margin-bottom: 16px;
}

.content-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
}

.chart-panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-links {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
}

.link-grid {
  display: flex;
  gap: 16px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.link-item:hover {
  color: #667eea;
  background: #f0f2ff;
  transform: translateY(-1px);
}

.badge {
  margin-left: 4px;
}

@media (max-width: 900px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .link-grid {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>