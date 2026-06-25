<template>
  <div class="student-knowledge-page">
    <ErrorBoundary>
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">我的学习报告</h1>
          <p class="page-desc">了解自己的知识点掌握情况，针对性提升薄弱环节</p>
        </div>

        <div class="filter-bar">
          <el-select v-model="selectedSubject" placeholder="选择学科" style="width: 160px" @change="fetchReport">
            <el-option label="数学" :value="2" />
            <el-option label="语文" :value="1" />
            <el-option label="英语" :value="3" />
            <el-option label="物理" :value="4" />
            <el-option label="化学" :value="5" />
          </el-select>
        </div>

        <div v-loading="loading" class="report-content">
          <div v-if="report" class="report-grid">
            <!-- 知识点掌握雷达图 -->
            <div class="panel">
              <h3 class="panel-title">知识点掌握</h3>
              <div v-if="report.knowledgeRadar.length > 0">
                <BaseChart :option="radarChartOption" height="340px" />
              </div>
              <el-empty v-else description="暂无数据，完成练习后生成" :image-size="60" />
            </div>

            <!-- 优势 + 薄弱 -->
            <div class="side-panels">
              <div class="panel">
                <h3 class="panel-title success-title">优势知识点</h3>
                <div v-if="report.strongKnowledge.length > 0" class="tag-list">
                  <el-tag
                    v-for="k in report.strongKnowledge"
                    :key="k.knowledgeId"
                    type="success"
                    size="large"
                    effect="plain"
                  >
                    {{ k.knowledgeName }} ({{ k.masteryRate }}%)
                  </el-tag>
                </div>
                <el-empty v-else description="暂无数据" :image-size="40" />
              </div>

              <div class="panel">
                <h3 class="panel-title danger-title">薄弱知识点</h3>
                <div v-if="report.weakKnowledge.length > 0" class="weak-list">
                  <div v-for="w in report.weakKnowledge" :key="w.knowledgeId" class="weak-item">
                    <div class="weak-info">
                      <el-icon :size="16" color="#f56c6c"><Warning /></el-icon>
                      <span class="weak-name">{{ w.knowledgeName }}</span>
                      <span class="weak-rate">掌握率 {{ w.masteryRate }}%</span>
                    </div>
                    <div class="weak-actions">
                      <el-button size="small" type="primary" plain @click="goPractice">去练习</el-button>
                      <el-button
                        size="small"
                        type="success"
                        plain
                        :loading="!!recommendLoading[w.knowledgeId]"
                        @click="toggleRecommend(w.knowledgeId)"
                      >看视频</el-button>
                    </div>
                    <el-collapse-transition>
                      <div v-show="!!expandedMap[w.knowledgeId]" class="recommend-area">
                        <div v-if="recommendLoading[w.knowledgeId]" class="recommend-loading">
                          <el-icon class="is-loading"><Loading /></el-icon>
                          <span>加载推荐中...</span>
                        </div>
                        <template v-else-if="recommendMap[w.knowledgeId] && recommendMap[w.knowledgeId].length > 0">
                          <div
                            v-for="rec in recommendMap[w.knowledgeId]"
                            :key="rec.recommendId"
                            class="recommend-item"
                            @click="goVideoDetail(rec.targetId)"
                          >
                            <div class="recommend-name">
                              <el-icon :size="14"><VideoPlay /></el-icon>
                              <span>{{ rec.targetName }}</span>
                            </div>
                            <div class="recommend-reason">{{ rec.recommendReason }}</div>
                          </div>
                        </template>
                        <el-empty v-else description="暂无推荐视频" :image-size="40" />
                      </div>
                    </el-collapse-transition>
                  </div>
                </div>
                <el-empty v-else description="暂无薄弱知识点，继续保持！" :image-size="40" />
              </div>
            </div>
          </div>

          <!-- 趋势图 + 分布图 -->
          <div v-if="report" class="report-grid">
            <div v-if="report.trendData && report.trendData.length > 0" class="panel">
              <h3 class="panel-title">进步趋势（近4周）</h3>
              <BaseChart :option="trendChartOption" height="280px" />
            </div>

            <div v-if="report.knowledgeRadar.length > 0" class="panel">
              <h3 class="panel-title">掌握分布</h3>
              <BaseChart :option="pieChartOption" height="280px" />
            </div>
          </div>

          <div v-if="!report && !loading" class="empty-state">
            <el-empty description="请选择学科查看学习报告" />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { Warning, VideoPlay, Loading } from '@element-plus/icons-vue'
import { useKnowledgeApi, type StudentKnowledgeReport } from '@/composables/useKnowledgeApi'
import { useQuestionApi } from '@/composables/useQuestionApi'
import type { RecommendRecord } from '@/types'
import type { EChartsOption } from 'echarts'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import BaseChart from '@/components/common/BaseChart.vue'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const router = useRouter()
const { getMyKnowledgeReport } = useKnowledgeApi()
const { getRecommendList } = useQuestionApi()

const selectedSubject = ref<number | undefined>(2)
const report = ref<StudentKnowledgeReport | null>(null)
const loading = ref(false)

