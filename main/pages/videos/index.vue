<template>
  <div class="video-list-page">
    <div class="page-banner">
      <div class="container">
        <h1 class="page-title">课程中心</h1>
        <p class="page-desc">精选优质课程，涵盖 AI 大模型、云计算、大数据等前沿技术</p>
      </div>
    </div>
    
    <div class="container main-content">
      <div class="content-layout">
        <!-- 左侧学科分类树 -->
        <aside class="category-sidebar">
          <h3 class="sidebar-title">学科分类</h3>
          <div v-loading="treeLoading" class="category-tree">
            <div v-if="categoryTree.length > 0" class="tree-list">
              <div
                v-for="stage in categoryTree"
                :key="'stage-' + stage.id"
                class="tree-node"
              >
                <div
                  class="tree-node-label stage-label"
                  :class="{ active: selectedStageId === stage.id }"
                  @click="selectStage(stage.id)"
                >
                  <el-icon><Folder /></el-icon>
                  <span>{{ stage.name }}</span>
                </div>
                <div v-if="selectedStageId === stage.id && stage.children.length > 0" class="tree-children">
                  <div
                    v-for="subject in stage.children"
                    :key="'subject-' + subject.id"
                    class="tree-node-label subject-label"
                    :class="{ active: queryParams.subjectId === subject.id }"
                    @click="selectSubject(subject.id)"
                  >
                    <span>{{ subject.name }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else-if="!treeLoading" description="暂无分类数据" :image-size="40" />
          </div>
        </aside>

        <!-- 右侧内容区 -->
        <div class="content-area">
          <div class="filter-section">
            <CourseFilter ref="courseFilterRef" @change="handleFilterChange" />
          </div>

          <div class="sort-section">
            <div class="sort-tabs">
              <span
                :class="['sort-tab', { active: sortType === 'new' }]"
                @click="sortType = 'new'; fetchVideoList()"
              >
                近期上新
              </span>
              <span
                :class="['sort-tab', { active: sortType === 'hot' }]"
                @click="sortType = 'hot'; fetchVideoList()"
              >
                学习人数
              </span>
              <span
                :class="['sort-tab', { active: sortType === 'price' }]"
                @click="sortType = 'price'; fetchVideoList()"
              >
                价格
              </span>
            </div>
            <div class="result-count">共 {{ total }} 门课程</div>
          </div>

          <div v-loading="loading" class="video-list">
            <div v-if="videoList.length > 0" class="video-grid">
              <VideoCard
                v-for="video in videoList"
                :key="video.videoId"
                :video="video"
                :show-progress="userStore.isStudent"
              />
            </div>
            <el-empty v-else description="暂无课程数据" />
          </div>

          <div v-if="total > 0" class="pagination-wrapper">
            <div class="pagination">
              <span class="pagination-info">共 {{ total }} 条记录</span>
              <el-pagination
                v-model:current-page="queryParams.pageNum"
                v-model:page-size="queryParams.pageSize"
                :total="total"
                :page-sizes="[12, 24, 36, 48]"
                layout="sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
              <span class="pagination-info">
                第 {{ queryParams.pageNum }} 页 / 共 {{ Math.ceil(total / (queryParams.pageSize ?? 12)) }} 页
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Folder } from '@element-plus/icons-vue'
import type { Video, VideoQuery, PageResult } from '@/types'
import { useVideoApi } from '@/composables/useVideoApi'
import { get } from '@/utils/request'
import CourseFilter from '@/components/common/CourseFilter.vue'

definePageMeta({
  layout: 'default'
})

const userStore = useUserStore()
const { getVideoList } = useVideoApi()

const loading = ref(false)
const videoList = ref<Video[]>([])
const total = ref(0)
const courseFilterRef = ref<InstanceType<typeof CourseFilter>>()
const sortType = ref<'new' | 'hot' | 'price'>('new')

// 分类树
const treeLoading = ref(false)
const selectedStageId = ref<number | null>(null)
interface CategoryNode { id: number; name: string; children: { id: number; name: string }[] }
const categoryTree = ref<CategoryNode[]>([])

async function fetchCategoryTree() {
  treeLoading.value = true
  try {
    const res: any = await get('/vodCourse/category/tree')
    categoryTree.value = res?.data || []
    if (categoryTree.value.length > 0) {
      selectedStageId.value = categoryTree.value[0].id
    }
  } catch { categoryTree.value = [] } finally { treeLoading.value = false }
}

function selectStage(stageId: number) {
  if (selectedStageId.value === stageId) {
    selectedStageId.value = null
  } else {
    selectedStageId.value = stageId
  }
}

function selectSubject(subjectId: number) {
  queryParams.subjectId = subjectId
  queryParams.pageNum = 1
  fetchVideoList()
}

