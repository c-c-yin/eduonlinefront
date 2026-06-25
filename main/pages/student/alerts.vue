<template>
  <div class="student-alerts-page">
    <ErrorBoundary>
      <div class="container" v-loading="loading">
        <!-- 加载骨架 -->
        <div v-if="loading" class="skeleton-wrap">
          <el-skeleton :rows="6" animated />
        </div>

        <template v-else>
          <!-- 页面标题 -->
          <div class="page-header">
            <h1 class="page-title">
              <el-icon :size="24"><Warning /></el-icon>
              学习预警
            </h1>
            <p class="page-desc">基于学习画像自动计算的预警提醒，帮助你及时发现问题并改进</p>
          </div>

          <!-- 预警统计概览 -->
          <div v-if="alerts.length" class="stats-grid">
            <div class="stat-card severe">
              <div class="stat-icon"><el-icon :size="22"><CircleCloseFilled /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ severeCount }}</div>
                <div class="stat-label">严重</div>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon"><el-icon :size="22"><WarningFilled /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ warningCount }}</div>
                <div class="stat-label">警告</div>
              </div>
            </div>
            <div class="stat-card info">
              <div class="stat-icon"><el-icon :size="22"><InfoFilled /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ infoCount }}</div>
                <div class="stat-label">提示</div>
              </div>
            </div>
            <div class="stat-card total">
              <div class="stat-icon"><el-icon :size="22"><Bell /></el-icon></div>
              <div class="stat-info">
                <div class="stat-value">{{ alerts.length }}</div>
                <div class="stat-label">预警总数</div>
              </div>
            </div>
          </div>

          <!-- 预警消息列表 -->
          <div v-if="alerts.length" class="alert-list">
            <el-card
              v-for="(alert, index) in alerts"
              :key="index"
              class="alert-card"
              :class="'alert-' + alert.level"
              shadow="hover"
            >
              <div class="alert-content">
                <div class="alert-level-bar" :class="'bar-' + alert.level"></div>
                <div class="alert-body">
                  <div class="alert-header">
                    <el-tag
                      :type="levelTagType(alert.level)"
                      effect="dark"
                      size="small"
                      class="alert-tag"
                    >
                      {{ levelText(alert.level) }}
                    </el-tag>
                    <span class="alert-name">{{ alert.name }}</span>
                  </div>
                  <div class="alert-detail">
                    <div class="detail-row">
                      <span class="detail-label">触发条件：</span>
                      <span class="detail-text">{{ alert.condition }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">当前情况：</span>
                      <span class="detail-text" :class="'text-' + alert.level">{{ alert.current }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">建议措施：</span>
                      <span class="detail-text suggestion">{{ alert.suggestion }}</span>
                    </div>
                  </div>
                  <div class="alert-actions">
                    <el-button
                      size="small"
                      :type="levelButtonType(alert.level)"
                      plain
                      round
                      @click="handleAction(alert)"
                    >
                      立即处理
                    </el-button>
                  </div>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 无预警 -->
          <div v-else class="empty-wrap">
            <el-empty description="暂无预警，继续保持！" :image-size="160">
              <el-button type="primary" round @click="navigateToProfile">查看学习画像</el-button>
            </el-empty>
          </div>
        </template>
      </div>
    </ErrorBoundary>
  </div>
</template>

<script setup lang="ts">
import {
  Warning,
  WarningFilled,
  CircleCloseFilled,
  InfoFilled,
  Bell
} from '@element-plus/icons-vue'
import { useProfileApi, type StudentProfile } from '@/composables/useProfileApi'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'

definePageMeta({
  middleware: ['student'],
  ssr: false
})

const router = useRouter()
const { getMyProfile } = useProfileApi()

const profile = ref<StudentProfile | null>(null)
const loading = ref(true)

type AlertLevel = 'severe' | 'warning' | 'info'

interface AlertItem {
  level: AlertLevel
  name: string
  condition: string
  current: string
  suggestion: string
  action?: string
}

const alerts = computed<AlertItem[]>(() => {
  const p = profile.value
  if (!p) return []
  const list: AlertItem[] = []

  // 严重(红)：avgMasteryScore < 40
  if (p.avgMasteryScore != null && p.avgMasteryScore < 40) {
    list.push({
      level: 'severe',
      name: '掌握度严重偏低',
      condition: '平均掌握度低于 40 分',
      current: `当前平均掌握度 ${p.avgMasteryScore.toFixed(1)} 分`,
      suggestion: '制定个性化辅导计划，建议联系老师进行针对性辅导',
      action: 'profile'
    })
  }

  // 警告(黄)：activeDays30 < 3
  if (p.activeDays30 != null && p.activeDays30 < 3) {
    list.push({
      level: 'warning',
      name: '近30天几乎未活跃',
      condition: '近30天活跃天数少于 3 天',
      current: `近30天仅活跃 ${p.activeDays30} 天`,
      suggestion: '建议保持每日学习习惯，制定每日学习计划并坚持执行',
      action: 'dashboard'
    })
  }

  // 警告(黄)：scoreTrend == 'down'
  if (p.scoreTrend === 'down') {
    list.push({
      level: 'warning',
      name: '成绩持续下降',
      condition: '学习得分趋势为下降',
      current: '本周得分较上周下降',
      suggestion: '查看错题分布，加强薄弱知识点练习，及时巩固复习',
      action: 'wrong'
    })
  }

  // 警告(黄)：weakKnowledgeCount > 8
  if (p.weakKnowledgeCount != null && p.weakKnowledgeCount > 8) {
    list.push({
      level: 'warning',
      name: '薄弱知识点过多',
      condition: '薄弱知识点数量超过 8 个',
      current: `当前薄弱知识点 ${p.weakKnowledgeCount} 个`,
      suggestion: '从最基础知识点逐层补漏，建议按知识点优先级逐一攻克',
      action: 'mastery'
    })
  }

  // 提示(蓝)：completionRate < 30
  if (p.completionRate != null && p.completionRate < 30) {
    list.push({
      level: 'info',
      name: '视频完播率过低',
      condition: '视频完播率低于 30%',
      current: `当前完播率 ${p.completionRate.toFixed(1)}%`,
      suggestion: '引导完整观看视频，避免跳过关键讲解内容',
      action: 'videos'
    })
  }

  // 严重优先，其次警告，最后提示
  const order: Record<AlertLevel, number> = { severe: 0, warning: 1, info: 2 }
  return list.sort((a, b) => order[a.level] - order[b.level])
})

const severeCount = computed(() => alerts.value.filter(a => a.level === 'severe').length)
const warningCount = computed(() => alerts.value.filter(a => a.level === 'warning').length)
const infoCount = computed(() => alerts.value.filter(a => a.level === 'info').length)

function levelText(level: AlertLevel): string {
  const map: Record<AlertLevel, string> = {
    severe: '严重',
    warning: '警告',
    info: '提示'
  }
  return map[level]
}

function levelTagType(level: AlertLevel): 'danger' | 'warning' | 'info' {
  const map: Record<AlertLevel, 'danger' | 'warning' | 'info'> = {
    severe: 'danger',
    warning: 'warning',
    info: 'info'
  }
  return map[level]
}

function levelButtonType(level: AlertLevel): 'danger' | 'warning' | 'primary' {
  const map: Record<AlertLevel, 'danger' | 'warning' | 'primary'> = {
    severe: 'danger',
    warning: 'warning',
    info: 'primary'
  }
  return map[level]
}

function handleAction(alert: AlertItem) {
  switch (alert.action) {
    case 'profile':
      router.push('/student/profile')
      break
    case 'dashboard':
      router.push('/student/dashboard')
      break
    case 'wrong':
      router.push('/student/wrong')
      break
    case 'mastery':
      router.push('/student/mastery')
      break
    case 'videos':
      router.push('/videos')
      break
    default:
      router.push('/student/profile')
  }
}

function navigateToProfile() {
  router.push('/student/profile')
}

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
  title: '学习预警 - 教育云平台'
})
</script>

