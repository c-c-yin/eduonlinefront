<template>
  <div class="teacher-homework-page">
    <div class="container">
      <div class="page-header">
        <h1 class="page-title">我的作业</h1>
        <p class="page-desc">创建和发布作业，跟踪学生成绩</p>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="作业列表" name="homework">
          <div class="toolbar">
            <el-input
              v-model="searchName"
              placeholder="搜索作业名称"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
            />
            <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable style="width: 140px" @change="onSubjectChange">
              <el-option v-for="s in subjectOptions" :key="s.subjectId" :label="s.subjectName" :value="s.subjectId" />
            </el-select>
            <el-select v-model="queryParams.versionId" placeholder="全部版本" clearable style="width: 120px" :disabled="!queryParams.subjectId" @change="onVersionChange">
              <el-option v-for="v in versionOptions" :key="v.versionId" :label="v.versionName" :value="v.versionId" />
            </el-select>
            <el-select v-model="queryParams.volumeId" placeholder="全部册次" clearable style="width: 120px" :disabled="!queryParams.versionId" @change="handleSearch">
              <el-option v-for="v in volumeOptions" :key="v.volumeId" :label="v.volumeName" :value="v.volumeId" />
            </el-select>
            <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px" @change="handleSearch">
              <el-option label="草稿" :value="0" />
              <el-option label="已发布" :value="1" />
              <el-option label="已关闭" :value="2" />
            </el-select>
            <el-select v-model="classFilter" placeholder="全部班级" clearable style="width: 160px" @change="handleSearch">
              <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
            </el-select>
            <el-button @click="handleReset">重置</el-button>
            <div style="flex:1" />
            <el-button type="primary" @click="goCreate">创建作业</el-button>
          </div>

          <div v-loading="loading" class="homework-list">
            <el-empty v-if="!loading && list.length === 0" description="暂无作业" />

            <el-card v-for="item in list" :key="item.homeworkId" class="homework-card" shadow="hover">
              <div class="card-content">
                <div class="card-main">
                  <h3 class="card-title" @click="goDetail(item.homeworkId)">{{ item.homeworkName }}</h3>
                  <div class="card-tags">
                    <el-tag :type="item.homeworkSource === 1 ? 'success' : item.homeworkSource === 3 ? 'primary' : 'warning'" size="small">
                      {{ item.homeworkSource === 1 ? '在线试卷' : item.homeworkSource === 3 ? '在线试题' : '线下习题' }}
                    </el-tag>
                    <el-tag size="small">{{ typeLabel(item.homeworkType) }}</el-tag>
                    <el-tag v-if="item.publisherType === 1" type="info" size="small">管理员发布</el-tag>
                    <el-tag v-if="item.status === 0" type="info" size="small">草稿</el-tag>
                    <el-tag v-else-if="item.status === 1" type="success" size="small">已发布</el-tag>
                    <el-tag v-else-if="item.status === 2" type="danger" size="small">已关闭</el-tag>
                  </div>
                  <div class="card-info">
                    <span>{{ item.subjectName || '-' }}</span>
                    <span>{{ item.totalScore }}分</span>
                    <span>{{ item.createTime?.substring(0, 10) }}</span>
                    <span v-if="item.status === 1" class="info-submit">
                      提交 {{ item.submitCount ?? 0 }}/{{ item.studentCount ?? 0 }}
                    </span>
                    <span v-if="item.avgScore != null" class="info-avg">均分 {{ item.avgScore }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button
                    v-if="item.publisherType !== 1 && item.status === 0"
                    type="primary"
                    size="small"
                    @click="handlePublish(item)"
                  >发布</el-button>
                  <el-button
                    v-if="item.publisherType !== 1 && item.status === 1"
                    type="warning"
                    size="small"
                    @click="handleClose(item)"
                  >关闭</el-button>
                  <el-button
                    size="small"
                    @click="goDetail(item.homeworkId)"
                  >{{ item.publisherType !== 1 && item.status === 0 ? '编辑' : '查看成绩' }}</el-button>
                  <el-button
                    v-if="item.publisherType !== 1"
                    size="small"
                    plain
                    @click="handleSaveAsTemplate(item)"
                  >存为模板</el-button>
                  <el-button
                    v-if="item.publisherType !== 1 && item.status === 0"
                    type="danger"
                    size="small"
                    @click="handleDelete(item)"
                  >删除</el-button>
                </div>
              </div>
            </el-card>
          </div>

          <div class="pagination-wrap" v-if="total > pageSize">
            <el-pagination
              v-model:current-page="currentPage"
              :page-size="pageSize"
              :total="total"
              :page-sizes="[10, 20, 30]"
              layout="total, sizes, prev, pager, next"
              @size-change="fetchList"
              @current-change="fetchList"
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="我的模板" name="template">
          <div class="toolbar">
            <el-button type="primary" @click="goCreate">创建作业</el-button>
          </div>
          <div v-loading="templateLoading" class="homework-list">
            <el-empty v-if="!templateLoading && templateList.length === 0" description="暂无模板，可从作业列表中保存模板" />
            <el-card v-for="tpl in templateList" :key="tpl.homeworkId" class="homework-card" shadow="hover">
              <div class="card-content">
                <div class="card-main">
                  <h3 class="card-title">{{ tpl.templateName || tpl.homeworkName }}</h3>
                  <div class="card-tags">
                    <el-tag :type="tpl.homeworkSource === 1 ? 'success' : tpl.homeworkSource === 3 ? 'primary' : 'warning'" size="small">
                      {{ tpl.homeworkSource === 1 ? '在线试卷' : tpl.homeworkSource === 3 ? '在线试题' : '线下习题' }}
                    </el-tag>
                    <el-tag size="small">{{ typeLabel(tpl.homeworkType) }}</el-tag>
                    <el-tag type="info" size="small">模板</el-tag>
                  </div>
                  <div class="card-info">
                    <span>{{ tpl.subjectName || '-' }}</span>
                    <span>{{ tpl.totalScore }}分</span>
                    <span>创建于 {{ tpl.createTime?.substring(0, 10) }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button type="primary" size="small" @click="handleUseTemplate(tpl)">从模板创建</el-button>
                  <el-button type="danger" size="small" @click="handleDeleteTemplate(tpl)">删除模板</el-button>
                </div>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 保存为模板对话框 -->
    <el-dialog v-model="templateDialogVisible" title="保存为模板" width="440px">
      <el-form label-width="80px">
        <el-form-item label="模板名称">
          <el-input v-model="templateName" placeholder="请输入模板名称" maxlength="50" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="templateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="templateSaving" @click="confirmSaveAsTemplate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { useHomeworkApi, type EduHomework } from '@/composables/useHomeworkApi'
import { useEducationApi } from '@/composables/useEducationApi'

definePageMeta({
  layout: 'default',
  middleware: ['teacher'],
  ssr: false
})

const router = useRouter()
const homeworkApi = useHomeworkApi()
const { getSubjectOptions, getVersionOptionsBySubject, getVolumeOptionsByVersion } = useEducationApi()

const loading = ref(false)
const list = ref<EduHomework[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchName = ref('')
const classFilter = ref<number | null>(null)
const classes = ref<{ classId: number; className: string }[]>([])

const subjectOptions = ref<any[]>([])
const versionOptions = ref<any[]>([])
const volumeOptions = ref<any[]>([])

const queryParams = reactive({
  subjectId: null as number | null,
  versionId: null as number | null,
  volumeId: null as number | null,
  status: null as number | null
})

const HOMEWORK_TYPE_LABELS: Record<number, string> = {
  1: '练习作业', 2: '课后作业', 3: '随堂作业',
  4: '月考作业', 5: '期中作业', 6: '期末作业'
}

function typeLabel(type: number): string {
  return HOMEWORK_TYPE_LABELS[type] || '其他'
}

async function fetchClasses() {
  try {
    classes.value = await homeworkApi.getMyClasses()
  } catch { classes.value = [] }
}

async function fetchList() {
  loading.value = true
  try {
    const params: any = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    if (searchName.value) params.homeworkName = searchName.value
    if (queryParams.status !== null) params.status = queryParams.status
    if (queryParams.subjectId) params.subjectId = queryParams.subjectId
    if (queryParams.versionId) params.versionId = queryParams.versionId
    if (queryParams.volumeId) params.volumeId = queryParams.volumeId
    if (classFilter.value) params.classId = classFilter.value
    const res = await homeworkApi.getTeacherHomeworkList(params)
    list.value = res.rows
    total.value = res.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchList()
}

function handleReset() {
  searchName.value = ''
  classFilter.value = null
  queryParams.subjectId = null
  queryParams.versionId = null
  queryParams.volumeId = null
  queryParams.status = null
  versionOptions.value = []
  volumeOptions.value = []
  currentPage.value = 1
  fetchList()
}

async function onSubjectChange(subjectId: number | null) {
  queryParams.versionId = null
  queryParams.volumeId = null
  versionOptions.value = []
  volumeOptions.value = []
  if (subjectId) {
    try { versionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { versionOptions.value = [] }
  }
  handleSearch()
}

async function onVersionChange(versionId: number | null) {
  queryParams.volumeId = null
  volumeOptions.value = []
  if (versionId) {
    try { volumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { volumeOptions.value = [] }
  }
  handleSearch()
}

function goCreate() {
  router.push('/teacher/homework/create')
}

function goDetail(id: number) {
  router.push(`/teacher/homework/${id}`)
}

async function handlePublish(item: EduHomework) {
  try {
    await ElMessageBox.confirm(`确认发布作业【${item.homeworkName}】？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await homeworkApi.publishHomework(item.homeworkId)
    ElMessage.success('发布成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleClose(item: EduHomework) {
  try {
    await ElMessageBox.confirm(`确认关闭作业【${item.homeworkName}】？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await homeworkApi.closeHomework(item.homeworkId)
    ElMessage.success('已关闭')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

async function handleDelete(item: EduHomework) {
  try {
    await ElMessageBox.confirm(`确认删除作业【${item.homeworkName}】？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await homeworkApi.deleteHomework(item.homeworkId)
    ElMessage.success('删除成功')
    fetchList()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}

onMounted(async () => {
  try {
    subjectOptions.value = await getSubjectOptions()
  } catch { subjectOptions.value = [] }
  fetchClasses()
  fetchList()
})

// 模板管理
const activeTab = ref('homework')
const templateLoading = ref(false)
const templateList = ref<any[]>([])
const templateDialogVisible = ref(false)
const templateSaving = ref(false)
const templateName = ref('')
const currentHomeworkId = ref<number>(0)

function handleTabChange(tab: string) {
  if (tab === 'template') {
    fetchTemplateList()
  }
}

async function fetchTemplateList() {
  templateLoading.value = true
  try {
    const res = await homeworkApi.getTemplateList({ pageNum: 1, pageSize: 100 })
    templateList.value = res.rows
  } catch (e) {
    console.error(e)
  } finally {
    templateLoading.value = false
  }
}

function handleSaveAsTemplate(item: EduHomework) {
  currentHomeworkId.value = item.homeworkId
  templateName.value = item.homeworkName + '（模板）'
  templateDialogVisible.value = true
}

async function confirmSaveAsTemplate() {
  if (!templateName.value.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  templateSaving.value = true
  try {
    await homeworkApi.saveAsTemplate(currentHomeworkId.value, templateName.value)
    ElMessage.success('模板保存成功')
    templateDialogVisible.value = false
  } catch (e) {
    ElMessage.error('模板保存失败')
  } finally {
    templateSaving.value = false
  }
}

async function handleUseTemplate(tpl: any) {
  try {
    await ElMessageBox.confirm(`确认从模板【${tpl.templateName || tpl.homeworkName}】创建新作业？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    const newId = await homeworkApi.createFromTemplate(tpl.homeworkId)
    ElMessage.success('已从模板创建作业，请完善信息')
    router.push(`/teacher/homework/create?id=${newId}`)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('创建失败')
  }
}

async function handleDeleteTemplate(tpl: any) {
  try {
    await ElMessageBox.confirm(`确认删除模板【${tpl.templateName || tpl.homeworkName}】？`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await homeworkApi.deleteTemplate(tpl.homeworkId)
    ElMessage.success('模板已删除')
    fetchTemplateList()
  } catch (e) {
    if (e !== 'cancel') console.error(e)
  }
}
</script>

<style scoped>
.teacher-homework-page {
  min-height: calc(100vh - 200px);
  padding: 24px 0;
}
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px;
}
.page-header {
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}
.page-desc {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}
.toolbar > :last-child {
  margin-left: auto;
}
.homework-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.homework-card {
  cursor: pointer;
}
.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
  cursor: pointer;
}
.card-title:hover {
  color: #409eff;
}
.card-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}
.card-info {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}
.info-submit {
  color: #409eff;
  font-weight: 500;
}
.info-avg {
  color: #67c23a;
  font-weight: 500;
}
.card-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.pagination-wrap {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .page-title { font-size: 22px; }
  .toolbar { flex-wrap: wrap; }
  .toolbar > :last-child { margin-left: 0; }
  .card-content { flex-direction: column; align-items: flex-start; gap: 12px; }
  .card-actions { width: 100%; justify-content: flex-end; }
  .card-info { flex-wrap: wrap; gap: 8px; }
}
</style>