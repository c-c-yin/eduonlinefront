<template>
  <div class="student-dashboard-page">
    <ErrorBoundary>
      <div class="container">
        <!-- 加载骨架 -->
        <SkeletonDashboard v-if="loading" />

        <template v-else>
          <!-- 欢迎横幅 -->
          <div class="welcome-banner">
            <div class="welcome-text">
              <h1>{{ userStore.realName || userStore.userName }}同学，加油！</h1>
              <p>{{ currentDate }}</p>
            </div>
          </div>

          <!-- 学习概览统计 -->
          <div class="stats-grid">
            <div class="stat-card" style="--card-color: #667eea">
              <div class="stat-icon"><el-icon :size="28"><Timer /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.studyHoursThisWeek ?? '-' }}</div>
                <div class="stat-label">本周学习(小时)</div>
              </div>
            </div>
            <div class="stat-card" style="--card-color: #43e97b">
              <div class="stat-icon"><el-icon :size="28"><Edit /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.completedQuestions ?? '-' }}</div>
                <div class="stat-label">完成试题</div>
              </div>
            </div>
            <div class="stat-card" style="--card-color: #4facfe">
              <div class="stat-icon"><el-icon :size="28"><Finished /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.correctRate ? data.correctRate + '%' : '-' }}</div>
                <div class="stat-label">正确率</div>
              </div>
            </div>
            <div class="stat-card" style="--card-color: #f093fb">
              <div class="stat-icon"><el-icon :size="28"><Star /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.masteredKnowledgeCount ?? '-' }}</div>
                <div class="stat-label">掌握知识点</div>
              </div>
            </div>
          </div>

          <!-- 继续学习 + 待完成作业 -->
          <div class="top-row">
            <div v-if="data?.lastStudy" class="continue-card" @click="navigateTo(`/videos/${data.lastStudy.videoId}`)">
              <div class="continue-left">
                <el-icon :size="32"><VideoPlay /></el-icon>
                <div class="continue-info">
                  <span class="continue-label">继续学习</span>
                  <span class="continue-name">{{ data.lastStudy.videoName }}</span>
                  <div class="continue-progress">
                    <div class="cp-bar"><div class="cp-fill" :style="{ width: data.lastStudy.progress + '%' }"></div></div>
                    <span>{{ data.lastStudy.progress }}%</span>
                  </div>
                </div>
              </div>
              <el-button type="primary" size="small" round>继续观看</el-button>
            </div>

            <div v-if="data?.pendingHomework && data.pendingHomework.length > 0" class="pending-card">
              <div class="pending-header">
                <el-icon :size="18"><Warning /></el-icon>
                <span>待完成作业</span>
              </div>
              <div class="pending-item" @click="navigateTo(`/student/homework/${data.pendingHomework[0].homeworkId}`)">
                <span class="pending-name">{{ data.pendingHomework[0].homeworkName }}</span>
                <span class="pending-subject">{{ data.pendingHomework[0].subjectName }}</span>
                <span class="pending-deadline">截止 {{ formatDeadline(data.pendingHomework[0].deadline) }}</span>
              </div>
              <el-button size="small" type="primary" round @click="navigateTo(`/student/homework/${data.pendingHomework[0].homeworkId}`)">
                立即完成
              </el-button>
            </div>
          </div>

          <!-- 学习画像：综合得分/待完成作业/错题提醒/推荐练习 -->
          <section v-if="profileData" class="profile-section">
            <StudentProfilePanel :data="profileData" />
          </section>

          <!-- 知识点掌握雷达图 + 薄弱知识点 -->
          <div class="content-grid">
            <div class="panel">
              <h3 class="panel-title">知识点掌握</h3>
              <div v-if="data?.knowledgeRadar && data.knowledgeRadar.length > 0">
                <BaseChart :option="radarChartOption" height="320px" />
              </div>
              <el-empty v-else description="暂无数据，完成练习后生成" :image-size="60" />
            </div>

            <div class="panel">
              <h3 class="panel-title">薄弱知识点</h3>
              <div v-if="data?.weakKnowledge && data.weakKnowledge.length > 0" class="weak-list">
                <div
                  v-for="w in data.weakKnowledge"
                  :key="w.knowledgeId"
                  class="weak-item"
                >
                  <div class="weak-info">
                    <el-icon :size="16" color="#f56c6c"><Warning /></el-icon>
                    <span class="weak-name">{{ w.knowledgeName }}</span>
                    <span class="weak-rate">掌握率 {{ w.masteryRate }}%</span>
                  </div>
                  <div class="weak-actions">
                    <el-button size="small" type="primary" plain @click="navigateTo('/questions')">去练习</el-button>
                    <el-button size="small" type="success" plain @click="navigateTo('/videos')">看视频</el-button>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无薄弱知识点，继续保持！" :image-size="60" />
            </div>
          </div>

          <!-- 知识掌握分布 -->
          <div class="content-grid" v-if="data?.knowledgeRadar && data.knowledgeRadar.length > 0">
            <div class="panel">
              <h3 class="panel-title">知识掌握分布</h3>
              <BaseChart :option="pieChartOption" height="300px" />
            </div>
            <div class="panel">
              <h3 class="panel-title">各知识点对比</h3>
              <BaseChart :option="barChartOption" height="300px" />
            </div>
          </div>

          <!-- 快捷入口 -->
          <div class="quick-actions">
            <h3 class="section-title">快捷入口</h3>
            <div class="action-grid">
              <div class="action-item" @click="navigateTo('/questions')">
                <el-icon :size="22"><Edit /></el-icon>
                <span>组题练习</span>
              </div>
              <div class="action-item" @click="navigateTo('/student/wrong')">
                <el-icon :size="22"><Warning /></el-icon>
                <span>我的错题</span>
              </div>
              <div class="action-item" @click="navigateTo('/student/collect')">
                <el-icon :size="22"><Star /></el-icon>
                <span>我的收藏</span>
              </div>
              <div class="action-item" @click="navigateTo('/profile')">
                <el-icon :size="22"><Clock /></el-icon>
                <span>学习记录</span>
              </div>
              <div class="action-item" @click="navigateTo('/student/mastery')">
                <el-icon :size="22"><TrendCharts /></el-icon>
                <span>知识点掌握</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { Timer, Edit, Finished, Star, VideoPlay, Warning, Clock, TrendCharts } from '@element-plus/icons-vue'
