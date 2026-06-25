<template>
  <div class="video-broadcast-new">
    <div class="broadcast-container">
      <div class="broadcast-left">
        <div class="video-player">
          <video
            v-if="currentVideo?.filePath"
            :src="currentVideo.filePath"
            :poster="currentVideo.coverPath"
            controls
            class="player-video"
          />
          <div v-else class="player-placeholder">
            <img :src="currentVideo?.coverPath || '/images/default-cover.png'" :alt="currentVideo?.videoName" class="cover-image" />
            <div class="play-overlay">
              <el-icon class="play-icon"><VideoPlay /></el-icon>
            </div>
          </div>
        </div>
        <div class="video-info">
          <h3 class="video-title">{{ currentVideo?.videoName || '暂无视频' }}</h3>
          <p v-if="currentVideo?.innerTeacherName" class="teacher-name">
            <el-icon><User /></el-icon>
            {{ currentVideo.innerTeacherName }}
          </p>
          <p v-if="videoTypeText" class="video-type">
            <el-icon><Collection /></el-icon>
            {{ videoTypeText }}
          </p>
        </div>
      </div>

      <div class="broadcast-right">
        <div class="broadcast-header">
          <span class="broadcast-title">展播视频</span>
          <NuxtLink to="/broadcast" class="more-link">更多&gt;&gt;</NuxtLink>
        </div>
        <div class="broadcast-list">
          <div
            v-for="(video, index) in displayVideos"
            :key="video.videoId"
            :class="['broadcast-item', { active: currentVideo?.videoId === video.videoId }]"
            @click="playVideo(video)"
          >
            <div class="item-left">
              <span class="live-dot" :class="{ 'is-live': video.videoType === 2 }"></span>
              <span class="item-title">{{ video.videoName }}</span>
              <span :class="['video-type-tag', 'vtype-' + video.videoType]">{{ videoTypeMap[video.videoType] || '视频' }}</span>
            </div>
            <div class="item-right">
              <span class="teacher-name">主讲老师：{{ video.innerTeacherName || '未知' }}</span>
            </div>
            <div class="item-bottom">
              <span class="play-count">
                <el-icon><VideoCamera /></el-icon>
                {{ formatNumber(video.viewCount || 0) }}
              </span>
              <span class="video-time">{{ formatDate(video.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, User, Collection, VideoCamera } from '@element-plus/icons-vue'
import type { Video } from '@/types'
import { formatNumber } from '@/utils/format'

interface Props {
  videos: Video[]
}

const props = defineProps<Props>()

const currentVideo = ref<Video | null>(null)
const displayVideos = ref<Video[]>([])

const videoTypeMap: Record<number, string> = {
  1: '课程', 2: '讲座', 3: '非课程', 4: '其他'
}

const videoTypeText = computed(() => {
  if (!currentVideo.value) return ''
  return videoTypeMap[(currentVideo.value as Video).videoType] || '视频'
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 24 * 60 * 60 * 1000
  
  if (diff < day) {
    return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (diff < 2 * day) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + 
           date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
}

function playVideo(video: Video) {
  currentVideo.value = video
}

function initVideos() {
  const videos = props.videos || []
  if (videos.length > 0) {
    displayVideos.value = videos.slice(0, 8)
    const randomIndex = Math.floor(Math.random() * Math.min(5, videos.length))
    currentVideo.value = videos[randomIndex] ?? null
  } else {
    displayVideos.value = []
    currentVideo.value = null
  }
}

onMounted(() => {
  initVideos()
})

onBeforeUnmount(() => {
  const videoEl = document.querySelector('.player-video') as HTMLVideoElement | null
  if (videoEl) {
    videoEl.pause()
    videoEl.src = ''
    videoEl.load()
  }
})

watch(() => props.videos, () => {
  initVideos()
}, { deep: true })
</script>

<style scoped>
.video-broadcast-new {
  background: #fff;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  margin-bottom: 24px;
}

.broadcast-container {
  display: flex;
  gap: 0;
}

.broadcast-left {
  width: 60%;
  background: #000;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.player-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-placeholder {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(255, 80, 0, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.play-overlay:hover {
  transform: translate(-50%, -50%) scale(1.1);
  background: rgba(255, 80, 0, 1);
}

.play-icon {
  font-size: 32px;
  color: #fff;
}

.video-info {
  padding: 20px;
  background: #fff;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
  line-height: 1.5;
}

.teacher-name,
.video-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  margin: 8px 0 0;
}

.teacher-name .el-icon,
.video-type .el-icon {
  font-size: 16px;
}

.broadcast-right {
  width: 40%;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}

.broadcast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  background: #fff;
}

.broadcast-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.more-link {
  font-size: 14px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.more-link:hover {
  color: var(--primary-dark);
}

.broadcast-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.broadcast-item {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.broadcast-item:hover {
  background: rgba(255, 80, 0, 0.05);
}

.broadcast-item.active {
  background: rgba(255, 80, 0, 0.08);
  border-left: 3px solid var(--primary-color);
  padding-left: 17px;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  flex-shrink: 0;
}

.live-dot.is-live {
  background: var(--danger-color);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.item-title {
  font-size: 14px;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-type-tag {
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
}

.vtype-1 { background: #409EFF; }
.vtype-2 { background: #F56C6C; }
.vtype-3 { background: #909399; }
.vtype-4 { background: #67C23A; }

.item-right {
  margin-bottom: 8px;
}

.item-right .teacher-name {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.item-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.play-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

.play-count .el-icon {
  font-size: 14px;
}

.video-time {
  color: var(--text-secondary);
}

@media (max-width: 900px) {
  .broadcast-container {
    flex-direction: column;
  }
  
  .broadcast-left,
  .broadcast-right {
    width: 100%;
  }
  
  .broadcast-list {
    max-height: 300px;
  }
}
</style>
