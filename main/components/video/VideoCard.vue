<template>
  <div class="video-card" @click="goToDetail">
    <div class="video-cover">
      <img
        :src="video.coverPath || '/images/default-cover.png'"
        :alt="video.videoName"
        class="cover-image"
        loading="lazy"
      />
      <span v-if="typeTag" class="tag course-type-tag">{{ typeTag }}</span>
      <div class="play-overlay">
        <el-icon class="play-icon"><VideoPlay /></el-icon>
      </div>
    </div>
    <div class="video-info">
      <h3 class="video-title">{{ video.videoName }}</h3>
      <p class="teacher-desc">{{ teacherName }}</p>
      <div class="video-footer">
        <span class="study-count">
          <el-icon :size="13"><View /></el-icon>
          {{ formatNumber(video.viewCount || 0) }} 次学习
        </span>
        <span v-if="durationText" class="study-count">{{ durationText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoPlay, View } from '@element-plus/icons-vue'
import type { Video } from '@/types'
import { formatNumber } from '@/utils/format'

interface Props {
  video: Video
}

const props = defineProps<Props>()
const router = useRouter()

const videoTypeMap: Record<number, string> = {
  1: '课程',
  2: '讲座',
  3: '视频'
}

const typeTag = computed(() => videoTypeMap[props.video.videoType] || '')

const teacherName = computed(() => {
  return props.video.innerTeacherName || props.video.outerTeacherName || '平台讲师'
})

const durationText = computed(() => {
  const d = props.video.duration
  if (!d || d <= 0) return ''
  const m = Math.floor(d / 60)
  const s = Math.floor(d % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
})

function goToDetail() {
  router.push(`/videos/${props.video.videoId}`)
}
</script>

<style scoped>
.video-card {
  background: var(--bg-color);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: var(--shadow-sm);
  position: relative;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--primary-200);
}

.video-cover {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: var(--bg-light);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.video-card:hover .cover-image {
  transform: scale(1.05);
}

.tag {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #fff;
  font-weight: 600;
  backdrop-filter: blur(4px);
}

.course-type-tag {
  background: rgba(37, 99, 235, 0.92);
}

.free-tag {
  top: auto;
  bottom: 10px;
  left: 10px;
  background: var(--danger-color);
}

.play-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.45) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 44px;
  color: #fff;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
}

.video-info {
  padding: 14px;
}

.video-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 6px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 42px;
  transition: color 0.2s;
}

.video-card:hover .video-title {
  color: var(--primary-color);
}

.teacher-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0 0 10px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-light);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 11px;
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
}

.video-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.study-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .video-info {
    padding: 12px;
  }

  .video-title {
    font-size: 13px;
  }
}
</style>
