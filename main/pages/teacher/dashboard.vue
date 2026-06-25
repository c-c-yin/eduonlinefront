<template>
  <div class="teacher-dashboard-page">
    <ErrorBoundary>
      <div class="container">
        <!-- 加载骨架 -->
        <SkeletonDashboard v-if="loading" />

        <template v-else>
          <!-- 欢迎横幅 -->
          <div class="welcome-banner">
            <div class="welcome-text">
              <h1>{{ userStore.realName || userStore.userName }}老师，{{ greeting }}</h1>
              <p>{{ currentDate }}</p>
            </div>
          </div>

          <!-- 统计卡片 -->
          <div class="stats-grid">
            <div class="stat-card" style="--card-color: #667eea">
              <div class="stat-icon"><el-icon :size="28"><VideoCamera /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.videoCount ?? '-' }}</div>
                <div class="stat-label">我的视频</div>
              </div>
              <div v-if="data?.pendingAuditCount" class="stat-badge">待审{{ data.pendingAuditCount }}</div>
            </div>
            <div class="stat-card" style="--card-color: #f093fb">
              <div class="stat-icon"><el-icon :size="28"><Notebook /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.homeworkCount ?? '-' }}</div>
                <div class="stat-label">发布作业</div>
              </div>
              <div v-if="data?.pendingScoreCount" class="stat-badge">待批{{ data.pendingScoreCount }}</div>
            </div>
            <div class="stat-card" style="--card-color: #4facfe">
              <div class="stat-icon"><el-icon :size="28"><School /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.classCount ?? '-' }}</div>
                <div class="stat-label">任教班级</div>
              </div>
            </div>
            <div class="stat-card" style="--card-color: #43e97b">
              <div class="stat-icon"><el-icon :size="28"><User /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ data?.studentCount ?? '-' }}</div>
                <div class="stat-label">学生总数</div>
              </div>
            </div>
          </div>

          <!-- 快捷操作 -->
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
              <div class="action-item" @click="navigateTo('/teacher/statistics/score')">
                <el-icon :size="22"><DataAnalysis /></el-icon>
                <span>成绩分析</span>
              </div>
              <div class="action-item" @click="navigateTo('/teacher/profile/students')">
                <el-icon :size="22"><User /></el-icon>
                <span>学生画像</span>
              </div>
              <div class="action-item" @click="navigateTo('/teacher/alerts')">
                <el-icon :size="22"><Bell /></el-icon>
                <span>预警中心</span>
                <el-badge v-if="data?.unreadAlertCount" :value="data.unreadAlertCount" class="action-badge" />
              </div>
            </div>
          </div>

          <!-- 待批改作业 + 班级知识点掌握 -->
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
              <BaseChart :option="classKnowledgeChartOption" height="280px" />
            </div>
            <div class="panel" v-else>
              <h3 class="panel-title">任教班级知识点掌握</h3>
              <el-empty description="暂无数据" :image-size="60" />
            </div>
          </div>

          <div class="content-grid">
            <!-- 视频审核状态 -->
            <div class="panel">
              <h3 class="panel-title">视频审核状态</h3>
              <div v-if="data?.videoAuditList && data.videoAuditList.length > 0" class="audit-list">
                <div
                  v-for="v in data.videoAuditList"
                  :key="v.videoId"
                  class="audit-item"
                  @click="navigateTo('/teacher/videos')"
                >
                  <span class="audit-name">{{ v.videoName }}</span>
                  <el-tag :type="getAuditTagType(v.auditStatus)" size="small">
                    {{ v.auditStatusName }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-else description="暂无视频" :image-size="60" />
            </div>

            <!-- 最近发布作业 -->
            <div class="panel">
              <h3 class="panel-title">最近发布作业</h3>
              <div v-if="data?.recentHomework && data.recentHomework.length > 0" class="homework-list">
                <div
                  v-for="h in data.recentHomework"
                  :key="h.homeworkId"
                  class="homework-item"
                  @click="navigateTo(`/teacher/homework/${h.homeworkId}`)"
                >
                  <div class="homework-info">
                    <span class="homework-name">{{ h.homeworkName }}</span>
                    <span class="homework-class">{{ h.className }}</span>
                  </div>
                  <div class="homework-meta">
                    <span class="homework-date">{{ formatDate(h.createTime) }}</span>
                    <span class="homework-submit">{{ h.submitCount }}/{{ h.totalCount }}提交</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无发布作业" :image-size="60" />
            </div>
          </div>
        </template>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, Notebook, School, User, Upload, Edit, Document, Tickets, ArrowRight, TrendCharts, DataAnalysis, Bell } from '@element-plus/icons-vue'
import { useDashboardApi, type TeacherDashboardData } from '@/composables/useDashboardApi'
import type { EChartsOption } from 'echarts'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import SkeletonDashboard from '@/components/common/SkeletonDashboard.vue'
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

function getAuditTagType(status: number): 'warning' | 'success' | 'danger' | 'info' {
  switch (status) {
    case 0: return 'warning'
    case 1: return 'success'
    case 2: return 'danger'
    default: return 'info'
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// 班级知识点掌握率柱状图
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
          color: k.masteryRate >= 80 ? '#43e97b' : k.masteryRate >= 60 ? '#4facfe' : k.masteryRate >= 40 ? '#f0ad4e' : '#f56c6c',
          borderRadius: [0, 4, 4, 0]
        }
      })),
      barWidth: 24,
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
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
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.welcome-banner h1 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

.welcome-banner p {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
  position: relative;
  z-index: 1;
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
  position: relative;
}

.action-item:hover {
  color: #6366f1;
  background: #f0f2ff;
  box-shadow: var(--shadow-sm);
}

.action-item :deep(.el-icon) {
  padding: 6px;
  background: var(--bg-light);
  border-radius: 6px;
}

.action-item:hover :deep(.el-icon) {
  background: rgba(99, 102, 241, 0.15);
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

.homework-list,
.audit-list,
.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.homework-item,
.audit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-light);
}

.homework-item:hover,
.audit-item:hover {
  background: #e0e7ff;
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

.homework-date {
  color: var(--text-secondary);
  font-size: 11px;
}

.homework-submit {
  font-size: 11px;
  color: #6366f1;
  font-weight: 600;
}

.audit-name {
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.knowledge-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.knowledge-item:hover {
  background: var(--bg-light);
}

.knowledge-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.knowledge-class {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 600;
}

.knowledge-rate {
  font-size: 13px;
  color: #6366f1;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: var(--bg-light);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 响应式 */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
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

  .action-grid {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .welcome-banner {
    padding: 24px;
  }

  .welcome-banner h1 {
    font-size: 20px;
  }
}
</style>