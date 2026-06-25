<template>
  <div class="video-broadcast">
    <div class="broadcast-main">
      <div class="main-video">
        <div class="video-wrapper">
          <video
            ref="videoRef"
            class="video-player"
            :poster="currentVideo?.coverPath"
            controls
            @ended="handleVideoEnded"
          >
            <source :src="currentVideo?.filePath" type="video/mp4" />
          </video>
          <div v-if="!isPlaying" class="video-overlay" @click="handlePlay">
            <div class="play-button">
              <el-icon :size="48"><VideoPlay /></el-icon>
            </div>
            <div class="video-info">
              <h3>{{ currentVideo?.videoName }}</h3>
              <p>{{ currentVideo?.innerTeacherName }} · {{ formatDuration(currentVideo?.duration || 0) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="broadcast-list">
      <div class="list-header">
        <h3>展播列表</h3>
        <span class="video-count">共 {{ videos.length }} 个视频</span>
      </div>
      <div class="list-content" ref="listRef">
        <div
          v-for="(video, index) in videos"
          :key="video.videoId"
          class="list-item"
          :class="{ active: currentIndex === index }"
          @click="handleSelectVideo(index)"
        >
          <div class="item-cover">
            <img :src="video.coverPath || defaultCover" :alt="video.videoName" />
            <span class="item-duration">{{ formatDuration(video.duration) }}</span>
          </div>
          <div class="item-info">
            <h4 class="item-title">{{ video.videoName }}</h4>
            <p class="item-meta">
              <span>{{ video.innerTeacherName }}</span>
              <span>{{ video.viewCount || 0 }} 次观看</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay } from '@element-plus/icons-vue'
import type { Video } from '@/types'
import { formatDuration } from '@/utils/format'

interface Props {
  videos: Video[]
}

const props = defineProps<Props>()

const videoRef = ref<HTMLVideoElement>()
const listRef = ref<HTMLElement>()
const currentIndex = ref(0)
const isPlaying = ref(false)

const defaultCover = '/images/default-cover.png'

const currentVideo = computed(() => props.videos[currentIndex.value])

function handlePlay() {
  if (videoRef.value) {
    videoRef.value.play()
    isPlaying.value = true
  }
}

function handleVideoEnded() {
  if (currentIndex.value < props.videos.length - 1) {
    currentIndex.value++
    nextTick(() => {
      handlePlay()
    })
  } else {
    isPlaying.value = false
  }
}

function handleSelectVideo(index: number) {
  currentIndex.value = index
  isPlaying.value = false
  nextTick(() => {
    handlePlay()
  })
}

watch(currentIndex, () => {
  if (listRef.value) {
    const activeItem = listRef.value.querySelector('.list-item.active')
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
})

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.removeAttribute('src')
    videoRef.value.load()
  }
})
</script>

<style scoped>
.video-broadcast {
  display: flex;
  gap: 20px;
  background: var(--bg-color);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.broadcast-main {
  flex: 1;
  min-width: 0;
}

.main-video {
  position: relative;
}

.video-wrapper {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #000;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.play-button {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  transition: all 0.3s;
  margin-bottom: 20px;
}

.video-overlay:hover .play-button {
  transform: scale(1.1);
  background: #fff;
}

.video-info {
  text-align: center;
  color: #fff;
}

.video-info h3 {
  font-size: 18px;
  margin: 0 0 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.video-info p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.broadcast-list {
  width: 320px;
  flex-shrink: 0;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-header h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}

.video-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.list-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.list-item:hover {
  background: var(--bg-page);
}

.list-item.active {
  background: var(--primary-color-light-9);
}

.item-cover {
  width: 120px;
  height: 68px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.item-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 12px;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

@media (max-width: 1024px) {
  .video-broadcast {
    flex-direction: column;
  }
  
  .broadcast-list {
    width: 100%;
    border-left: none;
    border-top: 1px solid var(--border-color);
    max-height: 300px;
  }
}
</style>
