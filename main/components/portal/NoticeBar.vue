<template>
  <div v-if="notices.length > 0" class="notice-bar">
    <div class="container notice-container">
      <div class="notice-icon">
        <el-icon><Bell /></el-icon>
        <span class="notice-label">公告</span>
      </div>
      <div class="notice-content">
        <el-carousel
          direction="vertical"
          :autoplay="true"
          :interval="4000"
          indicator-position="none"
          height="36px"
        >
          <el-carousel-item v-for="notice in notices" :key="notice.noticeId">
            <NuxtLink :to="`/notices/${notice.noticeId}`" class="notice-link">
              <span v-if="notice.isTop === 1" class="top-badge">置顶</span>
              {{ notice.noticeTitle }}
            </NuxtLink>
          </el-carousel-item>
        </el-carousel>
      </div>
      <NuxtLink to="/notices" class="notice-more">
        更多
        <el-icon><ArrowRight /></el-icon>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell, ArrowRight } from '@element-plus/icons-vue'
import type { Notice } from '@/types'

interface Props {
  notices: Notice[]
}

defineProps<Props>()
</script>

<style scoped>
.notice-bar {
  background: linear-gradient(135deg, #fffbe6 0%, #fff7cc 100%);
  border-bottom: 1px solid #ffe58f;
}

.notice-container {
  display: flex;
  align-items: center;
  height: 44px;
}

.notice-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #d48806;
  flex-shrink: 0;
}

.notice-icon .el-icon {
  font-size: 18px;
}

.notice-label {
  font-weight: 500;
  font-size: 14px;
}

.notice-content {
  flex: 1;
  overflow: hidden;
  margin: 0 16px;
}

.notice-link {
  display: flex;
  align-items: center;
  height: 36px;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.3s;
}

.notice-link:hover {
  color: var(--primary-color);
}

.top-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  border-radius: 2px;
  margin-right: 8px;
  flex-shrink: 0;
}

.notice-more {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #d48806;
  text-decoration: none;
  font-size: 13px;
  flex-shrink: 0;
}

.notice-more:hover {
  text-decoration: underline;
}
</style>
