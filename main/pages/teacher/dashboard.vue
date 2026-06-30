<template>
  <div class="teacher-dashboard-page">
    <div class="container">
      <div class="welcome-banner">
        <div class="welcome-text">
          <h1>{{ userStore.realName || userStore.userName }}老师，{{ greeting }}</h1>
          <p>{{ currentDate }}</p>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card" style="--card-color: var(--primary-color)">
          <div class="stat-icon"><el-icon :size="28"><VideoCamera /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ data?.videoCount ?? '-' }}</div>
            <div class="stat-label">我的视频</div>
          </div>
          <div v-if="data?.pendingAuditCount" class="stat-badge">待审{{ data.pendingAuditCount }}</div>
        </div>
        <div class="stat-card" style="--card-color: #0ea5e9">
          <div class="stat-icon"><el-icon :size="28"><Notebook /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ data?.homeworkCount ?? '-' }}</div>
            <div class="stat-label">发布作业</div>
          </div>
          <div v-if="data?.pendingScoreCount" class="stat-badge">待批{{ data.pendingScoreCount }}</div>
        </div>
        <div class="stat-card" style="--card-color: #f59e0b">
          <div class="stat-icon"><el-icon :size="28"><School /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ data?.classCount ?? '-' }}</div>
            <div class="stat-label">任教班级</div>
          </div>
        </div>
        <div class="stat-card" style="--card-color: #22c55e">
          <div class="stat-icon"><el-icon :size="28"><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ data?.studentCount ?? '-' }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <h3 class="section-title">快捷操作</h3>
        <div class="action-grid">
          <div class="action-item" @click="navigateTo('/teacher/videos')">
            <el-icon :size="22"><Upload /></el-icon>
            <span>我的视频</span>
          </div>
          <div class="action-item" @click="navigateTo('/teacher/questions')">
            <el-icon :size="22"><Edit /></el-icon>
            <span>我的试题</span>
          </div>
          <div class="action-item" @click="navigateTo('/teacher/papers')">
            <el-icon :size="22"><Document /></el-icon>
            <span>我的试卷</span>
          </div>
          <div class="action-item" @click="navigateTo('/teacher/homework/create')">
            <el-icon :size="22"><Notebook /></el-icon>
            <span>作业管理</span>
          </div>
          <div class="action-item" @click="navigateTo('/teacher/scores')">
            <el-icon :size="22"><Tickets /></el-icon>
            <span>录入成绩</span>
          </div>
          <div class="action-item" @click="navigateTo('/teacher/learning-overview')">
            <el-icon :size="22"><TrendCharts /></el-icon>
            <span>学情概览</span>
          </div>
        </div>
      </div>

      <div class="content-grid">
        <div class="panel">
          <h3 class="panel-title">待批改作业</h3>
          <div v-if="data?.pendingHomework && data.pendingHomework.length > 0" class="homework-list">
            <div
              v-for="h in data.pendingHomework"
              :key="h.homeworkId"
              class="homework-item"
              @click="navigateTo(`/teacher/homework/${h.homeworkId}`)"
            >
              <div class="homework-info">
                <span class="homework-name">{{ h.homeworkName }}</span>
                <span class="homework-class">{{ h.className }}</span>
              </div>
              <div class="homework-meta">
                <span class="homework-count">{{ h.unsubmittedCount }}人未批</span>
                <el-icon :size="16"><ArrowRight /></el-icon>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无待批改作业" :image-size="60" />
        </div>

        <div class="panel" v-if="data?.classKnowledge && data.classKnowledge.length > 0">
          <h3 class="panel-title">班级知识点掌握率</h3>
          <BaseChart :option="classKnowledgeChartOption" height="260px" />
        </div>
        <div class="panel" v-else>
          <h3 class="panel-title">任教班级知识点掌握</h3>
          <el-empty description="暂无数据" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, Notebook, School, User, Upload, Edit, Document, Tickets, ArrowRight, TrendCharts } from '@element-plus/icons-vue'
import { useDashboardApi, type TeacherDashboardData } from '@/composables/useDashboardApi'
import type { EChartsOption } from 'echarts'
import BaseChart from '@/components/common/BaseChart.vue'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const userStore = useUserStore()
const router = useRouter()
const { getTeacherDashboard } = useDashboardApi()

const data = ref<TeacherDashboardData | null>(null)
const loading = ref(true)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

const currentDate = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
})

function navigateTo(path: string) {
  router.push(path)
}

const classKnowledgeChartOption = computed<EChartsOption>(() => {
  const knowledge = data.value?.classKnowledge || []
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 30, right: 30, bottom: 20, top: 10, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' },
      splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
    },
    yAxis: {
      type: 'category',
      data: knowledge.map(k => k.className),
      axisLabel: { fontSize: 12, color: '#666' }
    },
    series: [{
      type: 'bar',
      data: knowledge.map(k => ({
        value: k.masteryRate,
        itemStyle: {
          color: k.masteryRate >= 80 ? '#3b82f6' : k.masteryRate >= 60 ? '#60a5fa' : k.masteryRate >= 40 ? '#f59e0b' : '#ef4444',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 22,
      label: { show: true, position: 'right', formatter: '{c}%', fontSize: 12 }
    }]
  }
})

onMounted(async () => {
  try {
    data.value = await getTeacherDashboard()
  } catch {
    data.value = null
  } finally {
    loading.value = false
  }
})

useSeoMeta({
  title: '教师工作台 - 教育云平台'
})
</script>

<style scoped>
.teacher-dashboard-page {
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
  background: linear-gradient(135deg, #1e40af 0%, #0f172a 100%);
  border-radius: var(--border-radius-lg);
  padding: 28px 36px;
  margin-bottom: 24px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.welcome-banner::after {
  content: '';
  position: absolute;
  top: -60px;
  right: -40px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.35) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

.welcome-text {
  position: relative;
  z-index: 1;
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
  position: relative;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
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

.stat-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: 10px;
  font-weight: 600;
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

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.homework-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-light);
}

.homework-item:hover {
  background: #f0f2ff;
}

.homework-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.homework-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.homework-class {
  font-size: 11px;
  color: var(--text-secondary);
}

.homework-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.homework-count {
  color: #ef4444;
  font-weight: 600;
  background: rgba(239, 68, 68, 0.1);
  padding: 3px 8px;
  border-radius: 8px;
}

@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .content-grid {
    grid-template-columns: 1fr;
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
</style>
