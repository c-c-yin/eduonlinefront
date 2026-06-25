<template>
  <div class="profile-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">学生画像</h1>
        <p class="page-desc">查看所教班级学生的综合画像和学习行为分析</p>
      </div>

      <!-- Class selector -->
      <div class="filter-bar">
        <el-select v-model="selectedClassId" placeholder="选择班级" style="width: 200px" @change="onClassChange">
          <el-option v-for="c in classes" :key="c.classId" :label="`${c.className}（${c.studentCount}人，均分${c.avgOverallScore}）`" :value="c.classId" />
        </el-select>
      </div>

      <div v-if="!selectedClassId" class="empty-state">
        <el-empty description="请选择班级查看学生画像" />
      </div>

      <div v-else>
        <!-- Student cards -->
        <div v-loading="loading" class="student-grid">
          <div v-for="student in studentList" :key="student.studentId" class="student-card" @click="goDetail(student.studentId)">
            <div class="card-header">
              <div class="avatar">{{ student.studentName?.charAt(0) }}</div>
              <div class="student-info">
                <span class="student-name">{{ student.studentName }}</span>
                <span class="student-no">{{ student.studentNo }}</span>
              </div>
              <div class="score-badge" :style="{ background: getScoreColor(student.overallScore) }">
                {{ student.overallScore }}
              </div>
            </div>
            <div class="card-tags" v-if="student.labels && student.labels.length > 0">
              <el-tag v-for="label in student.labels" :key="label" size="small" type="info">{{ label }}</el-tag>
            </div>
            <div class="card-trend">
              <el-icon v-if="student.trend === 'up'" color="#43e97b"><CaretTop /></el-icon>
              <el-icon v-else-if="student.trend === 'down'" color="#f56c6c"><CaretBottom /></el-icon>
              <el-icon v-else color="#909399"><Minus /></el-icon>
              <span>趋势</span>
            </div>
          </div>
        </div>
        <el-empty v-if="!loading && studentList.length === 0" description="暂无学生画像数据" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CaretTop, CaretBottom, Minus } from '@element-plus/icons-vue'
import { useProfileApi, type StudentProfileSummary, type ClassProfileOverview } from '@/composables/useProfileApi'
import { useScoreApi } from '@/composables/useScoreApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const { getClassOverview, getClassProfiles } = useProfileApi()
const { getTeacherClasses } = useScoreApi()

const classes = ref<ClassProfileOverview[]>([])
const selectedClassId = ref<number | null>(null)
const studentList = ref<StudentProfileSummary[]>([])
const loading = ref(false)

function getScoreColor(score: number): string {
  if (score >= 90) return '#43e97b'
  if (score >= 80) return '#4facfe'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

async function fetchClasses() {
  try {
    classes.value = await getClassOverview()
    if (classes.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classes.value[0].classId
      await fetchStudents()
    }
  } catch {
    // 降级：使用 getTeacherClasses 获取班级列表
    try {
      const basicClasses = await getTeacherClasses()
      classes.value = basicClasses.map(c => ({
        classId: c.classId,
        className: c.className,
        studentCount: 0,
        avgOverallScore: 0
      }))
      if (classes.value.length > 0 && !selectedClassId.value) {
        selectedClassId.value = classes.value[0].classId
        await fetchStudents()
      }
    } catch {
      classes.value = []
    }
  }
}

async function fetchStudents() {
  if (!selectedClassId.value) return
  loading.value = true
  try {
    studentList.value = await getClassProfiles(selectedClassId.value)
  } catch {
    studentList.value = []
  } finally {
    loading.value = false
  }
}

function onClassChange() {
  fetchStudents()
}

function goDetail(studentId: number) {
  router.push(`/teacher/profile/student/${studentId}`)
}

onMounted(() => {
  fetchClasses()
})

useSeoMeta({
  title: '学生画像 - 教育云平台'
})
</script>

<style scoped>
.profile-list-page {
  background: #f7f8fa;
  min-height: 100vh;
  padding-bottom: 48px;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px 0;
}

.page-header {
  margin-bottom: 24px;
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
  margin-bottom: 20px;
}

.student-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.student-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
}

.student-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.student-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.student-no {
  font-size: 12px;
  color: #909399;
}

.score-badge {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  flex-shrink: 0;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.card-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;
}

.empty-state {
  padding: 80px 0;
}

@media (max-width: 768px) {
  .container {
    padding: 16px 12px 0;
  }

  .student-grid {
    grid-template-columns: 1fr;
  }
}
</style>