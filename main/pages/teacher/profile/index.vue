<template>
  <div class="teacher-profile-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
      </div>

      <div v-loading="loading">
        <!-- 教师基本信息 + 综合标签 -->
        <el-card class="profile-header-card" v-if="profile">
          <div class="header-content">
            <div class="header-left">
              <el-avatar :src="userStore.avatar" :size="80" class="avatar" />
              <div class="header-info">
                <h2 class="teacher-name">{{ profile.teacherName }}</h2>
                <div class="teacher-meta">
                  <el-tag size="small">{{ profile.teacherNo }}</el-tag>
                  <el-tag size="small" type="info" v-if="profile.orgName">{{ profile.orgName }}</el-tag>
                  <el-tag size="small" type="success" v-if="profile.mainSubjectName">{{ profile.mainSubjectName }}</el-tag>
                </div>
                <p class="stat-date">统计日期: {{ profile.statDate }}</p>
              </div>
            </div>
            <div class="header-right">
              <div class="composite-score">
                <span class="score-value">{{ profile.compositeScore?.toFixed(1) }}</span>
                <span class="score-label">综合画像分</span>
              </div>
              <el-tag
                :type="labelTagType"
                size="large"
                effect="dark"
                class="composite-label"
              >
                {{ profile.compositeLabel }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 5维度雷达图 -->
        <el-card class="chart-card" v-if="profile">
          <template #header>
            <span class="card-title">能力维度雷达图</span>
          </template>
          <div ref="radarChartRef" class="chart-container" style="height: 400px" />
        </el-card>

        <!-- 维度明细 -->
        <el-card class="dimension-card" v-if="profile?.dimensions?.length">
          <template #header>
            <span class="card-title">维度明细</span>
          </template>
          <div class="dimension-list">
            <div v-for="dim in profile.dimensions" :key="dim.dimensionKey" class="dimension-item">
              <div class="dim-header">
                <span class="dim-name">{{ dim.dimensionName }}</span>
                <span class="dim-weight">权重 {{ (dim.weight * 100).toFixed(0) }}%</span>
              </div>
              <div class="dim-score-row">
                <el-progress
                  :percentage="dim.score"
                  :stroke-width="12"
                  :color="getScoreColor(dim.score)"
                  class="dim-progress"
                />
                <span class="dim-score">{{ dim.score?.toFixed(1) }}</span>
              </div>
              <p class="dim-desc" v-if="dim.description">{{ dim.description }}</p>
            </div>
          </div>
        </el-card>

        <!-- 趋势折线图 -->
        <el-card class="chart-card" v-if="profile?.trend?.length">
          <template #header>
            <span class="card-title">画像分数趋势（近30天）</span>
          </template>
          <div ref="trendChartRef" class="chart-container" style="height: 300px" />
        </el-card>

        <el-empty v-if="!loading && !profile" description="暂无画像数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useDashboardApi } from '@/composables/useDashboardApi'
import type { TeacherProfileDetail } from '@/types'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const userStore = useUserStore()
const { getTeacherProfileDetail } = useDashboardApi()

const loading = ref(false)
const profile = ref<TeacherProfileDetail | null>(null)
const radarChartRef = ref<HTMLElement>()
const trendChartRef = ref<HTMLElement>()

let radarChart: any = null
let trendChart: any = null

const labelTagType = computed(() => {
  if (!profile.value) return ''
  const label = profile.value.compositeLabel
  if (label.includes('名师')) return 'success'
  if (label.includes('骨干')) return 'primary'
  if (label.includes('成长')) return 'warning'
  if (label.includes('新秀')) return 'info'
  return 'danger'
})

function getScoreColor(score: number): string {
  if (score >= 85) return '#67C23A'
  if (score >= 70) return '#409EFF'
  if (score >= 55) return '#E6A23C'
  return '#F56C6C'
}

async function fetchProfile() {
  loading.value = true
  try {
    profile.value = await getTeacherProfileDetail()
    await nextTick()
    renderRadarChart()
    renderTrendChart()
  } catch (error) {
    console.error('获取教师画像详情失败:', error)
    ElMessage.error('获取画像数据失败')
  } finally {
    loading.value = false
  }
}

function renderRadarChart() {
  if (!radarChartRef.value || !profile.value) return
  const echarts = useEcharts()
  if (!echarts) return
  radarChart = echarts.init(radarChartRef.value)
  const dims = profile.value.dimensions || []
  const indicator = dims.map(d => ({ name: d.dimensionName, max: 100 }))
  const values = dims.map(d => d.score || 0)
  radarChart.setOption({
    tooltip: { trigger: 'item' },
    radar: {
      indicator: indicator.length > 0 ? indicator : [
        { name: '产出力', max: 100 },
        { name: '质量', max: 100 },
        { name: '命题', max: 100 },
        { name: '影响力', max: 100 },
        { name: '活跃度', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#666', fontSize: 13 }
    },
    series: [{
      type: 'radar',
      data: [{
        value: values.length > 0 ? values : [
          profile.value.productionScore || 0,
          profile.value.qualityScore || 0,
          profile.value.propositionScore || 0,
          profile.value.influenceScore || 0,
          profile.value.activityScore || 0
        ],
        name: '我的画像',
        areaStyle: { color: 'rgba(64, 158, 255, 0.3)' },
        lineStyle: { color: '#409EFF', width: 2 },
        itemStyle: { color: '#409EFF' }
      }]
    }]
  })
}

function renderTrendChart() {
  if (!trendChartRef.value || !profile.value?.trend?.length) return
  const echarts = useEcharts()
  if (!echarts) return
  trendChart = echarts.init(trendChartRef.value)
  const trend = profile.value.trend
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.date),
      axisLabel: { rotate: 30, fontSize: 11 }
    },
    yAxis: { type: 'value', min: 0, max: 100, name: '分数' },
    series: [{
      type: 'line',
      data: trend.map(t => t.score),
      name: '综合画像分',
      smooth: true,
      lineStyle: { color: '#409EFF', width: 2 },
      itemStyle: { color: '#409EFF' },
      areaStyle: { color: 'rgba(64, 158, 255, 0.15)' }
    }],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
  })
}

function useEcharts() {
  // 通过插件注入的 echarts
  return (window as any).echarts || null
}

function handleResize() {
  radarChart?.resize()
  trendChart?.resize()
}

onMounted(() => {
  fetchProfile()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
  trendChart?.dispose()
})

useSeoMeta({
  title: '教师画像 - 教育云平台',
  description: '教师画像详情'
})
</script>

<style scoped>
.teacher-profile-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}

.back-bar {
  margin-bottom: 12px;
}

.profile-header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  border: 3px solid var(--primary-color-light-9);
  flex-shrink: 0;
}

.header-info {
  flex: 1;
}

.teacher-name {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.teacher-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.stat-date {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.composite-score {
  text-align: center;
}

.score-value {
  display: block;
  font-size: 36px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
}

.score-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.composite-label {
  font-size: 14px;
  font-weight: 600;
}

.chart-card,
.dimension-card {
  margin-bottom: 20px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.chart-container {
  width: 100%;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dimension-item {
  background: var(--bg-color-page, #fafafa);
  border-radius: 8px;
  padding: 16px;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dim-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.dim-weight {
  font-size: 13px;
  color: var(--text-secondary);
}

.dim-score-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dim-progress {
  flex: 1;
}

.dim-score {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  min-width: 50px;
  text-align: right;
}

.dim-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 8px 0 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
  }

  .header-left {
    flex-direction: column;
    text-align: center;
  }
}
</style>
