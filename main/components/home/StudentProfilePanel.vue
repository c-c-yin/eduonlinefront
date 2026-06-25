<template>
  <div class="student-profile-panel">
    <div class="panel-left">
      <div class="profile-card">
        <div class="profile-label" :style="{ background: data?.profile?.labelColor || '#409EFF' }">
          {{ data?.profile?.compositeLabel || '暂无标签' }}
        </div>
        <div class="profile-score">
          <span class="score-value">{{ data?.profile?.compositeScore?.toFixed(1) || '--' }}</span>
          <span class="score-unit">综合得分</span>
        </div>
        <div class="profile-row">
          <div class="profile-item">
            <span class="item-value">
              {{ data?.profile?.currentWeekAvgRate != null ? data.profile.currentWeekAvgRate.toFixed(1) + '%' : '--' }}
            </span>
            <span class="item-label">本周正确率</span>
          </div>
          <div class="profile-item">
            <span class="item-value">
              <template v-if="data?.profile?.scoreTrend">
                <el-icon :class="data.profile.scoreTrend" :size="16">
                  <CaretTop v-if="data.profile.scoreTrend === 'up'" />
                  <CaretBottom v-else-if="data.profile.scoreTrend === 'down'" />
                  <Minus v-else />
                </el-icon>
              </template>
              <template v-else>--</template>
            </span>
            <span class="item-label">得分趋势</span>
          </div>
          <div class="profile-item">
            <span class="item-value">{{ data?.profile?.activeDays7 ?? '--' }}</span>
            <span class="item-label">7日活跃</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-right">
      <div class="info-section">
        <div class="section-head">
          <span class="section-title">待完成作业</span>
          <span class="section-badge" v-if="data?.pendingHomework?.length">{{ data.pendingHomework.length }}</span>
        </div>
        <div class="section-body">
          <div v-if="data?.pendingHomework?.length" class="homework-list">
            <div v-for="hw in data.pendingHomework" :key="hw.homeworkId" class="hw-item">
              <span class="hw-name">{{ hw.homeworkName }}</span>
              <span v-if="hw.deadline" class="hw-deadline">截止: {{ hw.deadline }}</span>
            </div>
          </div>
          <div v-else class="empty-tip">暂无待完成作业</div>
        </div>
      </div>

      <div class="info-section">
        <div class="section-head">
          <span class="section-title">错题提醒</span>
          <span class="section-badge warn" v-if="data?.wrongQuestionCount">{{ data.wrongQuestionCount }}</span>
        </div>
        <div class="section-body">
          <span class="wrong-text">未掌握错题 <strong>{{ data?.wrongQuestionCount || 0 }}</strong> 道</span>
          <NuxtLink to="/student/wrong" class="view-link">查看错题本 &gt;</NuxtLink>
        </div>
      </div>

      <div class="info-section" v-if="data?.recommendQuestions?.length">
        <div class="section-head">
          <span class="section-title">推荐练习</span>
        </div>
        <div class="section-body">
          <div class="recommend-list">
            <div v-for="q in data.recommendQuestions" :key="q.questionId" class="rec-item" @click="goQuestion(q.questionId)">
              <span :class="['q-type-tag', 'type-' + q.questionType]">{{ questionTypeMap[q.questionType] || '其他' }}</span>
              <span class="q-text" v-safe-html="q.questionContentText || '点击查看'"></span>
              <span class="q-diff">{{ difficultyMap[q.difficulty] || '' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretTop, CaretBottom, Minus } from '@element-plus/icons-vue'
import type { StudentDashboard } from '@/types'

interface Props {
  data?: StudentDashboard | null
}

const props = defineProps<Props>()
const router = useRouter()

const questionTypeMap: Record<number, string> = {
  1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算', 7: '证明', 8: '应用'
}

const difficultyMap: Record<number, string> = {
  1: '易', 2: '较易', 3: '中等', 4: '较难', 5: '难'
}

function goQuestion(id: number) {
  router.push(`/questions/${id}`)
}
</script>

<style scoped>
.student-profile-panel {
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

.profile-label {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 20px;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}

.profile-score {
  margin-bottom: 20px;
}

.score-value {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.score-unit {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.profile-row {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.profile-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.item-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}

.item-value .up { color: #67C23A; }
.item-value .down { color: #F56C6C; }

.item-label {
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
  max-width: 60%;
}

.hw-deadline {
  font-size: 12px;
  color: #F56C6C;
  flex-shrink: 0;
}

.empty-tip {
  color: var(--text-secondary);
  font-size: 13px;
}

.wrong-text {
  margin-right: 12px;
}

.wrong-text strong {
  color: #E6A23C;
  font-size: 16px;
}

.view-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 13px;
}

.view-link:hover {
  text-decoration: underline;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.rec-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.rec-item:hover {
  color: var(--primary-color);
}

.q-type-tag {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
}

.type-1 { background: #409EFF; }
.type-2 { background: #67C23A; }
.type-3 { background: #E6A23C; }
.type-4 { background: #F56C6C; }
.type-5, .type-6, .type-7, .type-8 { background: #909399; }

.q-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary);
}

.q-diff {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .student-profile-panel {
    flex-direction: column;
  }

  .panel-left {
    width: 100%;
  }
}
</style>
