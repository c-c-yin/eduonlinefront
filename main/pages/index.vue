<template>
  <div class="home-page">
    <section class="banner-section">
      <ClientOnly>
        <Banner :banners="banners" height="260px" />
        <template #fallback>
          <div class="banner-placeholder" style="height: 260px; background: #f5f5f5;"></div>
        </template>
      </ClientOnly>
    </section>

    <section class="notice-section">
      <NoticeBar :notices="notices" />
    </section>

    <div class="container main-content">
      <section v-if="userStore.isLoggedIn" class="dashboard-shortcut-section">
        <div
          v-if="userStore.isTeacher"
          class="dashboard-card teacher-card"
          @click="navigateTo('/teacher/dashboard')"
        >
          <div class="card-left">
            <h3>我的工作台</h3>
            <p>管理视频、作业、成绩，查看班级知识点掌握情况</p>
          </div>
          <div class="card-right">
            <el-icon :size="36"><DataAnalysis /></el-icon>
          </div>
        </div>
        <div
          v-else-if="userStore.isStudent"
          class="dashboard-card student-card"
          @click="navigateTo('/student/dashboard')"
        >
          <div class="card-left">
            <h3>学习中心</h3>
            <p>查看学习进度、待完成作业、知识点掌握情况</p>
          </div>
          <div class="card-right">
            <el-icon :size="36"><TrendCharts /></el-icon>
          </div>
        </div>
      </section>

      <section class="broadcast-section">
        <ClientOnly>
          <VideoBroadcastNew :videos="carouselVideos" />
          <template #fallback>
            <div class="broadcast-placeholder" style="height: 380px; background: #f5f5f5; border-radius: 12px;"></div>
          </template>
        </ClientOnly>
      </section>

      <section class="stats-section">
        <PlatformStats :data="platformStatsData" />
      </section>

      <section class="recommend-section">
        <SectionHeader
          title="热门推荐"
          :tabs="videoTabs"
          more-link="/videos"
          @tab-change="onVideoTabChange"
        />
        <ClientOnly>
          <div v-if="videos.length > 0" class="video-grid">
            <VideoCard
              v-for="video in videos"
              :key="video.videoId"
              :video="video"
            />
          </div>
          <el-empty v-else description="暂无推荐课程" />
        </ClientOnly>
      </section>

      <section class="bottom-section">
        <div class="paper-part">
          <SectionHeader title="最新试卷" more-link="/papers" />
          <LatestPapers :papers="latestPapers" />
        </div>
        <div class="question-part">
          <SectionHeader title="热门试题" more-link="/questions" />
          <HotQuestions :questions="hotQuestions" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Banner, Notice, Video, Topic, HomeDashboardVo, LatestPaperItem, HotQuestionItem } from '@/types'
import { usePortalApi } from '@/composables/usePortalApi'
import { useVideoApi } from '@/composables/useVideoApi'
import { useHomeApi } from '@/composables/useHomeApi'
import { DataAnalysis, TrendCharts } from '@element-plus/icons-vue'
import VideoBroadcastNew from '@/components/portal/VideoBroadcastNew.vue'

definePageMeta({
  ssr: false
})

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()
const { getBannersByCode, getScrollNotices } = usePortalApi()
const { searchVideos, getCarouselList } = useVideoApi()
const { getDashboard, getPlatformStats, getLatestPapers, getHotQuestions } = useHomeApi()

const banners = ref<Banner[]>([])
const notices = ref<Notice[]>([])
const carouselVideos = ref<Video[]>([])
const dashboard = ref<HomeDashboardVo | null>(null)
const videos = ref<Video[]>([])
const latestPapers = ref<LatestPaperItem[] | null>(null)
const hotQuestions = ref<HotQuestionItem[] | null>(null)
const platformStatsData = ref(null)

const videoTabs = ['全部', '课程视频', '讲座视频', '非课程视频']
const videoTypeMap: Record<number, number | undefined> = { 0: undefined, 1: 1, 2: 2, 3: 3 }
const currentVideoTab = ref(0)

function onVideoTabChange(index: number) {
  currentVideoTab.value = index
  fetchVideos()
}

function navigateTo(path: string) {
  router.push(path)
}

async function fetchVideos() {
  try {
    const videoType = videoTypeMap[currentVideoTab.value]
    const params: any = { pageNum: 1, pageSize: 8 }
    if (videoType !== undefined) {
      params.videoType = videoType
    }
    const res = await searchVideos(params)
    videos.value = res?.rows || []
  } catch {
    videos.value = []
  }
}

async function fetchPrimaryData() {
  const [bannersData, noticesData, carouselData, dashboardData] = await Promise.all([
    getBannersByCode('home_banner').catch(() => []),
    getScrollNotices().catch(() => []),
    getCarouselList().catch(() => []),
    getDashboard().catch(() => null)
  ])
  banners.value = bannersData || []
  notices.value = noticesData || []
  carouselVideos.value = carouselData || []
  dashboard.value = dashboardData
}

async function fetchLazyData() {
  const results = await Promise.allSettled([
    fetchVideos(),
    getPlatformStats().then(data => { platformStatsData.value = data }).catch(() => {}),
    getLatestPapers(6).then(data => { latestPapers.value = data }).catch(() => {}),
    getHotQuestions(8).then(data => { hotQuestions.value = data }).catch(() => {})
  ])
}

onMounted(async () => {
  await fetchPrimaryData()
  setTimeout(() => {
    fetchLazyData()
  }, 300)
})

useSeoMeta({
  title: '教育云平台',
  description: '在线教育平台，提供优质视频课程和试题练习'
})
</script>

<style scoped>
.home-page {
  background: var(--bg-page);
  min-height: 100vh;
}

.banner-section {
  margin-bottom: 0;
}

.notice-section {
  margin-bottom: 0;
}

.main-content {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 24px 20px 48px;
}

.dashboard-shortcut-section {
  margin-bottom: 24px;
}

.dashboard-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all 0.25s ease;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 60%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08));
  pointer-events: none;
}

.dashboard-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
}

.dashboard-card.teacher-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.dashboard-card.student-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #1d4ed8 100%);
}

.dashboard-card .card-left h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
}

.dashboard-card .card-left p {
  margin: 0;
  font-size: 13px;
  opacity: 0.88;
}

.dashboard-card .card-right {
  flex-shrink: 0;
  margin-left: 20px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
}

.broadcast-section {
  margin-bottom: 24px;
}

.stats-section {
  margin-bottom: 24px;
}

.recommend-section {
  margin-bottom: 32px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.bottom-section {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
}

.paper-part {
  flex: 1;
  min-width: 0;
}

.question-part {
  flex: 1;
  min-width: 0;
}

@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .bottom-section {
    flex-direction: column;
    gap: 20px;
  }
}

@media (max-width: 600px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .dashboard-card .card-right {
    display: none;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
</style>
