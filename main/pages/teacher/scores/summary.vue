<template>
  <div class="semester-summary-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回成绩管理
        </el-button>
      </div>

      <div class="page-header">
        <h1 class="page-title">学期加权成绩汇总</h1>
        <div class="filter-bar">
          <el-select v-model="filter.yearId" placeholder="选择学年" style="width: 160px" @change="fetchSummary">
            <el-option v-for="y in yearOptions" :key="y.yearId" :label="y.yearName" :value="y.yearId" />
          </el-select>
          <el-select v-model="filter.semester" placeholder="选择学期" style="width: 120px" @change="fetchSummary">
            <el-option label="上学期" :value="1" />
            <el-option label="下学期" :value="2" />
          </el-select>
          <el-select v-model="filter.classId" placeholder="选择班级" style="width: 160px" clearable @change="fetchSummary">
            <el-option v-for="c in classOptions" :key="c.classId" :label="c.className" :value="c.classId" />
          </el-select>
          <el-button type="primary" @click="handleExport" :disabled="!summary?.records?.length">
            <el-icon><Download /></el-icon> 导出Excel
          </el-button>
        </div>
      </div>

      <div v-loading="loading">
        <!-- 汇总卡片 -->
        <div class="summary-cards" v-if="summary">
          <div class="summary-card">
            <span class="card-value">{{ summary.weightedAvg?.toFixed(2) }}</span>
            <span class="card-label">加权平均分</span>
          </div>
          <div class="summary-card">
            <span class="card-value">{{ summary.totalWeight?.toFixed(2) }}</span>
            <span class="card-label">总权重</span>
          </div>
          <div class="summary-card">
            <span class="card-value">{{ summary.records?.length || 0 }}</span>
            <span class="card-label">作业次数</span>
          </div>
          <div class="summary-card">
            <span class="card-value">{{ summary.studentCount }}</span>
            <span class="card-label">参与学生</span>
          </div>
        </div>

        <!-- 成绩明细表格 -->
        <el-card v-if="summary?.records?.length" class="table-card">
          <template #header>
            <span class="card-title">成绩明细</span>
          </template>
          <el-table :data="summary.records" stripe>
            <el-table-column prop="homeworkName" label="作业名称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="homeworkTypeName" label="类型" width="100" />
            <el-table-column prop="totalScore" label="满分" width="80" align="center" />
            <el-table-column prop="avgScore" label="平均分" width="80" align="center">
              <template #default="{ row }">
                <span :style="{ color: getScoreColor(row.avgScore, row.totalScore) }">
                  {{ row.avgScore?.toFixed(1) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="weight" label="权重" width="80" align="center">
              <template #default="{ row }">
                {{ row.weight?.toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="weightedScore" label="加权得分" width="100" align="center">
              <template #default="{ row }">
                <span class="weighted-score">{{ row.weightedScore?.toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
          </el-table>
        </el-card>

        <el-empty v-if="!loading && !summary?.records?.length" description="暂无成绩数据，请选择学年学期" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useScoreApi } from '@/composables/useScoreApi'
import type { SemesterSummaryResult } from '@/composables/useScoreApi'
import { useExport } from '@/composables/useExport'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const { getTeacherClasses, getSemesterSummary } = useScoreApi()
const { exportToExcel } = useExport()

const loading = ref(false)
const summary = ref<SemesterSummaryResult | null>(null)
const classOptions = ref<{ classId: number; className: string }[]>([])
const yearOptions = ref<{ yearId: number; yearName: string }[]>([])

const filter = ref({
  yearId: undefined as number | undefined,
  semester: 1,
  classId: undefined as number | undefined
})

function getScoreColor(score: number, total: number): string {
  if (!total) return ''
  const rate = (score / total) * 100
  if (rate >= 85) return '#67C23A'
  if (rate >= 70) return '#409EFF'
  if (rate >= 60) return '#E6A23C'
  return '#F56C6C'
}

async function fetchClasses() {
  try {
    classOptions.value = await getTeacherClasses()
  } catch (e) {
    console.error('获取班级列表失败:', e)
  }
}

async function fetchSummary() {
  if (!filter.value.yearId) return
  loading.value = true
  try {
    summary.value = await getSemesterSummary({
      yearId: filter.value.yearId,
      semester: filter.value.semester,
      classId: filter.value.classId
    })
  } catch (e) {
    console.error('获取学期汇总失败:', e)
    ElMessage.error('获取学期汇总数据失败')
  } finally {
    loading.value = false
  }
}

function handleExport() {
  if (!summary.value?.records?.length) return
  const columns = [
    { key: 'homeworkName', label: '作业名称' },
    { key: 'homeworkTypeName', label: '类型' },
    { key: 'totalScore', label: '满分' },
    { key: 'avgScore', label: '平均分', render: (row: any) => row.avgScore?.toFixed(1) },
    { key: 'weight', label: '权重', render: (row: any) => row.weight?.toFixed(2) },
    { key: 'weightedScore', label: '加权得分', render: (row: any) => row.weightedScore?.toFixed(2) },
    { key: 'createTime', label: '创建时间' }
  ]
  const fileName = `学期成绩汇总_${summary.value.yearName}_${summary.value.semester === 1 ? '上' : '下'}学期`
  exportToExcel(summary.value.records, columns, fileName)
  ElMessage.success('导出成功')
}

onMounted(async () => {
  // 生成近3个学年选项
  const currentYear = new Date().getFullYear()
  for (let i = 0; i < 3; i++) {
    const y = currentYear - i
    yearOptions.value.push({
      yearId: y,
      yearName: `${y}-${y + 1}`
    })
  }
  filter.value.yearId = yearOptions.value[0]?.yearId

  await fetchClasses()
  await fetchSummary()
})

useSeoMeta({
  title: '学期加权成绩汇总 - 教育云平台',
  description: '学期加权成绩汇总'
})
</script>

<style scoped>
.semester-summary-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.back-bar {
  margin-bottom: 12px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1.2;
}

.card-label {
  display: block;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.table-card {
  margin-bottom: 24px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.weighted-score {
  font-weight: 600;
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
