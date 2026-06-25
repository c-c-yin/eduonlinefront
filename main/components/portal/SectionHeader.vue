<template>
  <div class="section-header">
    <div class="section-left">
      <h2 class="section-title">{{ title }}</h2>
      <div v-if="tabs && tabs.length > 0" class="section-tabs">
        <span
          v-for="(tab, index) in tabs"
          :key="index"
          :class="['tab-item', { active: activeTab === index }]"
          @click="handleTabClick(index)"
        >
          {{ tab }}
        </span>
      </div>
    </div>
    <div v-if="rightContent" class="section-right">
      <slot name="right">
        <span class="right-text">{{ rightContent }}</span>
      </slot>
    </div>
    <NuxtLink v-if="moreLink" :to="moreLink" class="section-more">
      <span>{{ moreText || '查看更多' }}</span>
      <el-icon><ArrowRight /></el-icon>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'

interface Props {
  title: string
  subtitle?: string
  moreLink?: string
  moreText?: string
  tabs?: string[]
  rightContent?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'tab-change', index: number): void
}>()

const activeTab = ref(0)

function handleTabClick(index: number) {
  activeTab.value = index
  emit('tab-change', index)
}
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.section-left {
  display: flex;
  align-items: flex-end;
  gap: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.section-tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 4px;
}

.tab-item {
  font-size: 15px;
  color: #666;
  cursor: pointer;
  padding: 4px 0;
  position: relative;
  transition: all 0.2s;
}

.tab-item:hover {
  color: var(--primary-color);
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
}

.section-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-text {
  font-size: 14px;
  color: var(--text-secondary);
  background: rgba(70, 195, 123, 0.08);
  padding: 4px 12px;
  border-radius: 12px;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-color);
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s;
  white-space: nowrap;
}

.section-more:hover {
  gap: 8px;
}

@media (max-width: 768px) {
  .section-title {
    font-size: 20px;
  }
  
  .section-tabs {
    gap: 16px;
  }
  
  .tab-item {
    font-size: 14px;
  }
}
</style>
