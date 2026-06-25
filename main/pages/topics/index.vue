<template>
  <div class="topics-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">专题推荐</h1>
        <p class="page-desc">精选学习专题，助力精准提升</p>
      </div>

      <div v-loading="loading" class="topics-grid">
        <TopicCard
          v-for="topic in topics"
          :key="topic.topicId"
          :topic="topic"
        />
      </div>

      <el-empty v-if="!loading && topics.length === 0" description="暂无专题数据" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Topic } from '@/types'
import { get } from '@/utils/request'

definePageMeta({
  layout: 'default'
})

const loading = ref(false)
const topics = ref<Topic[]>([])

async function fetchTopics() {
  loading.value = true
  try {
    const res = await get<any>('/vodCourse/topic/list', { pageNum: 1, pageSize: 20 })
    topics.value = res?.rows || []
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    topics.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTopics()
})

useSeoMeta({
  title: '专题推荐 - 教育云平台',
  description: '精选学习专题，助力精准提升'
})
</script>

<style scoped>
.topics-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.page-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .topics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .topics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .topics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
