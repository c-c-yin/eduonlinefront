<template>
  <div class="home-page">
    <!-- 模块1: Banner 轮播横幅 -->
    <section v-if="moduleConfig.banner" class="banner-section">
      <ClientOnly>
        <Banner :banners="banners" height="280px" />
        <template #fallback>
          <div class="banner-placeholder" style="height: 280px; background: #f5f5f5;"></div>
        </template>
      </ClientOnly>
    </section>

    <!-- 模块2: 通知公告滚动条 -->
    <section v-if="moduleConfig.notice && notices.length > 0" class="notice-section">
      <NoticeBar :notices="notices" />
    </section>

    <div class="container main-content">
      <!-- 模块3: 快捷功能入口（仅登录用户可见） -->
      <section v-if="userStore.isLoggedIn && moduleConfig.shortcuts" class="shortcuts-section">
        <QuickNav />
      </section>

      <!-- 登录用户：工作台/学习中心快捷入口卡片 -->
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
            <el-icon :size="40"><DataAnalysis /></el-icon>
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
            <el-icon :size="40"><TrendCharts /></el-icon>
          </div>
        </div>
      </section>

      <!-- 模块4: 教师教学面板（仅登录教师可见；学生画像已移至学习中心页面） -->
      <section v-if="moduleConfig.profile && userStore.isTeacher" class="profile-section">
        <TeacherProfilePanel :data="dashboard?.teacher" />
      </section>

      <!-- 学生差异化：继续学习 + 待完成作业（仅学生可见） -->
      <section
        v-if="userStore.isStudent"
        v-loading="studentLoading"
        class="student-extra-section"
      >
        <div
          v-if="studentDashboard && (studentDashboard.lastStudy || (studentDashboard.pendingHomework && studentDashboard.pendingHomework.length > 0))"
          class="student-extra-grid"
        >
          <!-- 继续学习卡片 -->
          <div v-if="studentDashboard.lastStudy" class="extra-card continue-card">
            <div class="extra-card-header">
              <el-icon :size="22"><VideoPlay /></el-icon>
              <span class="extra-card-label">继续学习</span>
            </div>
            <div class="extra-card-title" :title="studentDashboard.lastStudy.videoName">
              {{ studentDashboard.lastStudy.videoName }}
            </div>
            <div class="progress-wrap">
              <div class="progress-bar">
                <div
                  class="progress-inner"
                  :style="{ width: studentDashboard.lastStudy.progress + '%' }"
                ></div>
              </div>
              <span class="progress-text">{{ studentDashboard.lastStudy.progress }}%</span>
            </div>
            <el-button
              class="extra-card-btn"
              type="primary"
              round
              size="small"
              @click="navigateTo(`/videos/${studentDashboard.lastStudy.videoId}`)"
            >继续观看</el-button>
          </div>

          <!-- 待完成作业卡片 -->
          <div
            v-if="studentDashboard.pendingHomework && studentDashboard.pendingHomework.length > 0"
            class="extra-card homework-card"
          >
            <div class="extra-card-header">
              <el-icon :size="22"><Bell /></el-icon>
              <span class="extra-card-label">待完成作业</span>
            </div>
            <div class="extra-card-title" :title="studentDashboard.pendingHomework[0].homeworkName">
              {{ studentDashboard.pendingHomework[0].homeworkName }}
            </div>
            <div class="homework-meta">
              <span class="meta-subject">{{ studentDashboard.pendingHomework[0].subjectName }}</span>
              <span
                class="meta-deadline"
                :class="{ overdue: isOverdue(studentDashboard.pendingHomework[0].deadline) }"
              >
                截止：{{ studentDashboard.pendingHomework[0].deadline }}
              </span>
            </div>
            <el-button
              class="extra-card-btn"
              type="danger"
              round
              size="small"
              @click="navigateTo(`/student/homework/${studentDashboard.pendingHomework[0].homeworkId}`)"
            >去完成</el-button>
          </div>
        </div>
      </section>

      <!-- 模块5: 视频展播区 -->
      <section v-if="moduleConfig.broadcast && carouselVideos.length > 0" class="broadcast-section">
        <ClientOnly>
          <VideoBroadcastNew :videos="carouselVideos" />
          <template #fallback>
            <div class="broadcast-placeholder" style="height: 420px; background: #f5f5f5; border-radius: 8px;"></div>
          </template>
        </ClientOnly>
      </section>

      <!-- 模块6: 平台数据概览 -->
      <section v-if="moduleConfig.stats" class="stats-section">
        <PlatformStats :data="platformStatsData" />
      </section>

      <!-- 模块7: 热门推荐视频 -->
      <section v-if="moduleConfig.recommend" class="recommend-section">
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

      <!-- 模块7.5: 最新专题 -->
      <section v-if="moduleConfig.topic && topics.length > 0" class="topic-carousel-section">
        <SectionHeader title="最新专题" more-link="/topics" />
        <ClientOnly>
          <TopicCarousel :topics="topics" />
        </ClientOnly>
      </section>

      <!-- 模块9+10: 最新试卷 + 热门试题 -->
      <section class="bottom-section">
        <div v-if="moduleConfig.paper" class="paper-part">
          <SectionHeader title="最新试卷" more-link="/papers" />
          <LatestPapers :papers="latestPapers" />
        </div>
        <div v-if="moduleConfig.hotquestion" class="question-part">
          <SectionHeader title="热门试题" more-link="/questions" />
          <HotQuestions :questions="hotQuestions" />
        </div>
      </section>
    </div>

    <!-- 弹窗公告 -->
    <el-dialog
      v-model="popupVisible"
      :title="popupNotice?.noticeTitle"
      width="480px"
      :close-on-click-modal="true"
      class="popup-notice-dialog"
    >
      <div class="popup-content" v-html="popupNotice?.noticeContent"></div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import type { Banner, Notice, Video, Topic, HomeDashboardVo, LatestPaperItem, HotQuestionItem } from '@/types'
