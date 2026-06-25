<template>
  <div class="broadcast-topics-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">展播专题</h1>
        <p class="page-desc">精选优质课程展播，系列专题视频分类学习</p>
      </div>

      <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="视频展播" name="broadcast">
          <div v-loading="broadcastLoading" class="broadcast-content">
            <VideoBroadcast v-if="broadcastVideos.length > 0" :videos="broadcastVideos" />
            <el-empty v-else-if="!broadcastLoading" description="暂无展播视频" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="专题视频" name="topics">
          <div v-loading="topicsLoading" class="topics-content">
            <div v-if="topics.length > 0" class="topics-grid">
              <TopicCard
                v-for="topic in topics"
                :key="topic.topicId"
                :topic="topic"
              />
            </div>
            <el-empty v-else-if="!topicsLoading" description="暂无专题数据" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Video, Topic } from '@/types'
import { get } from '@/utils/request'

definePageMeta({
  layout: 'default'
})

const activeTab = ref('broadcast')

// 视频展播
const broadcastLoading = ref(false)
const broadcastVideos = ref<Video[]>([])

async function fetchBroadcastVideos() {
  broadcastLoading.value = true
  try {
    const res: any = await get('/vodCourse/carousel/list')
    broadcastVideos.value = res?.data || []
  } catch {
    broadcastVideos.value = []
  } finally {
    broadcastLoading.value = false
  }
}

// 专题视频
const topicsLoading = ref(false)
const topics = ref<Topic[]>([])

async function fetchTopics() {
  if (topics.value.length > 0) return
  topicsLoading.value = true
  try {
    const res = await get<any>('/vodCourse/topic/list', { pageNum: 1, pageSize: 20 })
    topics.value = res?.rows || []
  } catch {
    topics.value = []
  } finally {
    topicsLoading.value = false
  }
}

// 切换 Tab 时懒加载
watch(activeTab, (val) => {
  if (val === 'broadcast' && broadcastVideos.value.length === 0) {
    fetchBroadcastVideos()
  } else if (val === 'topics') {
    fetchTopics()
  }
})

onMounted(() => {
  fetchBroadcastVideos()
})

useSeoMeta({
  title: '展播专题 - 教育云平台',
  description: '精选优质课程展播，系列专题视频分类学习'
})
</script>

<style scoped>
.broadcast-topics-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.content-tabs {
  margin-top: 8px;
}

.broadcast-content {
  min-height: 300px;
}

.topics-content {
  min-height: 300px;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1200px) {
  .topics-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .topics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .topics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
