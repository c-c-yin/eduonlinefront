<template>
  <div class="student-profile-page">
    <ErrorBoundary>
      <div class="container" v-loading="loading">
        <!-- 加载骨架 -->
        <div v-if="loading" class="skeleton-wrap">
          <el-skeleton :rows="8" animated />
        </div>

        <template v-else-if="profile">
          <!-- 1. 顶部综合信息卡片 -->
          <div class="summary-card">
            <div class="summary-left">
              <div class="composite-score">
                <span class="score-value">{{ formatScore(profile.compositeScore) }}</span>
                <span class="score-unit">综合评分</span>
              </div>
              <div
                class="composite-label"
                :style="{ background: profile.labelColor || '#409EFF' }"
              >
                {{ profile.compositeLabel || '暂无标签' }}
              </div>
            </div>
            <div class="summary-right">
              <div class="summary-item">
                <span class="item-label">学生</span>
                <span class="item-value">{{ userStore.realName || userStore.userName || profile.studentName || '--' }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">趋势</span>
                <span class="item-value trend-value" :class="trendClass">
                  <el-icon :size="16">
                    <CaretTop v-if="profile.scoreTrend === 'up'" />
                    <CaretBottom v-else-if="profile.scoreTrend === 'down'" />
                    <Sort v-else-if="profile.scoreTrend === 'volatile'" />
                    <Minus v-else />
                  </el-icon>
                  {{ trendText }}
                </span>
              </div>
              <div class="summary-item">
                <span class="item-label">学校</span>
                <span class="item-value">{{ profile.orgName || '--' }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">班级</span>
                <span class="item-value">{{ profile.className || '--' }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">统计日期</span>
                <span class="item-value">{{ profile.statDate || '--' }}</span>
              </div>
            </div>
          </div>

          <!-- 2. 五维能力雷达图 -->
          <div class="panel">
            <h3 class="panel-title">五维能力雷达</h3>
            <BaseChart :option="radarOption" height="360px" />
          </div>

          <!-- 3. 学习投入明细面板 -->
          <div class="panel">
            <h3 class="panel-title">学习投入明细</h3>
            <div class="metrics-grid">
              <div class="metric-item">
                <span class="metric-label">累计观看时长</span>
                <span class="metric-value">{{ formatHours(profile.totalWatchSeconds) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">日均观看时长(近30天)</span>
                <span class="metric-value">{{ formatMinutes(profile.avgDailyWatchSeconds30) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">完播视频</span>
                <span class="metric-value">{{ profile.completedVideoCount ?? 0 }} / {{ profile.totalVideoCount ?? 0 }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">完播率</span>
                <span class="metric-value">{{ formatPercent(profile.completionRate) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">近30天活跃天数</span>
                <span class="metric-value">{{ profile.activeDays30 ?? 0 }} 天</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">近7天活跃天数</span>
                <span class="metric-value">{{ profile.activeDays7 ?? 0 }} 天</span>
              </div>
              <div class="metric-item highlight">
                <span class="metric-label">投入度得分</span>
                <span class="metric-value">{{ formatScore(profile.engagementScore) }}</span>
              </div>
            </div>
          </div>

          <!-- 4. 知识掌握明细面板 -->
          <div class="content-grid">
            <div class="panel">
              <h3 class="panel-title">知识掌握明细</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">平均掌握度</span>
                  <span class="metric-value">{{ formatScore(profile.avgMasteryScore) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">优势知识点</span>
                  <span class="metric-value success">{{ profile.strongKnowledgeCount ?? 0 }} 个</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">薄弱知识点</span>
                  <span class="metric-value danger">{{ profile.weakKnowledgeCount ?? 0 }} 个</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">总知识点</span>
                  <span class="metric-value">{{ profile.totalKnowledgeCount ?? 0 }} 个</span>
                </div>
                <div class="metric-item highlight">
                  <span class="metric-label">掌握度得分</span>
                  <span class="metric-value">{{ formatScore(profile.masteryScore) }}</span>
                </div>
              </div>
              <div v-if="masteryLevelList.length" class="sub-section">
                <h4 class="sub-title">掌握等级分布</h4>
                <BaseChart :option="masteryDistOption" height="260px" />
              </div>
              <el-empty v-else description="暂无掌握等级分布数据" :image-size="60" />
            </div>

            <!-- 5. 答题能力明细面板 -->
            <div class="panel">
              <h3 class="panel-title">答题能力明细</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">总答题数</span>
                  <span class="metric-value">{{ profile.totalAnswerCount ?? 0 }} 道</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">平均正确率</span>
                  <span class="metric-value">{{ formatPercent(profile.avgCorrectRate) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">难度耐受</span>
                  <span class="metric-value">{{ formatScore(profile.difficultyTolerance) }}</span>
                </div>
                <div class="metric-item highlight">
                  <span class="metric-label">答题能力得分</span>
                  <span class="metric-value">{{ formatScore(profile.answerScore) }}</span>
                </div>
              </div>
              <div v-if="questionTypeList.length" class="sub-section">
                <h4 class="sub-title">题型能力</h4>
                <BaseChart :option="questionTypeOption" height="240px" />
              </div>
              <div v-if="difficultyRateList.length" class="sub-section">
                <h4 class="sub-title">分难度正确率</h4>
                <BaseChart :option="difficultyRateOption" height="240px" />
              </div>
              <el-empty
                v-if="!questionTypeList.length && !difficultyRateList.length"
                description="暂无题型与难度数据"
                :image-size="60"
              />
            </div>
          </div>

          <!-- 6. 学习习惯明细面板 -->
          <div class="content-grid">
            <div class="panel">
              <h3 class="panel-title">学习习惯明细</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">偏好学习时段</span>
                  <span class="metric-value">{{ timeSlotText }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">平均单次学习时长</span>
                  <span class="metric-value">{{ formatMinutes(profile.avgSessionDurationSeconds) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">最长连续学习天数</span>
                  <span class="metric-value">{{ profile.maxConsecutiveDays ?? 0 }} 天</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">收藏视频数</span>
                  <span class="metric-value">{{ profile.collectCount ?? 0 }} 个</span>
                </div>
                <div class="metric-item highlight">
                  <span class="metric-label">学习习惯得分</span>
                  <span class="metric-value">{{ formatScore(profile.habitScore) }}</span>
                </div>
              </div>
              <div v-if="collectCategoryList.length" class="sub-section">
                <h4 class="sub-title">收藏分类分布</h4>
                <BaseChart :option="collectCategoryOption" height="260px" />
              </div>
              <el-empty v-else description="暂无收藏分类数据" :image-size="60" />
            </div>

            <!-- 7. 进步趋势面板 -->
            <div class="panel">
              <h3 class="panel-title">进步趋势</h3>
              <div class="metrics-grid">
                <div class="metric-item">
                  <span class="metric-label">本周平均得分</span>
                  <span class="metric-value">{{ formatScore(profile.currentWeekAvgScore) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">上周平均得分</span>
                  <span class="metric-value">{{ formatScore(profile.lastWeekAvgScore) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">本周平均正确率</span>
                  <span class="metric-value">{{ formatPercent(profile.currentWeekAvgRate) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">上周平均正确率</span>
                  <span class="metric-value">{{ formatPercent(profile.lastWeekAvgRate) }}</span>
                </div>
                <div class="metric-item highlight">
                  <span class="metric-label">趋势得分</span>
                  <span class="metric-value">{{ formatScore(profile.trendScore) }}</span>
                </div>
              </div>
              <div class="sub-section">
                <h4 class="sub-title">本周 vs 上周对比</h4>
                <BaseChart :option="trendCompareOption" height="240px" />
              </div>
            </div>
          </div>

          <!-- 8. 推荐响应面板 -->
          <div class="panel">
            <h3 class="panel-title">推荐响应</h3>
            <div class="metrics-grid metrics-grid-4">
              <div class="metric-item">
                <span class="metric-label">收到推荐数</span>
                <span class="metric-value">{{ profile.recommendReceivedCount ?? 0 }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">查看推荐数</span>
                <span class="metric-value">{{ profile.recommendViewedCount ?? 0 }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">完成推荐数</span>
                <span class="metric-value">{{ profile.recommendCompletedCount ?? 0 }}</span>
              </div>
              <div class="metric-item highlight">
                <span class="metric-label">推荐响应率</span>
                <span class="metric-value">{{ formatPercent(profile.recommendResponseRate) }}</span>
              </div>
            </div>
          </div>
        </template>

        <el-empty v-else description="暂无画像数据，完成学习后生成" :image-size="120" />
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { CaretTop, CaretBottom, Minus, Sort } from '@element-plus/icons-vue'
import { useProfileApi, type StudentProfile } from '@/composables/useProfileApi'
import type { EChartsOption } from 'echarts'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import BaseChart from '@/components/common/BaseChart.vue'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const userStore = useUserStore()
const { getMyProfile } = useProfileApi()

const profile = ref<StudentProfile | null>(null)
const loading = ref(true)

const trendMap: Record<string, string> = {
  up: '上升',
  down: '下降',
  stable: '稳定',
  volatile: '波动'
}

const timeSlotMap: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚间',
  night: '深夜',
  mixed: '混合'
}

const trendText = computed(() => {
  return trendMap[profile.value?.scoreTrend || ''] || '--'
})

const trendClass = computed(() => {
  const t = profile.value?.scoreTrend
  if (t === 'up') return 'trend-up'
  if (t === 'down') return 'trend-down'
  if (t === 'volatile') return 'trend-volatile'
  return 'trend-stable'
})

const timeSlotText = computed(() => {
  return timeSlotMap[profile.value?.preferredTimeSlot || ''] || '--'
})

// 解析 JSON 字段
function safeParse<T>(str: string | undefined | null, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

// 掌握等级分布：兼容 {level: count} 或 [{level, count}]
const masteryLevelList = computed<{ name: string; value: number }[]>(() => {
  const raw = safeParse<Record<string, number> | { name: string; value: number }[]>(
    profile.value?.masteryLevelDist,
    {}
  )
  if (Array.isArray(raw)) {
    return raw.map(item => ({ name: item.name || '未知', value: Number(item.value) || 0 }))
  }
  return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) || 0 }))
})

// 题型能力：兼容 {type: rate} 或 [{type, rate}]
const questionTypeList = computed<{ name: string; value: number }[]>(() => {
  const raw = safeParse<Record<string, number> | { type: string; rate: number }[]>(
    profile.value?.questionTypeAbility,
    {}
  )
  if (Array.isArray(raw)) {
    return raw.map(item => ({ name: item.type || '未知', value: Number(item.rate) || 0 }))
  }
  return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) || 0 }))
})

// 分难度正确率：兼容 {difficulty: rate} 或 [{difficulty, rate}]
const difficultyRateList = computed<{ name: string; value: number }[]>(() => {
  const raw = safeParse<Record<string, number> | { difficulty: string; rate: number }[]>(
    profile.value?.difficultyCorrectRates,
    {}
  )
  if (Array.isArray(raw)) {
    return raw.map(item => ({ name: item.difficulty || '未知', value: Number(item.rate) || 0 }))
  }
  return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) || 0 }))
})

// 收藏分类分布：兼容 {category: count} 或 [{category, count}]
const collectCategoryList = computed<{ name: string; value: number }[]>(() => {
  const raw = safeParse<Record<string, number> | { category: string; count: number }[]>(
    profile.value?.collectCategoryDist,
    {}
  )
  if (Array.isArray(raw)) {
    return raw.map(item => ({ name: item.category || '未知', value: Number(item.count) || 0 }))
  }
  return Object.entries(raw).map(([name, value]) => ({ name, value: Number(value) || 0 }))
})

// 格式化函数
function formatScore(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '--'
  return val.toFixed(1)
}

function formatPercent(val: number | undefined | null): string {
  if (val == null || isNaN(val)) return '--'
  return val.toFixed(1) + '%'
}

function formatHours(seconds: number | undefined | null): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '0 小时'
  return (seconds / 3600).toFixed(1) + ' 小时'
}

function formatMinutes(seconds: number | undefined | null): string {
  if (seconds == null || isNaN(seconds) || seconds <= 0) return '0 分钟'
  return (seconds / 60).toFixed(1) + ' 分钟'
}

// 五维能力雷达图
const radarOption = computed<EChartsOption>(() => {
  const p = profile.value
  return {
    tooltip: {},
    radar: {
      indicator: [
        { name: '学习投入度', max: 100 },
        { name: '知识掌握度', max: 100 },
        { name: '答题能力', max: 100 },
        { name: '学习习惯', max: 100 },
        { name: '进步趋势', max: 100 }
      ],
      center: ['50%', '55%'],
      radius: '65%',
      axisName: { color: '#666', fontSize: 13 }
    },
    series: [{
      type: 'radar',
      data: [{
        value: [
          p?.engagementScore ?? 0,
          p?.masteryScore ?? 0,
          p?.answerScore ?? 0,
          p?.habitScore ?? 0,
          p?.trendScore ?? 0
        ],
        name: '能力雷达',
        areaStyle: { color: 'rgba(102, 126, 234, 0.25)' },
        lineStyle: { color: '#667eea', width: 2 },
        itemStyle: { color: '#667eea' },
        symbol: 'circle',
        symbolSize: 6
      }]
    }]
  }
})

// 掌握等级分布饼图
const masteryDistColors = ['#43e97b', '#4facfe', '#f0ad4e', '#f56c6c', '#909399']
const masteryDistOption = computed<EChartsOption>(() => {
  const list = masteryLevelList.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}个 ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: list.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: masteryDistColors[i % masteryDistColors.length] }
      })),
      label: { show: true, formatter: '{b}\n{c}个', fontSize: 12 }
    }]
  }
})

// 题型能力柱状图
const questionTypeOption = computed<EChartsOption>(() => {
  const list = questionTypeList.value
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: 20, right: 20, bottom: 10, top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(d => d.name),
      axisLabel: { fontSize: 12, color: '#666' }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      type: 'bar',
      data: list.map(d => ({
        value: d.value,
        itemStyle: {
          color: d.value >= 80 ? '#43e97b' : d.value >= 60 ? '#4facfe' : d.value >= 40 ? '#f0ad4e' : '#f56c6c',
          borderRadius: [4, 4, 0, 0]
        }
      })),
      barWidth: 24,
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 11 }
    }]
  }
})