<style scoped>
.student-alerts-page {
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

/* 页面标题 */
.page-header {
  background: linear-gradient(135deg, #f56c6c 0%, #e6a23c 100%);
  border-radius: 12px;
  padding: 28px 32px;
  margin-bottom: 24px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(245, 108, 108, 0.25);
}

.page-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-desc {
  margin: 0;
  font-size: 13px;
  opacity: 0.9;
}

/* 统计概览 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid transparent;
}

.stat-card.severe { border-left-color: #f56c6c; }
.stat-card.warning { border-left-color: #e6a23c; }
.stat-card.info { border-left-color: #409eff; }
.stat-card.total { border-left-color: #909399; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.stat-card.severe .stat-icon { background: #f56c6c; }
.stat-card.warning .stat-icon { background: #e6a23c; }
.stat-card.info .stat-icon { background: #409eff; }
.stat-card.total .stat-icon { background: #909399; }

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #333;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

/* 预警列表 */
.alert-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-card {
  border-radius: 12px;
  overflow: hidden;
  border: none;
}

.alert-card :deep(.el-card__body) {
  padding: 0;
}

.alert-content {
  display: flex;
}

.alert-level-bar {
  width: 6px;
  flex-shrink: 0;
}

.bar-severe { background: #f56c6c; }
.bar-warning { background: #e6a23c; }
.bar-info { background: #409eff; }

.alert-body {
  flex: 1;
  padding: 20px 24px;
}

.alert-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.alert-tag {
  flex-shrink: 0;
}

.alert-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.alert-detail {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  font-size: 13px;
  line-height: 1.6;
}

.detail-label {
  color: #909399;
  flex-shrink: 0;
  width: 84px;
}

.detail-text {
  color: #606266;
  flex: 1;
}

.detail-text.text-severe { color: #f56c6c; font-weight: 600; }
.detail-text.text-warning { color: #e6a23c; font-weight: 600; }
.detail-text.text-info { color: #409eff; font-weight: 600; }

.detail-text.suggestion {
  color: #67c23a;
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
}

/* 空状态 */
.empty-wrap {
  background: #fff;
  border-radius: 12px;
  padding: 60px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .alert-body {
    padding: 16px;
  }

  .detail-row {
    flex-direction: column;
    gap: 4px;
  }

  .detail-label {
    width: auto;
  }
}
</style>