const queryParams = reactive<VideoQuery>({
  pageNum: 1,
  pageSize: 12,
  videoName: '',
  gradeId: undefined,
  subjectId: undefined,
  videoType: undefined,
  versionId: undefined,
  volumeId: undefined,
  orderBy: ''
})

async function fetchVideoList() {
  loading.value = true
  try {
    // 根据排序类型设置排序字段
    queryParams.orderBy = sortType.value === 'new' ? 'create_time' 
      : sortType.value === 'hot' ? 'view_count' 
      : sortType.value === 'price' ? 'price' : ''
    
    const result: PageResult<Video> = await getVideoList(queryParams)
    videoList.value = result?.rows || []
    total.value = result?.total || 0
  } catch (error) {
    console.error('Failed to fetch video list:', error)
    videoList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleFilterChange(values: {
  stageId?: number
  subjectId?: number
  versionId?: number
  volumeId?: number
  videoType?: number
}) {
  queryParams.subjectId = values.subjectId
  queryParams.videoType = values.videoType
  queryParams.versionId = values.versionId
  queryParams.volumeId = values.volumeId
  queryParams.pageNum = 1
  fetchVideoList()
}

function handleSizeChange(size: number) {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  fetchVideoList()
}

function handleCurrentChange(page: number) {
  queryParams.pageNum = page
  fetchVideoList()
}

onMounted(() => {
  fetchVideoList()
  fetchCategoryTree()
})

useSeoMeta({
  title: '课程中心 - 教育云平台',
  description: '精选优质课程，助你学习成长'
})
</script>

<style scoped>
.video-list-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  background: var(--bg-page);
}

.page-banner {
  background: linear-gradient(135deg, var(--primary-color) 0%, #14b8a6 100%);
  padding: 40px 0;
  margin-bottom: 20px;
}

.page-banner .page-title {
  font-size: 28px;
  font-weight: 600;
  color: #fff;
  margin: 0 0 8px;
}

.page-banner .page-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.main-content {
  background: #fff;
  border-radius: var(--border-radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-xs);
}

.content-layout {
  display: flex;
  gap: 20px;
}

.category-sidebar {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-light);
  padding-right: 16px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.category-tree {
  min-height: 100px;
}

.tree-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tree-node-label:hover {
  background: var(--bg-light);
  color: var(--text-primary);
}

.tree-node-label.active {
  background: var(--primary-50);
  color: var(--primary-color);
  font-weight: 500;
}

.stage-label {
  font-weight: 500;
}

.tree-children {
  padding-left: 16px;
  margin: 2px 0;
}

.subject-label {
  font-size: 12px;
  padding: 6px 10px;
}

.content-area {
  flex: 1;
  min-width: 0;
}

.filter-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
}

.sort-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.sort-tabs {
  display: flex;
  gap: 20px;
}

.sort-tab {
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 6px 0;
  position: relative;
  transition: all 0.15s ease;
  font-weight: 500;
}

.sort-tab:hover {
  color: var(--text-primary);
}

.sort-tab.active {
  color: var(--primary-color);
  font-weight: 600;
}

.sort-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
  border-radius: 1px;
}

.result-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.video-list {
  min-height: 300px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.pagination-wrapper {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  padding: 20px 0;
  border-top: 1px solid var(--border-light);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 14px;
}

.pagination-info {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.pagination :deep(.el-pagination) {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination :deep(.el-pager) {
  display: flex;
  gap: 4px;
}

.pagination :deep(.el-pager li) {
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #fff;
}

.pagination :deep(.el-pager li:hover) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.pagination :deep(.el-pager li.active) {
  background: var(--primary-color);
  color: #fff;
  border-color: transparent;
  font-weight: 500;
}

.pagination :deep(.btn-prev),
.pagination :deep(.btn-next) {
  min-width: 32px;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: #fff;
  padding: 0;
}

.pagination :deep(.btn-prev:hover),
.pagination :deep(.btn-next:hover) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.pagination :deep(.el-select) {
  width: 90px;
}

.pagination :deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  height: 32px;
}

/* 响应式 */
@media (max-width: 1280px) {
  .video-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1024px) {
  .video-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .sort-tabs {
    gap: 16px;
  }

  .content-layout {
    flex-direction: column;
  }

  .category-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
    padding-right: 0;
    padding-bottom: 12px;
  }

  .tree-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tree-children {
    padding-left: 0;
    margin: 0;
    display: contents;
  }
}

@media (max-width: 768px) {
  .page-banner {
    padding: 28px 0;
  }

  .page-banner .page-title {
    font-size: 22px;
  }

  .page-banner .page-desc {
    font-size: 13px;
  }

  .main-content {
    padding: 16px;
  }

  .video-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .sort-section {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .sort-tabs {
    gap: 12px;
  }

  .sort-tab {
    font-size: 12px;
  }

  .pagination {
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
  }

  .pagination-info {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr;
  }

  .category-sidebar {
    display: none;
  }
}
</style>