import { usePortalApi } from '@/composables/usePortalApi'
import { useVideoApi } from '@/composables/useVideoApi'
import { useHomeApi } from '@/composables/useHomeApi'
import { useDashboardApi, type StudentDashboardData } from '@/composables/useDashboardApi'
import { DataAnalysis, TrendCharts, VideoPlay, Bell } from '@element-plus/icons-vue'
import VideoBroadcastNew from '@/components/portal/VideoBroadcastNew.vue'
import TopicCarousel from '@/components/portal/TopicCarousel.vue'

definePageMeta({
  ssr: false
})

const appStore = useAppStore()
const userStore = useUserStore()
const router = useRouter()
const { getBannersByCode, getScrollNotices, getPopupNotices } = usePortalApi()
const { searchVideos, getCarouselList, getTopicList } = useVideoApi()
const { getDashboard, getPlatformStats, getLatestPapers, getHotQuestions } = useHomeApi()
const { getStudentDashboard } = useDashboardApi()

// 模块配置
const moduleConfig = computed(() => appStore.homeModuleConfig)

// 首屏数据
const banners = ref<Banner[]>([])
const notices = ref<Notice[]>([])
const carouselVideos = ref<Video[]>([])
const dashboard = ref<HomeDashboardVo | null>(null)

// 懒加载数据
const videos = ref<Video[]>([])
const topics = ref<Topic[]>([])
const latestPapers = ref<LatestPaperItem[] | null>(null)
const hotQuestions = ref<HotQuestionItem[] | null>(null)
const platformStatsData = ref(null)

// 弹窗公告
const popupVisible = ref(false)
const popupNotice = ref<Notice | null>(null)

// 学生差异化数据：继续学习 + 待完成作业
const studentDashboard = ref<StudentDashboardData | null>(null)
const studentLoading = ref(false)

// 视频标签页
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

// 首屏数据加载
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

