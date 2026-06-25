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
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
  border-radius: var(--border-radius-xl, 16px);
  padding: 48px 40px;
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;
}

.platform-stats::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(70, 195, 123, 0.08) 0%, transparent 50%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stats-inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 6px;
  font-weight: 500;
}

@media (max-width: 900px) {
  .stats-inner {
    grid-template-columns: repeat(2, 1fr);
  }

  .platform-stats {
    padding: 32px 24px;
  }
}

@media (max-width: 600px) {
  .stats-inner {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    width: 48px;
    height: 48px;
  }

  .stat-card {
    padding: 16px;
  }
}
</style>