import { useDashboardApi, type StudentDashboardData } from '@/composables/useDashboardApi'
import { useHomeApi } from '@/composables/useHomeApi'
import type { EChartsOption } from 'echarts'
import type { StudentDashboard } from '@/types'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import SkeletonDashboard from '@/components/common/SkeletonDashboard.vue'
import BaseChart from '@/components/common/BaseChart.vue'
import StudentProfilePanel from '@/components/home/StudentProfilePanel.vue'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const userStore = useUserStore()
const router = useRouter()
const { getStudentDashboard } = useDashboardApi()
const { getDashboard } = useHomeApi()

const data = ref<StudentDashboardData | null>(null)
const profileData = ref<StudentDashboard | null>(null)
const loading = ref(true)

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

function navigateTo(path: string) {
  router.push(path)
}

function formatDeadline(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return '已逾期'
  if (days === 0) return '今天截止'
  if (days === 1) return '明天截止'
  return `${d.getMonth() + 1}月${d.getDate()}日 (剩${days}天)`
}

// 雷达图配置
const radarChartOption = computed<EChartsOption>(() => {
  const knowledge = data.value?.knowledgeRadar || []
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

// 饼图配置
const pieChartOption = computed<EChartsOption>(() => {
  const knowledge = data.value?.knowledgeRadar || []
  const levels = [
    { name: '精通(80%+)', min: 80, color: '#43e97b' },
    { name: '掌握(60-80%)', min: 60, color: '#4facfe' },
    { name: '理解(40-60%)', min: 40, color: '#f0ad4e' },
    { name: '薄弱(<40%)', min: 0, color: '#f56c6c' }
  ]
  const pieData = levels.map(l => ({
    name: l.name,
    value: knowledge.filter(k => k.masteryRate >= l.min && (l.min === 0 || k.masteryRate < (levels[levels.indexOf(l) - 1]?.min ?? 101))).length,
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

// 柱状图对比
const barChartOption = computed<EChartsOption>(() => {
  const knowledge = data.value?.knowledgeRadar || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 30, right: 20, bottom: 20, top: 10, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: knowledge.map(k => k.knowledgeName),
      axisLabel: { fontSize: 12, color: '#666' }
    },
    series: [{
      type: 'bar',
      data: knowledge.map(k => ({
        value: k.masteryRate,
        itemStyle: {
          color: k.masteryRate >= 80 ? '#43e97b' : k.masteryRate >= 60 ? '#4facfe' : k.masteryRate >= 40 ? '#f0ad4e' : '#f56c6c',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 22,
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 11 }
    }]
  }
})

onMounted(async () => {
  try {
    const [dashboardResult, profileResult] = await Promise.all([
      getStudentDashboard().catch(() => null),
      getDashboard().catch(() => null)
    ])
    data.value = dashboardResult
    profileData.value = profileResult?.student || null
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
})

useSeoMeta({
  title: '学习中心 - 教育云平台'
})
</script>

<style scoped>
.student-dashboard-page {
  background: var(--bg-page);
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 24px 20px 0;
}

.welcome-banner {
  background: linear-gradient(135deg, var(--primary-color) 0%, #14b8a6 100%);
  border-radius: var(--border-radius-lg);
  padding: 28px 36px;
  margin-bottom: 24px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 50%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1));
  pointer-events: none;
}

.welcome-banner h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
}

.welcome-banner p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 60px;
  height: 60px;
  background: var(--card-color);
  opacity: 0.06;
  border-radius: 0 16px 0 100%;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--card-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.continue-card,
.pending-card {
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-xs);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.continue-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.continue-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.continue-left {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #0ea5e9;
}

.continue-left > .el-icon {
  padding: 10px;
  background: rgba(14, 165, 233, 0.1);
  border-radius: 10px;
}

.continue-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.continue-label {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
}

.continue-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.continue-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-secondary);
}

.cp-bar {
  width: 80px;
  height: 4px;
  background: var(--bg-light);
  border-radius: 2px;
  overflow: hidden;
}

.cp-fill {
  height: 100%;
  background: linear-gradient(90deg, #0ea5e9 0%, var(--primary-color) 100%);
  border-radius: 2px;
}

.pending-card {
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.pending-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ef4444;
  font-weight: 600;
  font-size: 13px;
}

.pending-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  padding: 10px 14px;
  background: #fef2f2;
  border-radius: 10px;
  width: 100%;
  transition: all 0.2s ease;
}

.pending-item:hover {
  background: #fee2e2;
}

.pending-name {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
}

.pending-subject {
  font-size: 11px;
  color: var(--text-secondary);
}

.pending-deadline {
  font-size: 11px;
  color: #ef4444;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.panel {
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-xs);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-light);
}

.weak-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.weak-item {
  padding: 12px;
  border-radius: 10px;
  background: #fef2f2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s ease;
}

.weak-item:hover {
  transform: translateX(2px);
}

.weak-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weak-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.weak-rate {
  font-size: 11px;
  color: #ef4444;
  margin-left: auto;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  padding: 3px 8px;
  border-radius: 8px;
}

.weak-actions {
  display: flex;
  gap: 8px;
}

.profile-section {
  margin-bottom: 24px;
}

.quick-actions {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px;
}

.action-grid {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-regular);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-xs);
}

.action-item:hover {
  color: var(--primary-color);
  background: var(--primary-50);
  box-shadow: var(--shadow-sm);
}

.action-item .el-icon {
  padding: 6px;
  background: var(--bg-light);
  border-radius: 6px;
}

.action-item:hover .el-icon {
  background: rgba(34, 197, 94, 0.1);
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .top-row {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .welcome-banner {
    padding: 20px 24px;
  }

  .welcome-banner h1 {
    font-size: 18px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }

  .stat-value {
    font-size: 20px;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    flex-direction: column;
  }

  .action-item {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 16px 12px 0;
  }
}
</style>