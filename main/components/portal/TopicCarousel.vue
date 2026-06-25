<template>
  <div class="topic-carousel">
    <div class="carousel-viewport">
      <transition name="carousel-fade" mode="out-in">
        <div v-if="currentTopic" :key="currentTopic.topicId" class="topic-slide" @click="goToTopic(currentTopic.topicId)">
          <div class="slide-cover">
            <img :src="currentTopic.coverUrl || defaultCover" :alt="currentTopic.topicName" />
            <div class="slide-overlay">
              <div class="slide-content">
                <h3 class="slide-title">{{ currentTopic.topicName }}</h3>
                <p class="slide-desc">{{ currentTopic.topicDesc || '暂无描述' }}</p>
                <span class="slide-count">
                  <el-icon><VideoCamera /></el-icon>
                  {{ currentTopic.videoCount || 0 }} 个视频
                </span>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <button v-if="topics.length > 1" class="carousel-btn prev" @click.stop="prev">
      <el-icon :size="20"><ArrowLeft /></el-icon>
    </button>
    <button v-if="topics.length > 1" class="carousel-btn next" @click.stop="next">
      <el-icon :size="20"><ArrowRight /></el-icon>
    </button>

    <div v-if="topics.length > 1" class="carousel-indicators">
      <span
        v-for="(_, i) in topics"
        :key="i"
        class="indicator"
        :class="{ active: i === currentIndex }"
        @click.stop="goTo(i)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { VideoCamera, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import type { Topic } from '@/types'

interface Props {
  topics: Topic[]
  autoplay?: boolean
  interval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoplay: true,
  interval: 4000
})

const router = useRouter()
const defaultCover = '/images/default-topic.png'
const currentIndex = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const currentTopic = computed(() => props.topics[currentIndex.value])

function goTo(index: number) {
  currentIndex.value = index
  resetTimer()
}

function prev() {
  currentIndex.value = (currentIndex.value - 1 + props.topics.length) % props.topics.length
  resetTimer()
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % props.topics.length
  resetTimer()
}

function goToTopic(topicId: number) {
  router.push(`/topics/${topicId}`)
}

function startTimer() {
  if (!props.autoplay || props.topics.length <= 1) return
  timer = setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % props.topics.length
  }, props.interval)
}

function resetTimer() {
  if (timer) clearInterval(timer)
  startTimer()
}

onMounted(() => {
  startTimer()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

watch(() => props.topics, () => {
  currentIndex.value = 0
  resetTimer()
})
</script>

<style scoped>
.topic-carousel {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.carousel-viewport {
  position: relative;
  height: 280px;
}

.topic-slide {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.slide-cover {
  position: relative;
  width: 100%;
  height: 100%;
}

.slide-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.3) 50%, transparent 100%);
  display: flex;
  align-items: center;
}

.slide-content {
  padding: 40px;
  max-width: 55%;
  color: #fff;
}

.slide-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slide-desc {
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 16px;
  opacity: 0.9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.slide-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
}

.carousel-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.85);
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.carousel-btn:hover {
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.carousel-btn.prev {
  left: 16px;
}

.carousel-btn.next {
  right: 16px;
}

.carousel-indicators {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 2;
}

.indicator {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s;
}

.indicator.active {
  width: 24px;
  background: #fff;
}

.carousel-fade-enter-active,
.carousel-fade-leave-active {
  transition: opacity 0.4s ease;
}

.carousel-fade-enter-from,
.carousel-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .carousel-viewport {
    height: 220px;
  }

  .slide-content {
    padding: 24px;
    max-width: 65%;
  }

  .slide-title {
    font-size: 20px;
  }

  .slide-desc {
    font-size: 14px;
  }
}

@media (max-width: 600px) {
  .carousel-viewport {
    height: 180px;
  }

  .slide-content {
    padding: 16px;
    max-width: 80%;
  }

  .slide-title {
    font-size: 18px;
  }
}
</style>