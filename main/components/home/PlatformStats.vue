<template>
  <div class="platform-stats" ref="statsRef">
    <div class="stats-inner">
      <div class="stat-card" v-for="item in statItems" :key="item.label">
        <div class="stat-icon" :style="{ background: item.bgColor }">
          <el-icon :size="28"><component :is="item.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ item.displayValue }}+</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, Edit, Document, Timer } from '@element-plus/icons-vue'
import type { PlatformStats as PlatformStatsData } from '@/types'

interface Props {
  data?: PlatformStatsData | null
}

const props = defineProps<Props>()

const statItems = computed(() => {
  const d = props.data
  return [
    { label: '课程视频', value: d?.courseCount || 0, icon: VideoCamera, bgColor: 'linear-gradient(135deg, #667eea, #764ba2)' },
    { label: '试题资源', value: d?.questionCount || 0, icon: Edit, bgColor: 'linear-gradient(135deg, #f093fb, #f5576c)' },
    { label: '试卷资源', value: d?.paperCount || 0, icon: Document, bgColor: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
    { label: '学习时长(小时)', value: d?.studyHours || 0, icon: Timer, bgColor: 'linear-gradient(135deg, #43e97b, #38f9d7)' }
  ].map(item => ({
    ...item,
    displayValue: formatStatValue(item.value)
  }))
})

function formatStatValue(val: number): string {
  if (val >= 10000) {
    return (val / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  }
  return val.toLocaleString()
}
</script>

<style scoped>
.platform-stats {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--border-radius-lg, 12px);
  padding: 40px 32px;
  margin-bottom: 24px;
}

.stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  transition: background 0.3s;
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.15);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
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
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 4px;
}

@media (max-width: 900px) {
  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .stats-inner {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-icon {
    width: 44px;
    height: 44px;
  }
}
</style>
