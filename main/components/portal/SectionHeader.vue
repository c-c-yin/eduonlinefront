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
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.section-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color) 0%, transparent 100%);
  border-radius: 3px;
}

.section-left {
  display: flex;
  align-items: flex-end;
  gap: 28px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  position: relative;
  padding-left: 14px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 22px;
  background: linear-gradient(180deg, var(--primary-color) 0%, var(--primary-light) 100%);
  border-radius: 2px;
}

.section-tabs {
  display: flex;
  gap: 24px;
  margin-bottom: 4px;
}

.tab-item {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 0;
  position: relative;
  transition: all 0.25s ease;
  font-weight: 500;
}

.tab-item:hover {
  color: var(--primary-color);
}

.tab-item.active {
  color: var(--primary-color);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 3px;
  background: var(--primary-color);
  border-radius: 3px;
}

.section-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.right-text {
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--primary-50);
  color: var(--primary-color);
  padding: 5px 14px;
  border-radius: 14px;
  font-weight: 500;
}

.section-more {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--bg-light);
}

.section-more:hover {
  gap: 10px;
  color: var(--primary-color);
  background: var(--primary-50);
}

.section-more .el-icon {
  transition: transform 0.3s;
}

.section-more:hover .el-icon {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .section-title {
    font-size: 18px;
  }

  .section-title::before {
    height: 18px;
  }

  .section-tabs {
    gap: 16px;
  }

  .tab-item {
    font-size: 13px;
  }
}
</style>
