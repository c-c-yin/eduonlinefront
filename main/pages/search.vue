<template>
  <div class="search-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">搜索结果</h1>
        <p class="page-desc" v-if="keyword">关键词: {{ keyword }}</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-input-bar">
        <el-input
          v-model="searchInput"
          size="large"
          placeholder="搜索课程、视频、试题..."
          clearable
          @keyup.enter="doSearch"
          :prefix-icon="Search"
        >
          <template #append>
            <el-button @click="doSearch" :icon="Search">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 搜索建议（输入时） -->
      <div v-if="searchInput && suggestions.length > 0 && !keyword" class="suggestions">
        <div
          v-for="s in suggestions"
          :key="s"
          class="suggestion-item"
          @click="doSearchWith(s)"
        >
          <el-icon><Search /></el-icon>
          <span>{{ s }}</span>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="hot-search-section" v-if="hotSearchEnabled && hotSearches.length > 0 && !keyword">
        <h3 class="section-title">热门搜索</h3>
        <div class="hot-tags">
          <el-tag
            v-for="(item, index) in hotSearches"
            :key="index"
            class="hot-tag"
            :color="getTagColor(index)"
            effect="plain"
            @click="handleHotSearch(item.keyword)"
          >
            {{ item.keyword }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索历史 -->
      <div v-if="userStore.isLoggedIn && searchHistory.length > 0 && !keyword" class="search-history-section">
        <div class="history-header">
          <h3 class="section-title">搜索历史</h3>
          <el-button type="danger" link size="small" @click="clearHistory">清除历史</el-button>
        </div>
        <div class="history-tags">
          <el-tag
            v-for="(item, index) in searchHistory"
            :key="index"
            class="history-tag"
            type="info"
            effect="plain"
            @click="handleHotSearch(item.keyword)"
          >
            <el-icon><Clock /></el-icon>
            {{ item.keyword }}
          </el-tag>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div v-if="keyword" class="search-tabs">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="课程" name="course">
            <div v-loading="loading" class="result-content">
              <div v-if="courseList.length > 0" class="video-grid">
                <VideoCard v-for="video in courseList" :key="video.videoId" :video="video" />
              </div>
              <el-empty v-else description="未找到相关课程" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="视频" name="video">
            <div v-loading="loading" class="result-content">
              <div v-if="videoList.length > 0" class="video-grid">
                <VideoCard v-for="video in videoList" :key="video.videoId" :video="video" />
              </div>
              <el-empty v-else description="未找到相关视频" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="试题" name="question">
            <div v-loading="questionLoading" class="result-content">
              <div v-if="questionList.length > 0" class="question-list">
                <div v-for="q in questionList" :key="q.questionId" class="question-item" @click="goQuestion(q.questionId)">
                  <div class="question-header">
                    <el-tag size="small" :type="questionTypeTag(q.questionType)">{{ questionTypeLabel(q.questionType) }}</el-tag>
                    <el-tag size="small" type="info">难度{{ q.difficulty }}</el-tag>
                    <span v-if="q.correctRate != null" class="question-rate">正确率 {{ q.correctRate }}%</span>
                  </div>
                  <p class="question-content" v-safe-html="q.questionContentText"></p>
                </div>
              </div>
              <el-empty v-else description="未找到相关试题" />
            </div>
          </el-tab-pane>
          <el-tab-pane label="专题" name="topic">
            <div v-loading="topicLoading" class="result-content">
              <div v-if="topicList.length > 0" class="topic-grid">
                <div v-for="t in topicList" :key="t.topicId" class="topic-card" @click="goTopic(t.topicId)">
                  <img v-if="t.coverImage" :src="t.coverImage" class="topic-cover" alt="" />
                  <div v-else class="topic-cover-placeholder">
                    <el-icon :size="32"><Picture /></el-icon>
                  </div>
                  <div class="topic-info">
                    <h4 class="topic-name">{{ t.topicName }}</h4>
                    <p class="topic-desc">{{ t.description || '暂无描述' }}</p>
                    <span class="topic-count">{{ t.videoCount || 0 }}个视频</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="未找到相关专题" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <div v-if="!keyword" class="empty-keyword">
        <el-empty description="请输入关键词搜索" :image-size="100" />
      </div>

      <div v-if="activeTab === 'course' && total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Video } from '@/types'
import { get, post, del } from '@/utils/request'
import { Search, Clock, Picture } from '@element-plus/icons-vue'

definePageMeta({
  layout: 'default'
})

const route = useRoute()
const userStore = useUserStore()
const keyword = computed(() => route.query.keyword as string || '')
const searchInput = ref(route.query.keyword as string || '')

const activeTab = ref('course')
const loading = ref(false)
const courseList = ref<Video[]>([])
const videoList = ref<Video[]>([])
const appStore = useAppStore()
const hotSearches = ref<any[]>([])
const hotSearchEnabled = computed(() => appStore.siteConfig?.hotSearchEnable !== false)
const suggestions = ref<string[]>([])
const searchHistory = ref<any[]>([])
const total = ref(0)

// 试题搜索
const questionLoading = ref(false)
const questionList = ref<any[]>([])

// 专题搜索
const topicLoading = ref(false)
const topicList = ref<any[]>([])

const queryParams = reactive({
  pageNum: 1,
  pageSize: 12,
  videoName: ''
})

// 搜索建议（防抖）
let suggestTimer: ReturnType<typeof setTimeout> | null = null
watch(searchInput, (val) => {
  if (suggestTimer) clearTimeout(suggestTimer)
  if (!val.trim() || keyword.value) { suggestions.value = []; return }
  suggestTimer = setTimeout(async () => {
    try {
      const res: any = await get('/search/suggest', { keyword: val })
      suggestions.value = res?.data || []
    } catch { suggestions.value = [] }
  }, 300)
})

async function fetchHotSearches() {
  try {
    const res: any = await get('/search/hot')
    hotSearches.value = res?.data || []
  } catch { hotSearches.value = [] }
}

async function fetchSearchHistory() {
  if (!userStore.isLoggedIn) return
  try {
    const res: any = await get('/search/history')
    searchHistory.value = res?.data || []
  } catch { searchHistory.value = [] }
}

async function clearHistory() {
  try {
    await del('/search/history')
    searchHistory.value = []
  } catch { /* ignore */ }
}

async function fetchCourseList() {
  if (!keyword.value) return
  loading.value = true
  try {
    queryParams.videoName = keyword.value
    const { pageNum, pageSize, ...body } = queryParams
    const res: any = await post('/vodCourse/search', body, { params: { pageNum, pageSize } })
    courseList.value = res?.rows || []
    total.value = res?.total || 0

    post('/search/record', { keyword: keyword.value, searchType: 'course' }).catch(() => {})
  } catch {
    courseList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function doSearch() {
  const kw = searchInput.value.trim()
  if (!kw) return
  suggestions.value = []
  navigateTo({ path: '/search', query: { keyword: kw } })
}

function doSearchWith(kw: string) {
  searchInput.value = kw
  suggestions.value = []
  navigateTo({ path: '/search', query: { keyword: kw } })
}

function handleHotSearch(kw: string) {
  navigateTo({ path: '/search', query: { keyword: kw } })
}

function getTagColor(index: number): string {
  const colors = ['', '#f56c6c', '#e6a23c', '#409eff', '#67c23a']
  return colors[index % colors.length] || ''
}

function handleTabChange(tab: any) {
  if (tab === 'course' && courseList.value.length === 0) fetchCourseList()
  else if (tab === 'question' && questionList.value.length === 0) fetchQuestionList()
  else if (tab === 'topic' && topicList.value.length === 0) fetchTopicList()
}

// 试题搜索
async function fetchQuestionList() {
  if (!keyword.value) return
  questionLoading.value = true
  try {
    const res: any = await get('/user/question/list', {
      pageNum: 1,
      pageSize: 20,
      keyword: keyword.value
    })
    questionList.value = res?.rows || []
  } catch {
    questionList.value = []
  } finally {
    questionLoading.value = false
  }
}

function questionTypeLabel(type: number): string {
  const labels: Record<number, string> = {
    1: '单选题', 2: '多选题', 3: '填空题', 4: '判断题',
    5: '简答题', 6: '计算题', 7: '证明题', 8: '应用题'
  }
  return labels[type] || '其他'
}

function questionTypeTag(type: number): '' | 'success' | 'warning' | 'info' {
  const map: Record<number, '' | 'success' | 'warning' | 'info'> = {
    1: '', 2: 'success', 3: 'warning', 4: 'info',
    5: 'warning', 6: '', 7: 'info', 8: 'success'
  }
  return map[type] || 'info'
}

function goQuestion(id: number) {
  navigateTo(`/questions/${id}`)
}

// 专题搜索
async function fetchTopicList() {
  if (!keyword.value) return
  topicLoading.value = true
  try {
    const res: any = await get('/topic/search', { keyword: keyword.value })
    topicList.value = res?.rows || res?.data || []
  } catch {
    topicList.value = []
  } finally {
    topicLoading.value = false
  }
}

function goTopic(id: number) {
  navigateTo(`/topics/${id}`)
}

function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.pageNum = 1; fetchCourseList() }
function handleCurrentChange(page: number) { queryParams.pageNum = page; fetchCourseList() }

watch(() => route.query.keyword, () => {
  if (keyword.value) {
    searchInput.value = keyword.value
    courseList.value = []
    videoList.value = []
    questionList.value = []
    topicList.value = []
    queryParams.pageNum = 1
    fetchCourseList()
  }
}, { immediate: true })

onMounted(() => {
  fetchHotSearches()
  fetchSearchHistory()
})

useSeoMeta({
  title: () => keyword.value ? `${keyword.value} - 搜索结果 - 教育云平台` : '搜索 - 教育云平台',
  description: '搜索课程、视频、试题等学习资源'
})
</script>

<style scoped>
.search-page {
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

.search-input-bar {
  margin-bottom: 20px;
  max-width: 600px;
}

.suggestions {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  margin-top: -12px;
  margin-bottom: 20px;
  max-width: 600px;
  overflow: hidden;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f0f2ff;
  color: #667eea;
}

.hot-search-section {
  margin-bottom: 20px;
}

.search-history-section {
  margin-bottom: 20px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.hot-tags,
.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag,
.history-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.hot-tag:hover,
.history-tag:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.search-tabs {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
}

.result-content {
  min-height: 400px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.empty-keyword {
  padding: 60px 0;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.question-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.question-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.question-rate {
  font-size: 13px;
  color: #67c23a;
  margin-left: auto;
}

.question-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.topic-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.topic-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.topic-cover {
  width: 100%;
  height: 140px;
  object-fit: cover;
}

.topic-cover-placeholder {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #c0c4cc;
}

.topic-info {
  padding: 12px 16px;
}

.topic-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 6px;
}

.topic-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.topic-count {
  font-size: 12px;
  color: #409eff;
}

@media (max-width: 768px) {
  .topic-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>
