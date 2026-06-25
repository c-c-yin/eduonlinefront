<template>
  <div class="topic-card" @click="handleClick">
    <div class="topic-cover">
      <img :src="topic.coverUrl || defaultCover" :alt="topic.topicName" />
      <div class="topic-overlay">
        <span class="video-count">
          <el-icon><VideoCamera /></el-icon>
          {{ topic.videoCount || 0 }} 个视频
        </span>
      </div>
    </div>
    <div class="topic-info">
      <h3 class="topic-title">{{ topic.topicName }}</h3>
      <p class="topic-desc">{{ topic.topicDesc || '暂无描述' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera } from '@element-plus/icons-vue'
import type { Topic } from '@/types'

interface Props {
  topic: Topic
}

const props = defineProps<Props>()

const router = useRouter()
const defaultCover = '/images/default-topic.png'

function handleClick() {
  router.push(`/topics/${props.topic.topicId}`)
}
</script>

<style scoped>
.topic-card {
  background: var(--bg-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-card);
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.topic-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.topic-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.topic-card:hover .topic-cover img {
  transform: scale(1.05);
}

.topic-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.6));
  display: flex;
  align-items: flex-end;
  padding: 16px;
}

.video-count {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.5);
  padding: 6px 12px;
  border-radius: 20px;
}

.topic-info {
  padding: 16px;
}

.topic-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}
</style>
