<template>
  <div class="tier-stats-page">
    <div class="container">
      <div class="back-bar">
        <el-button text @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回作业详情
        </el-button>
      </div>

      <div v-loading="loading">
        <div class="page-header" v-if="homework">
          <h1 class="page-title">{{ homework.homeworkName }} - 分层统计</h1>
          <div class="page-tags">
            <el-tag type="warning" size="small">分层发布</el-tag>
            <el-tag size="small">{{ homework.subjectName || '-' }}</el-tag>
            <el-tag size="small" type="info">{{ homework.totalScore }}分</el-tag>
          </div>
        </div>

        <div v-if="tierScoreStats.length === 0" class="empty-state">
          <el-empty description="暂无分层统计数据，请先完成分层配置并录入成绩" />
        </div>

        <template v-else>
          <div class="stats-overview">
            <div class="stat-card" v-for="tier in tierScoreStats" :key="tier.tierId">
              <div class="stat-header">
                <el-tag :type="tierTagType(tier.tierId)" size="large">{{ tier.tierLabel }}</el-tag>
                <span class="stat-count">{{ tier.studentCount }}人</span>
              </div>
              <div class="stat-body">
                <div class="stat-item">
                  <span class="stat-label">已评分</span>
                  <span class="stat-value">{{ tier.scoredCount || 0 }}人</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">平均分</span>
                  <span class="stat-value highlight">{{ tier.avgScore || '-' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">得分率</span>
                  <span class="stat-value">{{ tier.scoreRate ? tier.scoreRate + '%' : '-' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">及格率</span>
                  <span class="stat-value" :class="{ 'text-success': Number(tier.passRate) >= 60, 'text-danger': Number(tier.passRate) < 60 }">
                    {{ tier.passRate ? tier.passRate + '%' : '-' }}
                  </span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">最高/最低</span>
                  <span class="stat-value">{{ tier.maxScore || '-' }} / {{ tier.minScore || '-' }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-section">
            <h3 class="section-title">各层平均分对比</h3>
            <div class="bar-chart">
              <div class="bar-row" v-for="tier in tierScoreStats" :key="'bar-' + tier.tierId">
                <div class="bar-label">{{ tier.tierLabel }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: barWidth(tier.scoreRate), backgroundColor: tierColor(tier.tierId) }"
                  >
                    <span class="bar-text" v-if="tier.scoreRate">{{ tier.avgScore }}分 ({{ tier.scoreRate }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-section">
            <h3 class="section-title">各层及格率对比</h3>
            <div class="bar-chart">
              <div class="bar-row" v-for="tier in tierScoreStats" :key="'pass-' + tier.tierId">
                <div class="bar-label">{{ tier.tierLabel }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: (tier.passRate || 0) + '%', backgroundColor: Number(tier.passRate) >= 60 ? '#67c23a' : '#f56c6c' }"
                  >
                    <span class="bar-text" v-if="tier.passRate">{{ tier.passRate }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="chart-section" v-if="knowledgeMatrix.length > 0">
            <h3 class="section-title">各层知识点得分率对比</h3>
            <div class="knowledge-table-wrap">
              <el-table :data="knowledgeMatrix" border stripe style="width:100%">
                <el-table-column label="知识点" prop="knowledgeName" min-width="140" fixed />
                <el-table-column label="满分" prop="knowledgeTotal" width="80" align="center" />
                <el-table-column
                  v-for="tier in tierScoreStats"
                  :key="'kcol-' + tier.tierId"
                  :label="tier.tierLabel"
                  width="140"
                  align="center"
                >
                  <template #default="{ row }">
                    <span :class="scoreRateClass(row['rate_' + tier.tierId])">
                      {{ row['rate_' + tier.tierId] != null ? row['rate_' + tier.tierId] + '%' : '-' }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <div class="chart-section">
            <h3 class="section-title">分层学生明细</h3>
            <div v-for="tier in tierGroups" :key="'detail-' + tier.tierId" class="tier-detail-group">
              <div class="tier-detail-header">
                <el-tag :type="tierTagType(tier.tierId)">{{ tier.tierLabel }}</el-tag>
                <span class="tier-detail-count">{{ (tier.students || []).length }}人</span>
              </div>
              <el-table :data="tier.students" border size="small" style="width:100%">
                <el-table-column label="学号" prop="studentNo" width="120" />
                <el-table-column label="姓名" prop="studentName" width="100" />
                <el-table-column label="班级" prop="className" width="140" />
                <el-table-column label="分层标签" prop="tierLabel" width="100" />
              </el-table>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const homeworkId = computed(() => Number(route.params.id))
const loading = ref(false)
const homework = ref<any>(null)
const tierScoreStats = ref<any[]>([])
const tierKnowledgeStats = ref<any[]>([])
const students = ref<any[]>([])

let homeworkApi: any = null

const TIER_COLORS = ['#f56c6c', '#e6a23c', '#409eff', '#67c23a', '#909399']
const TIER_TAG_TYPES: Array<'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined> = ['danger', 'warning', undefined, 'success', 'primary']

function tierTagType(tierId: number): 'success' | 'warning' | 'danger' | 'info' | 'primary' | undefined {
  return TIER_TAG_TYPES[tierId]
}

function tierColor(tierId: number): string {
  return TIER_COLORS[tierId] || '#909399'
}

function barWidth(scoreRate: any): string {
  if (!scoreRate) return '0%'
  return Math.min(Number(scoreRate), 100) + '%'
}

function scoreRateClass(rate: any): string {
  if (rate == null) return ''
  const n = Number(rate)
  if (n >= 80) return 'text-success'
  if (n >= 60) return 'text-warning'
  return 'text-danger'
}

const tierGroups = computed(() => {
  const grouped: Record<number, any[]> = {}
  students.value.forEach((s: any) => {
    const tid = s.tierId ?? 0
    if (!grouped[tid]) grouped[tid] = []
    grouped[tid].push(s)
  })
  return Object.keys(grouped).sort().map((tid) => ({
    tierId: Number(tid),
    tierLabel: (grouped[Number(tid)]?.[0] as any)?.tierLabel || `第${Number(tid) + 1}层`,
    students: grouped[Number(tid)]
  }))
})

const knowledgeMatrix = computed(() => {
  if (tierKnowledgeStats.value.length === 0) return []

  const knowledgeMap: Record<string, any> = {}
  tierKnowledgeStats.value.forEach((item: any) => {
    const kid = String(item.knowledgeId)
    if (!knowledgeMap[kid]) {
      knowledgeMap[kid] = {
        knowledgeId: item.knowledgeId,
        knowledgeName: item.knowledgeName,
        knowledgeTotal: item.knowledgeTotal
      }
    }
    knowledgeMap[kid]['rate_' + item.tierId] = item.scoreRate
    knowledgeMap[kid]['avg_' + item.tierId] = item.avgScore
  })

  return Object.values(knowledgeMap)
})

async function init() {
  if (!homeworkId.value) return
  const mod = await import('@/composables/useHomeworkApi')
  homeworkApi = mod.useHomeworkApi()

  loading.value = true
  try {
    homework.value = await homeworkApi.getTeacherHomeworkDetail(homeworkId.value)

    const stats = await homeworkApi.getTierStats(homeworkId.value)
    tierScoreStats.value = stats?.tierScoreStats || []
    tierKnowledgeStats.value = stats?.tierKnowledgeStats || []
    students.value = stats?.students || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  init()
})

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})
</script>

<style scoped>
.tier-stats-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 20px;
}
.back-bar {
  margin-bottom: 12px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px 0;
}
.page-tags {
  display: flex;
  gap: 8px;
}
.empty-state {
  padding: 60px 0;
}
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}
.stat-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
}
.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.stat-count {
  font-size: 13px;
  color: #909399;
}
.stat-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}
.stat-label {
  color: #909399;
}
.stat-value {
  font-weight: 500;
  color: #303133;
}
.stat-value.highlight {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
}
.chart-section {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #303133;
}
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bar-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  text-align: right;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 32px;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
  display: flex;
  align-items: center;
  min-width: 0;
}
.bar-text {
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  padding: 0 8px;
  font-weight: 500;
}
.knowledge-table-wrap {
  overflow-x: auto;
}
.tier-detail-group {
  margin-bottom: 20px;
}
.tier-detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.tier-detail-count {
  font-size: 13px;
  color: #909399;
}
.text-success {
  color: #67c23a;
  font-weight: 500;
}
.text-warning {
  color: #e6a23c;
  font-weight: 500;
}
.text-danger {
  color: #f56c6c;
  font-weight: 500;
}
</style>