// 分难度正确率柱状图
const difficultyRateOption = computed<EChartsOption>(() => {
  const list = difficultyRateList.value
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: 20, right: 20, bottom: 10, top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: list.map(d => d.name),
      axisLabel: { fontSize: 12, color: '#666' }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series: [{
      type: 'bar',
      data: list.map(d => ({
        value: d.value,
        itemStyle: {
          color: d.value >= 80 ? '#43e97b' : d.value >= 60 ? '#4facfe' : d.value >= 40 ? '#f0ad4e' : '#f56c6c',
          borderRadius: [4, 4, 0, 0]
        }
      })),
      barWidth: 28,
      label: { show: true, position: 'top', formatter: '{c}%', fontSize: 11 }
    }]
  }
})

// 收藏分类分布饼图
const collectCategoryColors = ['#667eea', '#43e97b', '#4facfe', '#f093fb', '#f0ad4e', '#f56c6c', '#909399']
const collectCategoryOption = computed<EChartsOption>(() => {
  const list = collectCategoryList.value
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}个 ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['50%', '45%'],
      data: list.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: collectCategoryColors[i % collectCategoryColors.length] }
      })),
      label: { show: true, formatter: '{b}\n{c}个', fontSize: 12 }
    }]
  }
})

// 本周 vs 上周对比柱状图
const trendCompareOption = computed<EChartsOption>(() => {
  const p = profile.value
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0 },
    grid: { left: 20, right: 20, bottom: 30, top: 20, containLabel: true },
    xAxis: {
      type: 'category',
      data: ['平均得分', '平均正确率(%)']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '本周',
        type: 'bar',
        data: [
          { value: p?.currentWeekAvgScore ?? 0, itemStyle: { color: '#43e97b', borderRadius: [4, 4, 0, 0] } },
          { value: p?.currentWeekAvgRate ?? 0, itemStyle: { color: '#43e97b', borderRadius: [4, 4, 0, 0] } }
        ],
        barWidth: 28,
        label: { show: true, position: 'top', fontSize: 11 }
      },
      {
        name: '上周',
        type: 'bar',
        data: [
          { value: p?.lastWeekAvgScore ?? 0, itemStyle: { color: '#c0c4cc', borderRadius: [4, 4, 0, 0] } },
          { value: p?.lastWeekAvgRate ?? 0, itemStyle: { color: '#c0c4cc', borderRadius: [4, 4, 0, 0] } }
        ],
        barWidth: 28,
        label: { show: true, position: 'top', fontSize: 11 }
      }
    ]
  }
})

