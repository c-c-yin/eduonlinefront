<template>
  <div class="teacher-profile-panel">
    <div class="panel-left">
      <div class="profile-card">
        <div class="profile-icon">
          <el-icon :size="48"><User /></el-icon>
        </div>
        <div class="profile-stats">
          <div class="stat-item">
            <span class="stat-value">{{ data?.profile?.classCount ?? '--' }}</span>
            <span class="stat-label">所带班级</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ data?.profile?.studentCount ?? '--' }}</span>
            <span class="stat-label">学生总数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ data?.profile?.avgMasteryScore?.toFixed(1) || '--' }}</span>
            <span class="stat-label">平均掌握度</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-right">
      <div class="info-section">
        <div class="section-head">
          <span class="section-title">待批改作业</span>
          <span class="section-badge" v-if="data?.pendingHomework?.length">{{ data.pendingHomework.length }}</span>
        </div>
        <div class="section-body">
          <div v-if="data?.pendingHomework?.length" class="homework-list">
            <div v-for="hw in data.pendingHomework" :key="hw.homeworkId" class="hw-item" @click="goHomeworkDetail(hw.homeworkId)">
              <span class="hw-name">{{ hw.homeworkName }}</span>
              <span v-if="hw.submitCount" class="hw-submit">{{ hw.submitCount }}人提交</span>
            </div>
          </div>
          <div v-else class="empty-tip">暂无待批改作业</div>
        </div>
      </div>

      <div class="info-section">
        <div class="section-head">
          <span class="section-title">学生预警</span>
          <span class="section-badge warn" v-if="data?.alertStudentCount">{{ data.alertStudentCount }}</span>
        </div>
        <div class="section-body">
          <div v-if="data?.recentAlerts?.length" class="alert-list">
            <div v-for="(alert, idx) in data.recentAlerts" :key="idx" class="alert-item">
              <span :class="['alert-level', alert.level]">{{ alertLevelMap[alert.level] || alert.level }}</span>
              <span class="alert-name">{{ alert.studentName }}</span>
              <span class="alert-type">{{ alertTypeMap[alert.alertType] || alert.alertType }}</span>
            </div>
          </div>
          <div v-else class="empty-tip">暂无预警学生</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@element-plus/icons-vue'
import type { TeacherDashboard } from '@/types'

interface Props {
  data?: TeacherDashboard | null
}

defineProps<Props>()

const router = useRouter()

const alertLevelMap: Record<string, string> = {
  high: '严重',
  medium: '警告',
  low: '提示'
}

const alertTypeMap: Record<string, string> = {
  'low_score': '成绩预警',
  'low_mastery': '掌握度预警',
  'high_wrong': '错题预警',
  'inactive': '活跃度预警',
  'decline': '下滑预警'
}

function goHomeworkDetail(homeworkId: number) {
  router.push(`/teacher/homework/${homeworkId}`)
}
</script>

<style scoped>
.teacher-profile-panel {
  display: flex;
  gap: 24px;
  background: #fff;
  border-radius: var(--border-radius-lg, 12px);
  padding: 24px;
  box-shadow: var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06));
  margin-bottom: 24px;
}

.panel-left {
  width: 280px;
  flex-shrink: 0;
}

.profile-card {
  text-align: center;
}

.profile-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin: 0 auto 20px;
}

.profile-stats {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.panel-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 16px;
}

.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-badge {
  background: var(--primary-color);
  color: #fff;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.section-badge.warn {
  background: #E6A23C;
}

.section-body {
  font-size: 13px;
  color: var(--text-secondary);
}

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hw-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hw-name {
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 65%;
}

.hw-submit {
  font-size: 12px;
  color: var(--primary-color);
  flex-shrink: 0;
}

.empty-tip {
  color: var(--text-secondary);
  font-size: 13px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-level {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
}

.alert-level.high { background: #F56C6C; }
.alert-level.medium { background: #E6A23C; }
.alert-level.low { background: #909399; }

.alert-name {
  font-weight: 500;
  color: var(--text-primary);
}

.alert-type {
  color: var(--text-secondary);
  font-size: 12px;
}

@media (max-width: 768px) {
  .teacher-profile-panel {
    flex-direction: column;
  }

  .panel-left {
    width: 100%;
  }
}
</style>