// 懒加载数据
async function fetchLazyData() {
  const results = await Promise.allSettled([
    fetchVideos(),
    getTopicList({ pageNum: 1, pageSize: 4 }).then(res => { topics.value = res?.rows || [] }).catch(() => {}),
    getPlatformStats().then(data => { platformStatsData.value = data }).catch(() => {}),
    getLatestPapers(6).then(data => { latestPapers.value = data }).catch(() => {}),
    getHotQuestions(8).then(data => { hotQuestions.value = data }).catch(() => {})
  ])
}

// 弹窗公告
async function checkPopupNotice() {
  try {
    const data = await getPopupNotices()
    if (data && data.length > 0) {
      popupNotice.value = data[0] ?? null
      popupVisible.value = true
    }
  } catch {
    // ignore
  }
}

// 学生差异化：继续学习 + 待完成作业
function isOverdue(deadline: string): boolean {
  if (!deadline) return false
  return new Date(deadline).getTime() < Date.now()
}

async function fetchStudentDashboard() {
  if (!userStore.isStudent) return
  studentLoading.value = true
  try {
    studentDashboard.value = await getStudentDashboard()
  } catch {
    studentDashboard.value = null
  } finally {
    studentLoading.value = false
  }
}

onMounted(async () => {
  await fetchPrimaryData()
  // 非首屏数据延迟加载
  setTimeout(() => {
    fetchLazyData()
    checkPopupNotice()
    fetchStudentDashboard()
  }, 300)
})

useSeoMeta({
  title: '教育云平台',
  description: '在线教育平台，提供优质视频课程和试题练习',
  ogTitle: '教育云平台',
  ogDescription: '在线教育平台，提供优质视频课程和试题练习'
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

.shortcuts-section {
  margin-bottom: 24px;
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}

.dashboard-card.student-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #14b8a6 100%);
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

.profile-section {
  margin-bottom: 24px;
}

.student-extra-section {
  margin-bottom: 24px;
  min-height: 40px;
}

.student-extra-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.extra-card {
  border-radius: var(--border-radius-lg);
  padding: 20px 24px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
}

.extra-card::before {
  content: '';
  position: absolute;
  top: -30px;
  right: -30px;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.extra-card.continue-card {
  background: linear-gradient(135deg, var(--primary-color) 0%, #14b8a6 100%);
}

.extra-card.homework-card {
  background: linear-gradient(135deg, #f97316 0%, #ef4444 100%);
}

.extra-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}

.extra-card-label {
  font-size: 13px;
  font-weight: 600;
}

.extra-card-title {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 3px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: #fff;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

.homework-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  opacity: 0.9;
}

.meta-subject {
  background: rgba(255, 255, 255, 0.2);
  padding: 3px 10px;
  border-radius: 10px;
}

.meta-deadline.overdue {
  color: #fff;
  font-weight: 600;
  background: rgba(220, 38, 38, 0.9);
  padding: 3px 8px;
  border-radius: 10px;
}

.extra-card-btn {
  align-self: flex-start;
  border: none;
  font-weight: 500;
}

:deep(.extra-card-btn.el-button) {
  background: rgba(255, 255, 255, 0.95);
  color: inherit;
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

.topic-carousel-section {
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

.popup-content {
  line-height: 1.8;
  font-size: 14px;
  color: var(--text-primary);
}

.popup-content :deep(img) {
  max-width: 100%;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .main-content {
    padding: 24px 16px 40px;
  }

  .video-grid {
    gap: 16px;
  }

  .student-extra-grid {
    gap: 14px;
  }
}

@media (max-width: 900px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bottom-section {
    flex-direction: column;
    gap: 20px;
  }

  .student-extra-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 12px 32px;
  }

  .dashboard-card {
    padding: 20px 24px;
  }

  .dashboard-card .card-left h3 {
    font-size: 16px;
  }

  .dashboard-card .card-left p {
    font-size: 12px;
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

  .extra-card {
    padding: 16px 20px;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-card {
    padding: 16px 20px;
  }

  .student-extra-grid {
    gap: 12px;
  }
}
</style>