onMounted(async () => {
  try {
    profile.value = await getMyProfile()
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
})

useSeoMeta({
  title: '学生画像 - 教育云平台'
})
</script>

<style scoped>
.student-profile-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0 0;
}

.skeleton-wrap {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

/* 顶部综合信息卡片 */
.summary-card {
  display: flex;
  align-items: center;
  gap: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.25);
}

.summary-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-right: 32px;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.composite-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.score-unit {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 6px;
}

.composite-label {
  padding: 4px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.summary-right {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  flex: 1;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.summary-item .item-label {
  font-size: 12px;
  opacity: 0.8;
}

.summary-item .item-value {
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-value.trend-up { color: #95f985; }
.trend-value.trend-down { color: #ffb3b3; }
.trend-value.trend-volatile { color: #ffd66b; }
.trend-value.trend-stable { color: #ffffff; }

/* 面板 */
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

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.content-grid .panel {
  margin-bottom: 0;
}

/* 指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.metrics-grid-4 {
  grid-template-columns: repeat(4, 1fr);
}

.metric-item {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-item.highlight {
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border: 1px solid #d6e4ff;
}

.metric-label {
  font-size: 12px;
  color: #999;
}

.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.metric-value.success { color: #67C23A; }
.metric-value.danger { color: #F56C6C; }

/* 子区块 */
.sub-section {
  margin-top: 20px;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #555;
  margin: 0 0 12px;
}

@media (max-width: 900px) {
  .summary-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .summary-left {
    padding-right: 0;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 16px;
    flex-direction: row;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .metrics-grid,
  .metrics-grid-4 {
    grid-template-columns: 1fr;
  }

  .summary-right {
    gap: 20px;
  }
}
</style>
