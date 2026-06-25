<template>
  <div class="question-center-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">试题中心</h1>
        <p class="page-desc">
          <template v-if="userStore.isTeacher">管理试题、组卷、了解学生知识点掌握情况</template>
          <template v-else-if="userStore.isStudent">练习试题、组题自测、错题回顾、查看知识点掌握</template>
          <template v-else>海量试题，精准练习</template>
        </p>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="question-tabs">
        <!-- 全部试题 -->
        <el-tab-pane label="全部试题" name="all">
          <div class="filter-section">
            <el-form :model="queryParams" inline class="filter-form">
              <el-form-item label="题型">
                <el-select v-model="queryParams.questionType" placeholder="全部题型" clearable @change="handleFilterChange">
                  <el-option label="单选题" :value="1" />
                  <el-option label="多选题" :value="2" />
                  <el-option label="判断题" :value="3" />
                  <el-option label="填空题" :value="4" />
                  <el-option label="简答题" :value="5" />
                </el-select>
              </el-form-item>
              <el-form-item label="难度">
                <el-select v-model="queryParams.difficulty" placeholder="全部难度" clearable @change="handleFilterChange">
                  <el-option label="非常简单" :value="1" />
                  <el-option label="简单" :value="2" />
                  <el-option label="中等" :value="3" />
                  <el-option label="困难" :value="4" />
                  <el-option label="非常困难" :value="5" />
                </el-select>
              </el-form-item>
              <el-form-item label="年级">
                <el-select v-model="queryParams.gradeId" placeholder="全部年级" clearable @change="handleFilterChange">
                  <el-option label="高一" :value="1" />
                  <el-option label="高二" :value="2" />
                  <el-option label="高三" :value="3" />
                </el-select>
              </el-form-item>
              <el-form-item label="学科">
                <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable @change="handleFilterChange">
                  <el-option label="语文" :value="1" />
                  <el-option label="数学" :value="2" />
                  <el-option label="英语" :value="3" />
                  <el-option label="物理" :value="4" />
                  <el-option label="化学" :value="5" />
                  <el-option label="生物" :value="6" />
                </el-select>
              </el-form-item>
              <el-form-item label="搜索">
                <el-input v-model="queryParams.keyword" placeholder="搜索试题内容" clearable @keyup.enter="handleFilterChange" @clear="handleFilterChange">
                  <template #suffix><el-icon @click="handleFilterChange"><Search /></el-icon></template>
                </el-input>
              </el-form-item>
            </el-form>
          </div>

          <div class="action-bar">
            <el-button v-if="userStore.isTeacher || userStore.isStudent" type="success" @click="goCreatePaper">
              <el-icon><Document /></el-icon>
              {{ userStore.isTeacher ? '组卷' : '组题练习' }}
            </el-button>
            <el-button v-if="userStore.isStudent" type="primary" @click="goPractice">
              <el-icon><Edit /></el-icon>
              智能练习
            </el-button>
          </div>

          <div v-loading="loading" class="question-list">
            <div v-if="questionList.length > 0" class="question-items">
              <div v-for="q in questionList" :key="q.questionId" class="question-item" @click="router.push(`/questions/${q.questionId}`)">
                <div class="question-header">
                  <span class="question-type" :class="`type-${q.questionType}`">{{ getQuestionTypeText(q.questionType) }}</span>
                  <el-rate :model-value="q.difficulty" :max="5" disabled size="small" />
                </div>
                <div class="question-content" v-html="q.questionCode || q.questionContentText" />
                <div class="question-footer">
                  <div class="question-meta">
                    <span v-if="q.knowledgeNames"><el-icon><CollectionTag /></el-icon>{{ q.knowledgeNames }}</span>
                    <span v-if="q.correctRate !== undefined"><el-icon><TrendCharts /></el-icon>正确率: {{ q.correctRate }}%</span>
                  </div>
                  <el-button type="primary" link>查看详情</el-button>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无试题数据" />
          </div>

          <div v-if="total > 0" class="pagination-wrapper">
            <el-pagination
              v-model:current-page="queryParams.pageNum" v-model:page-size="queryParams.pageSize"
              :total="total" :page-sizes="[10, 20, 30, 50]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange" @current-change="handleCurrentChange"
            />
          </div>
        </el-tab-pane>

        <!-- 试卷中心 -->
        <el-tab-pane label="试卷中心" name="paper">
          <div class="tab-content">
            <iframe src="/papers" class="embedded-frame" />
          </div>
        </el-tab-pane>

        <!-- 错题本（仅学生） -->
        <el-tab-pane v-if="userStore.isStudent" label="错题本" name="wrong">
          <div class="redirect-card">
            <div class="redirect-info">
              <h3 class="redirect-title">错题本</h3>
              <p class="redirect-desc">查看你的错题记录，针对性复习薄弱知识点，提升学习效率</p>
            </div>
            <el-button type="primary" @click="navigateTo('/student/wrong')">前往查看</el-button>
          </div>
        </el-tab-pane>

        <!-- 我的收藏 -->
        <el-tab-pane v-if="userStore.isStudent" label="我的收藏" name="collect">
          <div class="redirect-card">
            <div class="redirect-info">
              <h3 class="redirect-title">我的收藏</h3>
              <p class="redirect-desc">管理你收藏的试题与资源，随时回顾重点内容</p>
            </div>
            <el-button type="primary" @click="navigateTo('/student/collect')">前往查看</el-button>
          </div>
        </el-tab-pane>

        <!-- 知识点掌握 -->
        <el-tab-pane v-if="userStore.isLoggedIn" label="知识点掌握" name="mastery">
          <div class="redirect-card">
            <div class="redirect-info">
              <h3 class="redirect-title">知识点掌握</h3>
              <p class="redirect-desc">查看各知识点的掌握情况与学习进度，精准定位薄弱环节</p>
            </div>
            <el-button type="primary" @click="navigateTo(userStore.isStudent ? '/student/mastery' : '/teacher/knowledge-report')">前往查看</el-button>
          </div>
        </el-tab-pane>

        <!-- 智能推荐 -->
        <el-tab-pane v-if="userStore.isStudent" label="智能推荐" name="recommend">
          <div class="redirect-card">
            <div class="redirect-info">
              <h3 class="redirect-title">智能推荐</h3>
              <p class="redirect-desc">基于你的学习情况智能推荐试题与资源，高效提升</p>
            </div>
            <el-button type="primary" @click="navigateTo('/student/recommend')">前往查看</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Edit, Document, CollectionTag, TrendCharts } from '@element-plus/icons-vue'
