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
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: 32px 32px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-sm);
}

.stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  max-width: var(--container-max-width);
  margin: 0 auto;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background: var(--bg-light);
  border-radius: var(--border-radius-lg);
  transition: all 0.2s ease;
}

.stat-card:hover {
  background: var(--bg-color);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
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

@media (max-width: 1024px) {
  .platform-stats {
    padding: 24px;
  }

  .stats-inner {
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .platform-stats {
    padding: 20px;
  }

  .stats-inner {
    gap: 12px;
  }

  .stat-value {
    font-size: 20px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  border-radius: 10px;
  }

  .stat-card {
    padding: 12px 16px;
  }
}
</style>
