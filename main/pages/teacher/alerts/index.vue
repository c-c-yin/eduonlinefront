<template>
  <div class="alert-list-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">预警中心</h1>
        <p class="page-desc">查看所教班级学生的预警信息，及时关注学习异常</p>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 预警记录 -->
        <el-tab-pane name="records">
          <template #label>
            <span>预警记录</span>
            <el-badge v-if="unreadCount > 0" :value="unreadCount" :max="99" class="tab-badge" />
          </template>

          <div class="toolbar">
            <el-select v-model="filterRead" placeholder="全部状态" clearable style="width: 140px" @change="fetchList">
              <el-option label="未读" :value="0" />
              <el-option label="已读" :value="1" />
            </el-select>
            <el-select v-model="filterLevel" placeholder="全部级别" clearable style="width: 140px" @change="fetchList">
              <el-option label="高" value="high" />
              <el-option label="中" value="medium" />
              <el-option label="低" value="low" />
            </el-select>
          </div>

          <div v-loading="loading" class="alert-list">
            <el-empty v-if="!loading && list.length === 0" description="暂无预警记录" />

            <div v-for="item in list" :key="item.recordId" class="alert-card" :class="{ 'is-unread': item.isRead === 0 }">
              <div class="alert-header">
                <div class="alert-left">
                  <el-tag :type="getLevelType(item.alertLevel)" size="small">{{ levelMap[item.alertLevel] || item.alertLevel }}</el-tag>
                  <span class="alert-title">{{ item.alertTitle }}</span>
                  <el-tag v-if="item.isRead === 0" type="danger" size="small" effect="dark">新</el-tag>
                </div>
                <span class="alert-time">{{ item.createTime?.substring(0, 10) }}</span>
              </div>
              <div class="alert-body">
                <p class="alert-content">{{ item.alertContent }}</p>
              </div>
              <div class="alert-footer">
                <div class="alert-meta">
                  <span>{{ item.studentName }} ({{ item.studentNo }})</span>
                  <span>{{ item.className }}</span>
                  <span v-if="item.ruleName">规则：{{ item.ruleName }}</span>
                </div>
                <div class="alert-actions">
                  <el-button v-if="item.isRead === 0" type="primary" size="small" @click="handleRead(item)">标记已读</el-button>
                  <el-button v-if="item.isHandled === 0" type="success" size="small" @click="openHandleDialog(item)">处理</el-button>
                  <el-button size="small" plain @click="openSuggestDialog(item)">改进建议</el-button>
                  <span v-if="item.isHandled === 1" class="handled-text">已处理</span>
                </div>
              </div>
            </div>
          </div>

          <div class="pagination-wrap" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              layout="total, prev, pager, next"
              @current-change="fetchList"
            />
          </div>
        </el-tab-pane>

        <!-- 预警规则 -->
        <el-tab-pane label="预警规则" name="rules">
          <div v-loading="rulesLoading">
            <el-empty v-if="!rulesLoading && rulesList.length === 0" description="暂无规则" />
            <el-table :data="rulesList" stripe>
              <el-table-column prop="ruleName" label="规则名称" min-width="160" show-overflow-tooltip />
              <el-table-column prop="metricLabel" label="监控指标" width="120" />
              <el-table-column label="阈值" width="100" align="center">
                <template #default="{ row }">
                  {{ comparisonLabel(row.comparison) }} {{ row.threshold }}
                </template>
              </el-table-column>
              <el-table-column label="严重级别" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="getLevelType(row.severityLevel)" size="small">{{ levelMap[row.severityLevel] || row.severityLevel }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="cooldownHours" label="冷却(小时)" width="100" align="center" />
              <el-table-column label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.isEnabled === 1 ? 'success' : 'info'" size="small">
                    {{ row.isEnabled === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 趋势分析 -->
        <el-tab-pane label="趋势分析" name="trend">
          <div class="toolbar">
            <el-radio-group v-model="trendDays" @change="fetchTrend">
              <el-radio-button :value="7">近7天</el-radio-button>
              <el-radio-button :value="30">近30天</el-radio-button>
            </el-radio-group>
          </div>
          <el-card v-loading="trendLoading">
            <div ref="trendChartRef" style="height: 350px" />
            <el-empty v-if="!trendLoading && trendData.length === 0" description="暂无趋势数据" />
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 处理预警对话框 -->
    <el-dialog v-model="handleDialogVisible" title="处理预警" width="480px">
      <div class="handle-info" v-if="currentAlert">
        <p><strong>学生：</strong>{{ currentAlert.studentName }} ({{ currentAlert.studentNo }})</p>
        <p><strong>预警：</strong>{{ currentAlert.alertTitle }}</p>
      </div>
      <el-form label-width="80px">
        <el-form-item label="处理说明">
          <el-input
            v-model="handleRemark"
            type="textarea"
            :rows="4"
            placeholder="请输入处理措施和说明"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handling" @click="confirmHandle">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 改进建议对话框 -->
    <el-dialog v-model="suggestDialogVisible" title="改进建议" width="600px">
      <div v-loading="suggestLoading">
        <el-empty v-if="!suggestLoading && suggestList.length === 0" description="暂无改进建议" />
        <div v-for="s in suggestList" :key="s.suggestId" class="suggest-item">
          <h4 class="suggest-title">{{ s.suggestTitle }}</h4>
          <p class="suggest-content">{{ s.suggestContent }}</p>
          <div v-if="s.actionItems" class="suggest-actions">
            <strong>行动项：</strong>
            <p v-for="(action, idx) in parseActionItems(s.actionItems)" :key="idx" class="action-item">{{ idx + 1 }}. {{ action }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { useAlertApi, type AlertRecord, type AlertRule, type ImprovementSuggest, type AlertTrend } from '@/composables/useAlertApi'

definePageMeta({
  middleware: ['teacher'],
  ssr: false
})

const {
  getAlertList,
  getUnreadCount,
  markAsRead,
  handleAlert,
  getAlertRules,
  getImprovementSuggest,
  getAlertTrend
} = useAlertApi()

const activeTab = ref('records')
const loading = ref(false)
const list = ref<AlertRecord[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const filterRead = ref<number | null>(null)
const filterLevel = ref<string | null>(null)
const unreadCount = ref(0)

const levelMap: Record<string, string> = {
  high: '严重',
  medium: '警告',
  low: '提示'
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (filterRead.value !== null && filterRead.value !== undefined) {
      params.isRead = filterRead.value
    }
    if (filterLevel.value) {
      params.alertLevel = filterLevel.value
    }
    const res = await getAlertList(params)
    list.value = res.rows
    total.value = res.total
  } catch {
    list.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function fetchUnreadCount() {
  try {
    unreadCount.value = await getUnreadCount()
  } catch {
    unreadCount.value = 0
  }
}

async function handleRead(item: AlertRecord) {
  try {
    await markAsRead(item.recordId)
    item.isRead = 1
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    ElMessage.success('已标记为已读')
  } catch {
    ElMessage.error('操作失败')
  }
}

// 处理预警
const handleDialogVisible = ref(false)
const handling = ref(false)
const handleRemark = ref('')
const currentAlert = ref<AlertRecord | null>(null)

function openHandleDialog(item: AlertRecord) {
  currentAlert.value = item
  handleRemark.value = ''
  handleDialogVisible.value = true
}

async function confirmHandle() {
  if (!currentAlert.value) return
  handling.value = true
  try {
    await handleAlert(currentAlert.value.recordId, handleRemark.value)
    currentAlert.value.isHandled = 1
    currentAlert.value.handleRemark = handleRemark.value
    ElMessage.success('已处理')
    handleDialogVisible.value = false
  } catch {
    ElMessage.error('操作失败')
  } finally {
    handling.value = false
  }
}

// 改进建议
const suggestDialogVisible = ref(false)
const suggestLoading = ref(false)
const suggestList = ref<ImprovementSuggest[]>([])

async function openSuggestDialog(item: AlertRecord) {
  suggestDialogVisible.value = true
  suggestLoading.value = true
  suggestList.value = []
  try {
    suggestList.value = await getImprovementSuggest(item.ruleType)
  } catch {
    suggestList.value = []
  } finally {
    suggestLoading.value = false
  }
}

function parseActionItems(json: string): string[] {
  try {
    return JSON.parse(json)
  } catch {
    return json ? [json] : []
  }
}

// 预警规则
const rulesLoading = ref(false)
const rulesList = ref<AlertRule[]>([])

async function fetchRules() {
  rulesLoading.value = true
  try {
    rulesList.value = await getAlertRules()
  } catch {
    rulesList.value = []
  } finally {
    rulesLoading.value = false
  }
}

function comparisonLabel(comparison: string): string {
  const map: Record<string, string> = {
    'lt': '<',
    'le': '≤',
    'gt': '>',
    'ge': '≥',
    'eq': '='
  }
  return map[comparison] || comparison
}

// 趋势分析
const trendLoading = ref(false)
const trendData = ref<AlertTrend[]>([])
const trendDays = ref(7)
const trendChartRef = ref<HTMLElement>()
let trendChart: any = null

async function fetchTrend() {
  trendLoading.value = true
  try {
    trendData.value = await getAlertTrend(trendDays.value)
    await nextTick()
    renderTrendChart()
  } catch {
    trendData.value = []
  } finally {
    trendLoading.value = false
  }
}

function renderTrendChart() {
  if (!trendChartRef.value || trendData.value.length === 0) return
  const echarts = (window as any).echarts
  if (!echarts) return
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['严重', '警告', '提示', '总计'] },
    xAxis: { type: 'category', data: trendData.value.map(t => t.date) },
    yAxis: { type: 'value', name: '数量' },
    series: [
      { name: '严重', type: 'bar', stack: 'alert', data: trendData.value.map(t => t.highCount), itemStyle: { color: '#F56C6C' } },
      { name: '警告', type: 'bar', stack: 'alert', data: trendData.value.map(t => t.mediumCount), itemStyle: { color: '#E6A23C' } },
      { name: '提示', type: 'bar', stack: 'alert', data: trendData.value.map(t => t.lowCount), itemStyle: { color: '#909399' } },
      { name: '总计', type: 'line', data: trendData.value.map(t => t.totalCount), itemStyle: { color: '#409EFF' }, smooth: true }
    ],
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true }
  })
}

function handleTabChange(tab: string) {
  if (tab === 'rules') fetchRules()
  else if (tab === 'trend') fetchTrend()
}

function getLevelType(level: string): 'danger' | 'warning' | 'info' {
  switch (level) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

function handleResize() {
  trendChart?.resize()
}

onMounted(() => {
  fetchList()
  fetchUnreadCount()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
})

useSeoMeta({
  title: '预警中心 - 教育云平台'
})
</script>

<style scoped>
.alert-list-page {
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

.tab-badge {
  margin-left: 4px;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #909399;
  transition: box-shadow 0.2s;
}

.alert-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.alert-card.is-unread {
  background: #fef0f0;
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.alert-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alert-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.alert-time {
  font-size: 13px;
  color: #909399;
  flex-shrink: 0;
}

.alert-body {
  margin-bottom: 14px;
}

.alert-content {
  margin: 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.handled-text {
  font-size: 13px;
  color: #67c23a;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.handle-info {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.handle-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.suggest-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.suggest-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px;
}

.suggest-content {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 8px;
}

.suggest-actions {
  font-size: 13px;
  color: #909399;
}

.action-item {
  margin: 4px 0;
  padding-left: 8px;
}

@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
  }

  .alert-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