import type { Question, QuestionQuery, PageResult } from '@/types'
import { useQuestionApi } from '@/composables/useQuestionApi'

definePageMeta({
  layout: 'default'
})

const router = useRouter()
const userStore = useUserStore()
const { getQuestionList } = useQuestionApi()

const activeTab = ref('all')
const loading = ref(false)
const questionList = ref<Question[]>([])
const total = ref(0)

const queryParams = reactive<QuestionQuery>({
  pageNum: 1, pageSize: 10,
  questionType: undefined, difficulty: undefined,
  gradeId: undefined, subjectId: undefined, keyword: ''
})

async function fetchQuestionList() {
  if (activeTab.value !== 'all') return
  loading.value = true
  try {
    const result: PageResult<Question> = await getQuestionList(queryParams)
    questionList.value = result.rows
    total.value = result.total
  } catch {
    questionList.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handleFilterChange() { queryParams.pageNum = 1; fetchQuestionList() }
function handleSizeChange(size: number) { queryParams.pageSize = size; queryParams.pageNum = 1; fetchQuestionList() }
function handleCurrentChange(page: number) { queryParams.pageNum = page; fetchQuestionList() }
function getQuestionTypeText(type: number): string {
  return ({ 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题' } as Record<number, string>)[type] || '未知'
}

function handleTabChange(tab: any) {
  if (tab === 'all') fetchQuestionList()
}

function goCreatePaper() {
  if (userStore.isTeacher) {
    router.push('/papers')
  } else {
    router.push('/student/self-practice')
  }
}

function goPractice() {
  router.push('/student/practice')
}

onMounted(() => { fetchQuestionList() })

useSeoMeta({
  title: '试题中心 - 教育云平台',
  description: '海量试题，精准练习'
})
</script>

<style scoped>
.question-center-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
}

.page-header {
  margin-bottom: 20px;
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

.question-tabs {
  margin-top: 8px;
}

.filter-section {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.action-bar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.question-list {
  min-height: 400px;
}

.question-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-item {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid var(--border-color);
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-item .question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.question-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.question-type.type-1 { background: #e6f7ff; color: #1890ff; }
.question-type.type-2 { background: #fff7e6; color: #fa8c16; }
.question-type.type-3 { background: #f6ffed; color: #52c41a; }
.question-type.type-4 { background: #fff0f6; color: #eb2f96; }
.question-type.type-5 { background: #f9f0ff; color: #722ed1; }

.question-item .question-content {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 12px;
}

.question-item .question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.question-item .question-meta {
  display: flex;
  gap: 16px;
}

.question-item .question-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.tab-content {
  min-height: 500px;
}

.embedded-frame {
  width: 100%;
  height: 600px;
  border: none;
  border-radius: 8px;
}

.redirect-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32px;
  background: var(--bg-color);
  border-radius: 8px;
  min-height: 200px;
}

.redirect-info {
  flex: 1;
}

.redirect-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px;
}

.redirect-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
}

.pagination-wrapper {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

@media (max-width: 768px) {
  .filter-form {
    flex-direction: column;
  }
  .filter-form :deep(.el-form-item) {
    width: 100%;
  }
  .filter-form :deep(.el-select),
  .filter-form :deep(.el-input) {
    width: 100%;
  }
  .embedded-frame {
    height: 400px;
  }
}
</style>
