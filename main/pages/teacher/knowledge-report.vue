<template>
  <div class="knowledge-report-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">知识点掌握报告</h1>
        <p class="page-desc">查看任教班级学生知识点掌握情况，定位共性薄弱点</p>
      </div>

      <!-- 班级选择 -->
      <div class="filter-bar">
        <el-select v-model="selectedClassId" placeholder="选择班级" style="width: 200px" @change="onClassChange">
          <el-option v-for="c in classesOverview" :key="c.classId" :label="`${c.className} (${c.subjectName})`" :value="c.classId" />
        </el-select>
        <span v-if="selectedClassId && classesOverview.length" class="overview-rate">
          全班掌握率：<strong>{{ currentClassRate }}%</strong>
        </span>
      </div>

      <div v-if="!selectedClassId" class="empty-state">
        <el-empty description="请选择班级查看知识点掌握报告" />
      </div>

      <div v-else class="report-content">
        <!-- 知识点掌握热力图 -->
        <div class="panel">
          <h3 class="panel-title">全班知识点掌握概览</h3>
          <div v-if="report?.knowledgeList && report.knowledgeList.length > 0" class="knowledge-grid">
            <div
              v-for="k in report.knowledgeList"
              :key="k.knowledgeId"
              class="knowledge-card"
              :class="{ 'is-weak': k.masteryRate < 60 }"
            >
              <div class="know-header">
                <span class="know-name">{{ k.knowledgeName }}</span>
                <span class="know-rate">{{ k.masteryRate }}%</span>
              </div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: k.masteryRate + '%', background: getGradientColor(k.masteryRate) }"
                ></div>
              </div>
              <div class="know-stats">
                <span>{{ k.correctCount }}/{{ k.totalCount }} 正确</span>
                <span>{{ k.studentCount }} 人参与</span>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无知识点数据" :image-size="60" />
        </div>

        <!-- 学生个体明细 -->
        <div class="panel">
          <h3 class="panel-title">学生个体掌握明细</h3>
          <div v-if="studentList.length > 0" class="student-table-wrapper">
            <el-table :data="studentList" border stripe max-height="400" class="student-table">
              <el-table-column prop="studentName" label="姓名" width="100" fixed="left" />
              <el-table-column prop="studentNo" label="学号" width="100" fixed="left" />
              <el-table-column
                v-for="k in report?.knowledgeList?.slice(0, 8) || []"
                :key="k.knowledgeId"
                :label="k.knowledgeName"
                :min-width="100"
                align="center"
              >
                <template #default="{ row }">
                  <span
                    :style="{ color: getRateColor(getStudentKnowledgeRate(row, k.knowledgeId)) }"
                    class="cell-rate"
                  >
                    {{ getStudentKnowledgeRate(row, k.knowledgeId) }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <el-empty v-else description="暂无学生数据" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useKnowledgeApi, type ClassKnowledgeReport, type StudentKnowledgeDetail } from '@/composables/useKnowledgeApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const { getClassKnowledgeReport, getClassStudentKnowledge, getTeacherClassesOverview } = useKnowledgeApi()

const classesOverview = ref<{ classId: number; className: string; subjectName: string; masteryRate: number }[]>([])
const selectedClassId = ref<number | null>(null)
const report = ref<ClassKnowledgeReport | null>(null)
const studentList = ref<StudentKnowledgeDetail[]>([])
const loading = ref(false)

const currentClassRate = computed(() => {
  const cls = classesOverview.value.find(c => c.classId === selectedClassId.value)
  return cls ? cls.masteryRate : '-'
})

async function fetchClassesOverview() {
  try {
    const data = await getTeacherClassesOverview()
    classesOverview.value = data
    if (data.length > 0) {
      selectedClassId.value = data[0].classId
      onClassChange(data[0].classId)
    }
  } catch {
    classesOverview.value = []
  }
}

async function onClassChange(classId: number) {
  loading.value = true
  try {
    const [reportData, studentData] = await Promise.all([
      getClassKnowledgeReport({ classId }),
      getClassStudentKnowledge({ classId })
    ])
    report.value = reportData
    studentList.value = studentData
  } catch {
    report.value = null
    studentList.value = []
  } finally {
    loading.value = false
  }
}

function getGradientColor(rate: number): string {
  if (rate >= 80) return 'linear-gradient(90deg, #43e97b, #38f9d7)'
  if (rate >= 60) return 'linear-gradient(90deg, #4facfe, #00f2fe)'
  if (rate >= 40) return 'linear-gradient(90deg, #e6a23c, #f0ad4e)'
  return 'linear-gradient(90deg, #f56c6c, #e74c3c)'
}

function getRateColor(rate: number): string {
  if (rate >= 80) return '#43e97b'
  if (rate >= 60) return '#4facfe'
  if (rate >= 40) return '#e6a23c'
  return '#f56c6c'
}

function getStudentKnowledgeRate(row: StudentKnowledgeDetail, knowledgeId: number): number {
  const k = row.knowledgeList?.find(k => k.knowledgeId === knowledgeId)
  return k ? k.masteryRate : 0
}

onMounted(() => {
  fetchClassesOverview()
})

useSeoMeta({
  title: '知识点掌握报告 - 教育云平台'
})
</script>

<style scoped>
.knowledge-report-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin: 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.overview-rate {
  font-size: 14px;
  color: #666;
}

.overview-rate strong {
  color: #667eea;
  font-size: 18px;
}

.empty-state {
  padding: 80px 0;
}

.panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.knowledge-card {
  padding: 16px;
  border-radius: 8px;
  background: #f7f8fa;
  transition: background 0.2s;
}

.knowledge-card.is-weak {
  background: #fef0f0;
}

.know-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.know-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.know-rate {
  font-size: 16px;
  font-weight: 700;
  color: #667eea;
}

.progress-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.know-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #999;
}

.student-table-wrapper {
  overflow-x: auto;
}

.student-table {
  font-size: 13px;
}

.cell-rate {
  font-weight: 600;
  font-size: 14px;
}

@media (max-width: 768px) {
  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}
</style>