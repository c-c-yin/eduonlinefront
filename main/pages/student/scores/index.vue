<template>
  <div class="scores-page">
    <ErrorBoundary>
      <div class="container">
        <!-- 页面标题 -->
        <div class="page-header">
          <h1 class="page-title">我的成绩</h1>
          <p class="page-desc">{{ userStore.realName || userStore.userName }}同学的成绩记录与分析</p>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
          <div class="panel">
            <h3 class="panel-title">成绩趋势</h3>
            <div v-if="list.length > 0">
              <BaseChart :option="trendChartOption" height="300px" />
            </div>
            <el-empty v-else description="暂无成绩数据" :image-size="60" />
          </div>

          <div class="panel">
            <h3 class="panel-title">成绩来源</h3>
            <div v-if="list.length > 0">
              <BaseChart :option="sourcePieOption" height="300px" />
            </div>
            <el-empty v-else description="暂无成绩数据" :image-size="60" />
          </div>
        </div>

        <!-- 成绩列表 -->
        <div class="panel">
          <h3 class="panel-title">成绩明细</h3>
          <el-table
            v-loading="loading"
            :data="list"
            stripe
            style="width: 100%"
            empty-text="暂无成绩记录"
          >
            <el-table-column prop="homeworkName" label="作业名称" min-width="180" show-overflow-tooltip />
            <el-table-column prop="subjectName" label="学科" width="100">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ row.subjectName || '-' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="得分" width="120" align="center">
              <template #default="{ row }">
                <span class="score-text">{{ row.score }}</span>
                <span class="score-total-text"> / {{ row.totalScore }}</span>
              </template>
            </el-table-column>
            <el-table-column label="得分率" width="120" align="center">
              <template #default="{ row }">
                <span class="rate-tag" :style="{ color: rateColor(rateOf(row)) }">
                  {{ rateOf(row) }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column label="来源" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="sourceTagType(row.sourceType)">
                  {{ sourceLabel(row.sourceType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="submitTime" label="提交时间" width="170">
              <template #default="{ row }">
                {{ formatTime(row.submitTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" align="center" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" plain @click="goKnowledge(row.scoreId)">
                  知识点分析
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrap" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="fetchList"
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import BaseChart from '@/components/common/BaseChart.vue'
import { useHomeworkApi } from '@/composables/useHomeworkApi'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const userStore = useUserStore()
const router = useRouter()
const { getStudentScores } = useHomeworkApi()

const loading = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const SOURCE_LABELS: Record<number, string> = {
  1: '教师录入',
  2: 'Excel导入',
  3: '学生自评',
  4: '管理人员录入'
}

const SOURCE_COLORS: Record<number, string> = {
  1: '#4facfe',
  2: '#667eea',
  3: '#43e97b',
  4: '#f093fb'
}

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

function rateOf(row: any): number {
  if (!row || !row.totalScore) return 0
  return Math.round((row.score / row.totalScore) * 1000) / 10
}

function rateColor(rate: number): string {
  if (rate >= 80) return '#43e97b'
  if (rate >= 60) return '#4facfe'
  if (rate >= 40) return '#f0ad4e'
  return '#f56c6c'
}

function formatTime(time: string): string {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 16)
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getStudentScores({
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    list.value = res.rows || []
    total.value = res.total || 0
  } catch (e) {
    console.error(e)
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function goKnowledge(scoreId: number) {
  router.push(`/student/scores/${scoreId}`)
}

// 成绩趋势折线图
const trendChartOption = computed<EChartsOption>(() => {
  const sorted = [...list.value].sort((a, b) => {
    return new Date(a.submitTime).getTime() - new Date(b.submitTime).getTime()
  })
  const xData = sorted.map(item => formatTime(item.submitTime))
  const yData = sorted.map(item => rateOf(item))
  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0]
        const idx = p.dataIndex
        const item = sorted[idx]
        return `${p.axisValue}<br/>${item?.homeworkName || ''}<br/>得分率：${p.value}%`
      }
    },
    grid: { left: 40, right: 20, bottom: 40, top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: '#666', fontSize: 11, rotate: xData.length > 5 ? 30 : 0 },
      axisLine: { lineStyle: { color: '#e0e0e0' } }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { color: '#666', formatter: '{value}%' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      name: '得分率',
      type: 'line',
      data: yData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#4facfe', width: 3 },
      itemStyle: { color: '#4facfe' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(79, 172, 254, 0.35)' },
            { offset: 1, color: 'rgba(79, 172, 254, 0.02)' }
          ]
        }
      },
      markLine: {
        silent: true,
        data: [
          { yAxis: 60, lineStyle: { color: '#f0ad4e', type: 'dashed' }, label: { formatter: '及格线', color: '#f0ad4e' } }
        ]
      }
    }]
  }
})

// 成绩来源饼图
const sourcePieOption = computed<EChartsOption>(() => {
  const countMap: Record<number, number> = {}
  list.value.forEach(item => {
    const t = item.sourceType || 0
    countMap[t] = (countMap[t] || 0) + 1
  })
  const pieData = Object.keys(countMap).map(k => {
    const type = Number(k)
    return {
      name: sourceLabel(type),
      value: countMap[type],
      itemStyle: { color: SOURCE_COLORS[type] || '#c0c4cc' }
    }
  })
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)' },
    legend: { bottom: 0, icon: 'circle', textStyle: { color: '#666', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: pieData,
      label: { show: true, formatter: '{b}\n{c}次', fontSize: 12 },
      emphasis: { label: { fontSize: 14, fontWeight: 'bold' } }
    }]
  }
})

onMounted(() => {
  fetchList()
})

useSeoMeta({
  title: '我的成绩 - 教育云平台'
})
</script>

<style scoped>
.scores-page {
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
  font-weight: 700;
  color: #303133;
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.score-text {
  font-size: 18px;
  font-weight: 700;
  color: #303133;
}

.score-total-text {
  font-size: 13px;
  color: #909399;
}

.rate-tag {
  font-size: 15px;
  font-weight: 600;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

@media (max-width: 900px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