// 薄弱知识点推荐视频：每个知识点的展开状态、推荐数据、加载状态
const expandedMap = ref<Record<number, boolean>>({})
const recommendMap = ref<Record<number, RecommendRecord[]>>({})
const recommendLoading = ref<Record<number, boolean>>({})

async function fetchReport() {
  loading.value = true
  try {
    const params = selectedSubject.value ? { subjectId: selectedSubject.value } : undefined
    report.value = await getMyKnowledgeReport(params)
  } catch {
    report.value = null
  } finally {
    loading.value = false
  }
}

// 雷达图
const radarChartOption = computed<EChartsOption>(() => {
  const knowledge = report.value?.knowledgeRadar || []
  return {
    tooltip: {},
    radar: {
      indicator: knowledge.map(k => ({ name: k.knowledgeName, max: 100 })),
      center: ['50%', '55%'],
      radius: '65%',
      axisName: { color: '#666', fontSize: 12 }
    },
    series: [{
      type: 'radar',
      data: [{
        value: knowledge.map(k => k.masteryRate),
        name: '掌握率',
        areaStyle: { color: 'rgba(67, 233, 123, 0.25)' },
        lineStyle: { color: '#43e97b', width: 2 },
        itemStyle: { color: '#43e97b' },
        symbol: 'circle',
        symbolSize: 6
      }]
    }]
  }
})

// 趋势折线图
const trendChartOption = computed<EChartsOption>(() => {
  const trend = report.value?.trendData || []
  return {
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, bottom: 30, top: 20 },
    xAxis: {
      type: 'category',
      data: trend.map(t => t.date),
      axisLabel: { fontSize: 11, color: '#999' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    series: [{
      type: 'line',
      data: trend.map(t => t.avgRate),
      smooth: true,
      lineStyle: { color: '#43e97b', width: 2 },
      itemStyle: { color: '#43e97b' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(67, 233, 123, 0.3)' },
            { offset: 1, color: 'rgba(67, 233, 123, 0.02)' }
          ]
        }
      },
      symbol: 'circle',
      symbolSize: 8
    }]
  }
})

// 饼图
const pieChartOption = computed<EChartsOption>(() => {
  const knowledge = report.value?.knowledgeRadar || []
  const levels = [
    { name: '精通(80%+)', min: 80, color: '#43e97b' },
    { name: '掌握(60-80%)', min: 60, color: '#4facfe' },
    { name: '理解(40-60%)', min: 40, color: '#f0ad4e' },
    { name: '薄弱(<40%)', min: 0, color: '#f56c6c' }
  ]
  const pieData = levels.map((l, i) => ({
    name: l.name,
    value: knowledge.filter(k => k.masteryRate >= l.min && (i === 0 || k.masteryRate < levels[i - 1].min)).length,
    itemStyle: { color: l.color }
  })).filter(d => d.value > 0)

  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}个 ({d}%)' },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '50%'],
      data: pieData,
      label: { show: true, formatter: '{b}\n{c}个' },
      emphasis: { label: { fontSize: 16, fontWeight: 'bold' } }
    }]
  }
})

function goPractice() {
  router.push('/questions')
}

// 展开/收起薄弱知识点的推荐视频，首次展开时拉取推荐数据
async function toggleRecommend(knowledgeId: number) {
  expandedMap.value[knowledgeId] = !expandedMap.value[knowledgeId]
  if (expandedMap.value[knowledgeId] && !recommendMap.value[knowledgeId]) {
    recommendLoading.value[knowledgeId] = true
    try {
      const res = await getRecommendList({ knowledgeId, pageNum: 1, pageSize: 3 })
      recommendMap.value[knowledgeId] = res?.rows || []
    } catch {
      recommendMap.value[knowledgeId] = []
    } finally {
      recommendLoading.value[knowledgeId] = false
    }
  }
}

function goVideoDetail(videoId: number) {
  router.push(`/videos/${videoId}`)
}

onMounted(() => {
  fetchReport()
})

useSeoMeta({
  title: '我的学习报告 - 教育云平台'
})
</script>

<style scoped>
.student-knowledge-page {
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
  margin-bottom: 24px;
}

.report-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
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
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title.success-title {
  color: #43e97b;
}

.panel-title.danger-title {
  color: #f56c6c;
}

.side-panels {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.weak-item {
  padding: 12px;
  border-radius: 8px;
  background: #fef0f0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.weak-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weak-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.weak-rate {
  font-size: 12px;
  color: #f56c6c;
  margin-left: auto;
}

.weak-actions {
  display: flex;
  gap: 8px;
}

.recommend-area {
  margin-top: 4px;
  padding: 12px;
  background: #f5fbf6;
  border-radius: 8px;
  border: 1px solid #e8f5e9;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recommend-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  color: #67c23a;
  font-size: 13px;
  padding: 8px 0;
}

.recommend-item {
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.recommend-item:hover {
  border-color: #43e97b;
  box-shadow: 0 2px 8px rgba(67, 233, 123, 0.15);
}

.recommend-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.recommend-name .el-icon {
  color: #43e97b;
}

.recommend-reason {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.empty-state {
  padding: 80px 0;
}

@media (max-width: 768px) {
  .report-grid {
    grid-template-columns: 1fr;
  }
}
</style>