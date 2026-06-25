<template>
  <div class="teacher-question-page">
    <div class="container">
      <div class="page-header">
        <h2>我的试题</h2>
        <p class="page-desc">管理您创建的试题，支持手动录入、互联网试题、Word文档导入、拍照识题和智能识题</p>
      </div>

      <!-- 搜索表单 -->
      <el-card class="search-card" shadow="never">
        <el-form :model="queryParams" inline>
          <el-form-item label="试题编码">
            <el-input v-model="queryParams.questionCode" placeholder="请输入试题编码" clearable style="width: 160px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="题型">
            <el-select v-model="queryParams.questionType" placeholder="全部题型" clearable style="width: 120px">
              <el-option v-for="item in questionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="难度">
            <el-select v-model="queryParams.difficulty" placeholder="全部难度" clearable style="width: 120px">
              <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="queryParams.gradeId" placeholder="全部年级" clearable style="width: 120px">
              <el-option v-for="item in gradeOptions" :key="item.gradeId" :label="item.gradeName" :value="item.gradeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="学科">
            <el-select v-model="queryParams.subjectId" placeholder="全部学科" clearable style="width: 140px" @change="handleSearchSubjectChange">
              <el-option v-for="item in subjectOptions" :key="item.subjectId" :label="item.stageName ? item.stageName + ' > ' + item.subjectName : item.subjectName" :value="item.subjectId" />
            </el-select>
          </el-form-item>
          <el-form-item label="版本">
            <el-select v-model="queryParams.versionId" placeholder="请先选择学科" clearable style="width: 140px" :disabled="!queryParams.subjectId" @change="handleSearchVersionChange">
              <el-option v-for="item in searchVersionOptions" :key="item.versionId" :label="item.versionName" :value="item.versionId" />
            </el-select>
          </el-form-item>
          <el-form-item label="册次">
            <el-select v-model="queryParams.volumeId" placeholder="请先选择版本" clearable style="width: 140px" :disabled="!queryParams.versionId" @change="handleSearchVolumeChange">
              <el-option v-for="item in searchVolumeOptions" :key="item.volumeId" :label="item.volumeName" :value="item.volumeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="课题">
            <el-tree-select
              v-model="queryParams.topicId"
              :data="searchTopicTreeOptions"
              :props="{ value: 'topicId', label: 'topicName', children: 'children' }"
              placeholder="请先选择册次"
              clearable
              check-strictly
              style="width: 160px"
              :disabled="!queryParams.volumeId"
            />
          </el-form-item>
          <el-form-item label="知识点">
            <el-tree-select
              v-model="queryParams.knowledgeIds"
              :data="searchKnowledgeTreeOptions"
              :props="{ value: 'knowledgeId', label: 'knowledgeName', children: 'children' }"
              placeholder="请先选择册次"
              clearable
              multiple
              check-strictly
              style="width: 200px"
              :disabled="!queryParams.volumeId"
            />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 120px">
              <el-option label="草稿" :value="0" />
              <el-option label="待审核" :value="1" />
              <el-option label="已发布" :value="2" />
              <el-option label="已下架" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
            <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 工具栏 -->
      <el-card class="toolbar-card" shadow="never">
        <div class="toolbar">
          <div class="toolbar-left">
            <el-button type="primary" :icon="EditPen" @click="handleManualAdd">手动录入</el-button>
            <el-button type="success" :icon="Monitor" @click="handleWebQuestion">互联网试题</el-button>
            <el-button type="info" :icon="Document" @click="handleDocxImport">docx试题</el-button>
            <el-button type="warning" :icon="Camera" @click="handleOcrRecognize">拍照识题</el-button>
            <el-button :icon="MagicStick" @click="handleMinerURecognize">智能识题</el-button>
            <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">批量删除</el-button>
          </div>
          <div class="toolbar-right">
            <el-button @click="recycleDialogVisible = true">
              <el-icon><Delete /></el-icon>
              回收站
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 试题列表 -->
      <el-card class="table-card" shadow="never">
        <el-table :data="questionList" v-loading="loading" stripe @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="questionCode" label="试题编码" width="140" align="center" show-overflow-tooltip />
          <el-table-column prop="questionType" label="题型" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getQuestionTypeTag(row.questionType)" size="small">{{ getQuestionTypeLabel(row.questionType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="questionContent" label="题干内容" min-width="280">
            <template #default="{ row }">
              <div class="content-cell" v-html="row.questionContent" :title="stripHtml(row.questionContent)"></div>
            </template>
          </el-table-column>
          <el-table-column prop="subjectName" label="学科" width="80" align="center" />
          <el-table-column prop="gradeName" label="年级" width="80" align="center" />
          <el-table-column prop="volumeName" label="册次" width="100" align="center" />
          <el-table-column prop="difficulty" label="难度" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getDifficultyTag(row.difficulty)" size="small">{{ getDifficultyLabel(row.difficulty) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
                <el-tooltip v-if="row.auditStatus === 2 && row.status !== 1" :content="'驳回原因：' + (row.rejectReason || '无')" placement="top">
                  <el-tag type="danger" size="small">驳回</el-tag>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="useCount" label="使用次数" width="90" align="center" />
          <el-table-column prop="createTime" label="创建时间" width="160" align="center" />
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
              <el-button link type="primary" :disabled="row.status === 2" @click="handleEdit(row)">修改</el-button>
              <el-button link type="danger" :disabled="row.status === 2" @click="handleDelete(row)">删除</el-button>
              <el-button v-if="row.status === 0" link type="success" @click="handleSubmitAudit(row)">提交审核</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="queryParams.pageNum"
            v-model:page-size="queryParams.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchQuestionList"
            @current-change="fetchQuestionList"
          />
        </div>
      </el-card>

      <!-- 新增/编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="1100px" destroy-on-close :close-on-click-modal="false" @close="handleDialogClose">
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="题型" prop="questionType">
                <el-select v-model="form.questionType" placeholder="请选择题型" style="width: 100%">
                  <el-option v-for="item in questionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="难度" prop="difficulty">
                <el-select v-model="form.difficulty" placeholder="请选择难度" style="width: 100%">
                  <el-option v-for="item in difficultyOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">教材信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="学科" prop="subjectId">
                <el-select v-model="form.subjectId" placeholder="请选择学科" clearable style="width: 100%" @change="handleSubjectChange">
                  <el-option v-for="item in subjectOptions" :key="item.subjectId" :label="item.stageName ? item.stageName + ' > ' + item.subjectName : item.subjectName" :value="item.subjectId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="年级">
                <el-select v-model="form.gradeId" placeholder="请选择年级" clearable style="width: 100%">
                  <el-option v-for="item in gradeOptions" :key="item.gradeId" :label="item.gradeName" :value="item.gradeId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="版本">
                <el-select v-model="form.versionId" placeholder="请先选择学科" clearable style="width: 100%" :disabled="!form.subjectId" @change="handleVersionChange">
                  <el-option v-for="item in formVersionOptions" :key="item.versionId" :label="item.versionName" :value="item.versionId" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="册次">
                <el-select v-model="form.volumeId" placeholder="请先选择版本" clearable style="width: 100%" :disabled="!form.versionId" @change="handleVolumeChange">
                  <el-option v-for="item in formVolumeOptions" :key="item.volumeId" :label="item.volumeName" :value="item.volumeId" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="课题">
                <el-tree-select
                  v-model="form.topicId"
                  :data="formTopicTreeOptions"
                  :props="{ value: 'topicId', label: 'topicName', children: 'children' }"
                  placeholder="请先选择册次"
                  clearable
                  check-strictly
                  :render-after-expand="false"
                  style="width: 100%"
                  :disabled="!form.volumeId"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="知识点">
                <el-tree-select
                  v-model="form.knowledgeIds"
                  :data="formKnowledgeTreeOptions"
                  :props="{ value: 'knowledgeId', label: 'knowledgeName', children: 'children' }"
                  placeholder="请先选择册次"
                  clearable
                  multiple
                  check-strictly
                  :render-after-expand="false"
                  style="width: 100%"
                  :disabled="!form.volumeId"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <!-- 知识点权重配置 -->
          <el-row v-if="form.knowledgeIds && form.knowledgeIds.length > 0" :gutter="20">
            <el-col :span="24">
              <el-form-item label="知识点权重">
                <div class="knowledge-weight-panel">
                  <el-checkbox v-model="useDefaultWeight" size="small" style="margin-bottom: 8px">使用默认权重（不手动设置）</el-checkbox>
                  <div v-if="!useDefaultWeight" class="weight-list">
                    <div v-for="kid in form.knowledgeIds" :key="kid" class="weight-item">
                      <span class="weight-label">{{ getKnowledgeName(kid) }}</span>
                      <el-checkbox
                        v-model="knowledgeMainMap[kid]"
                        :true-value="1"
                        :false-value="0"
                        size="small"
                        @change="(val: number) => handleMainChange(kid, val)"
                      >主</el-checkbox>
                      <el-input-number
                        v-model="knowledgeWeightMap[kid]"
                        :min="0.01"
                        :max="1.00"
                        :step="0.05"
                        :precision="2"
                        size="small"
                        style="width: 100px"
                        :disabled="form.knowledgeIds.length <= 1"
                        @change="(val: number) => handleWeightChange(kid, val)"
                      />
                      <span v-if="form.knowledgeIds.length <= 1" class="weight-hint">（固定1.0）</span>
                      <el-tooltip content="移除该知识点" placement="top" :disabled="form.knowledgeIds.length <= 1">
                        <el-button link type="danger" size="small" :icon="Delete" @click="removeKnowledge(kid)" :disabled="form.knowledgeIds.length <= 1" />
                      </el-tooltip>
                    </div>
                    <div class="weight-summary">
                      合计权重：<span :class="{ 'weight-valid': weightSumValid, 'weight-invalid': !weightSumValid }">
                        {{ weightSum.toFixed(2) }}
                      </span>
                      <span v-if="!weightSumValid && !useDefaultWeight" class="weight-warning">（权重之和必须为1.00）</span>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="默认分值" prop="defaultScore">
                <el-input-number v-model="form.defaultScore" :min="0.5" :max="100" :step="0.5" :precision="1" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">试题内容</el-divider>
          <el-form-item label="题干内容" prop="questionContent">
            <MathEditor v-model="form.questionContent" :min-height="200" />
          </el-form-item>

          <!-- 选项设置（单选/多选） -->
          <template v-if="[1, 2].includes(form.questionType)">
            <el-divider content-position="left">选项设置</el-divider>
            <el-form-item label="选项">
              <div class="options-editor">
                <div v-for="(opt, idx) in optionsList" :key="idx" class="option-item">
                  <el-tag class="option-tag" type="primary">{{ String.fromCharCode(65 + idx) }}</el-tag>
                  <MathEditor v-model="opt.content" :min-height="80" class="option-editor" />
                  <el-button v-if="optionsList.length > 1" type="danger" link :icon="Delete" @click="removeOption(idx)" class="option-delete-btn" />
                </div>
                <el-button v-if="optionsList.length < 8" type="primary" link @click="addOption">+ 添加选项</el-button>
              </div>
            </el-form-item>
          </template>

          <!-- 判断题答案 -->
          <template v-if="form.questionType === 3">
            <el-divider content-position="left">选项设置</el-divider>
            <el-form-item label="正确答案">
              <el-radio-group v-model="judgeAnswer">
                <el-radio value="1">正确</el-radio>
                <el-radio value="0">错误</el-radio>
              </el-radio-group>
            </el-form-item>
          </template>

          <el-divider content-position="left">答案与解析</el-divider>
          <el-form-item label="参考答案" prop="answerContent">
            <MathEditor v-model="form.answerContent" :min-height="120" />
          </el-form-item>
          <el-form-item label="答案解析">
            <MathEditor v-model="form.answerAnalysis" :min-height="120" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="来源类型" prop="sourceType">
                <el-select v-model="form.sourceType" placeholder="请选择来源类型" style="width: 100%">
                  <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="备注">
                <el-input v-model="form.remark" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="是否公开">
                <el-switch v-model="form.isPublic" :active-value="1" :inactive-value="0" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </template>
      </el-dialog>

      <!-- 预览对话框 -->
      <el-dialog v-model="previewDialogVisible" title="试题预览" width="700px" destroy-on-close>
        <div v-if="previewQuestion" class="question-preview">
          <div class="preview-header">
            <el-tag :type="getQuestionTypeTag(previewQuestion.questionType)">{{ getQuestionTypeLabel(previewQuestion.questionType) }}</el-tag>
            <el-tag :type="getDifficultyTag(previewQuestion.difficulty)" style="margin-left: 8px">{{ getDifficultyLabel(previewQuestion.difficulty) }}</el-tag>
            <el-tag :type="getStatusTag(previewQuestion.status)" style="margin-left: 8px">{{ getStatusLabel(previewQuestion.status) }}</el-tag>
            <span style="margin-left: 12px; color: #999">编码: {{ previewQuestion.questionCode }}</span>
          </div>
          <div v-if="previewQuestion.subjectName" class="preview-meta">
            <span>学科: {{ previewQuestion.subjectName }}</span>
            <span v-if="previewQuestion.gradeName" style="margin-left: 12px">年级: {{ previewQuestion.gradeName }}</span>
            <span v-if="previewQuestion.volumeName" style="margin-left: 12px">册次: {{ previewQuestion.volumeName }}</span>
          </div>
          <div class="preview-section">
            <h4>题干</h4>
            <div class="preview-content" v-html="previewQuestion.questionContent"></div>
          </div>
          <div v-if="previewQuestion.questionType === 1 || previewQuestion.questionType === 2" class="preview-section">
            <h4>选项</h4>
            <div v-for="(opt, idx) in parseOptions(previewQuestion.optionsJson)" :key="idx" class="preview-option">
              <span class="option-label">{{ String.fromCharCode(65 + idx) }}.</span>
              <span v-html="opt.content || opt"></span>
            </div>
          </div>
          <div v-if="previewQuestion.questionType === 3" class="preview-section">
            <h4>答案</h4>
            <span>{{ previewQuestion.answerContent === '1' || previewQuestion.answerContent === '正确' ? '正确' : '错误' }}</span>
          </div>
          <div v-if="previewQuestion.knowledgeNames || previewQuestion.knowledgeList" class="preview-section">
            <h4>知识点</h4>
            <el-tag v-for="(kn, ki) in getPreviewKnowledgeList(previewQuestion)" :key="ki" size="small" style="margin-right: 6px; margin-bottom: 4px;">{{ kn }}</el-tag>
          </div>
          <div v-if="previewQuestion.answerContent && previewQuestion.questionType !== 3" class="preview-section">
            <h4>参考答案</h4>
            <div class="preview-content" v-html="previewQuestion.answerContent"></div>
          </div>
          <div v-if="previewQuestion.answerAnalysis" class="preview-section">
            <h4>答案解析</h4>
            <div class="preview-content" v-html="previewQuestion.answerAnalysis"></div>
          </div>
        </div>
      </el-dialog>

      <!-- 回收站对话框 -->
      <el-dialog v-model="recycleDialogVisible" title="回收站" width="900px" destroy-on-close>
        <div class="recycle-toolbar">
          <div class="recycle-toolbar-left">
            <el-button type="primary" :disabled="recycleSelectedIds.length === 0" @click="handleBatchRestore">批量恢复</el-button>
            <el-button type="danger" :disabled="recycleSelectedIds.length === 0" @click="handleBatchPermanentDelete">批量彻底删除</el-button>
          </div>
          <div class="recycle-toolbar-right">
            <el-select v-model="recycleQueryParams.questionType" placeholder="全部题型" clearable style="width: 120px" @change="fetchRecycleList">
              <el-option v-for="item in questionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-input v-model="recycleQueryParams.questionCode" placeholder="搜索试题编码" clearable style="width: 180px" @keyup.enter="fetchRecycleList" @clear="fetchRecycleList" />
          </div>
        </div>
        <el-table :data="recycleList" v-loading="recycleLoading" stripe @selection-change="handleRecycleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="questionCode" label="试题编码" width="140" align="center" show-overflow-tooltip />
          <el-table-column prop="questionType" label="题型" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="getQuestionTypeTag(row.questionType)" size="small">{{ getQuestionTypeLabel(row.questionType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="questionContent" label="题干内容" min-width="250">
            <template #default="{ row }">
              <div class="content-cell" v-html="row.questionContent"></div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="原状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTag(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="删除时间" width="160" align="center" />
          <el-table-column label="操作" width="180" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleRestoreQuestion(row)">恢复</el-button>
              <el-button link type="danger" @click="handlePermanentDeleteQuestion(row)">彻底删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="recycleQueryParams.pageNum"
            v-model:page-size="recycleQueryParams.pageSize"
            :total="recycleTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="fetchRecycleList"
            @current-change="fetchRecycleList"
          />
        </div>
      </el-dialog>

      <!-- 互联网试题对话框 -->
      <WebQuestionDialog v-model="webQuestionVisible" :session-uuid="webQuestionSessionUuid" @apply="handleWebQuestionApply" />

      <!-- Word导入 -->
      <WordUploader v-model="wordUploaderVisible" @saved="fetchQuestionList" />

      <!-- 拍照识题 -->
      <OcrRecognizer v-model="ocrRecognizerVisible" @apply="handleOcrApply" />

      <!-- 智能识题 -->
      <MinerURecognizer v-model="minerURecognizerVisible" @apply="handleMinerUApply" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Search, Refresh, EditPen, Monitor, Document, Camera, MagicStick } from '@element-plus/icons-vue'
import MathEditor from '@/components/common/MathEditor.vue'
import WebQuestionDialog from '@/components/teacher/WebQuestionDialog.vue'
import WordUploader from '@/components/teacher/WordUploader.vue'
import OcrRecognizer from '@/components/teacher/OcrRecognizer.vue'
import MinerURecognizer from '@/components/teacher/MinerURecognizer.vue'
import { useTeacherQuestionApi, type TeacherQuestionQuery } from '@/composables/useTeacherQuestionApi'
import { useEducationApi } from '@/composables/useEducationApi'
import { useSessionImage } from '@/composables/useSessionImage'
import type { Question } from '@/types'
import 'katex/dist/katex.min.css'

const {
  getMyQuestionList, getQuestionDetail, addQuestion, updateQuestion,
  deleteQuestion, submitAudit, getRecycleList, restoreQuestion, permanentDeleteQuestion
} = useTeacherQuestionApi()

const {
  getSubjectOptions, getGradeOptions, getVersionOptionsBySubject,
  getVolumeOptionsByVersion, getTopicTree, getKnowledgeOptionsByVolume
} = useEducationApi()

const { ensureSession, processImages, resetSession } = useSessionImage()

// ========== 常量选项 ==========
const questionTypeOptions = [
  { value: 1, label: '单选题' },
  { value: 2, label: '多选题' },
  { value: 3, label: '判断题' },
  { value: 4, label: '填空题' },
  { value: 5, label: '简答题' },
  { value: 6, label: '计算题' }
]

const difficultyOptions = [
  { value: 1, label: '简单' },
  { value: 2, label: '中等' },
  { value: 3, label: '较难' },
  { value: 4, label: '困难' },
  { value: 5, label: '极难' }
]

const sourceTypeOptions = [
  { label: '手动录入', value: 1 },
  { label: '图片与PDF识别', value: 2 },
  { label: 'DOCX导入', value: 3 },
  { label: '互联网', value: 4 }
]

// ========== 列表相关 ==========
const loading = ref(false)
const questionList = ref<Question[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const queryParams = ref<TeacherQuestionQuery>({
  pageNum: 1,
  pageSize: 20,
  questionType: undefined,
  difficulty: undefined,
  subjectId: undefined,
  gradeId: undefined,
  versionId: undefined,
  volumeId: undefined,
  topicId: undefined,
  knowledgeIds: [],
  status: undefined,
  questionCode: ''
})

// 搜索表单级联选项（与表单级联选项分开）
const subjectOptions = ref<any[]>([])
const gradeOptions = ref<any[]>([])
const searchVersionOptions = ref<any[]>([])
const searchVolumeOptions = ref<any[]>([])
const searchTopicTreeOptions = ref<any[]>([])
const searchKnowledgeTreeOptions = ref<any[]>([])

async function fetchQuestionList() {
  loading.value = true
  try {
    const result = await getMyQuestionList(queryParams.value)
    questionList.value = result.rows
    total.value = result.total
  } catch (e) {
    console.error('获取试题列表失败:', e)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.value.pageNum = 1
  fetchQuestionList()
}

function resetQuery() {
  queryParams.value = {
    pageNum: 1, pageSize: 20, questionType: undefined, difficulty: undefined,
    subjectId: undefined, gradeId: undefined, versionId: undefined, volumeId: undefined,
    topicId: undefined, knowledgeIds: [], status: undefined, questionCode: ''
  }
  searchVersionOptions.value = []
  searchVolumeOptions.value = []
  searchTopicTreeOptions.value = []
  searchKnowledgeTreeOptions.value = []
  fetchQuestionList()
}

function handleSelectionChange(selection: Question[]) {
  selectedIds.value = selection.map(item => item.questionId)
}

// ========== 搜索表单级联 ==========
async function handleSearchSubjectChange(subjectId: number) {
  queryParams.value.versionId = undefined
  queryParams.value.volumeId = undefined
  queryParams.value.topicId = undefined
  queryParams.value.knowledgeIds = []
  searchVersionOptions.value = []
  searchVolumeOptions.value = []
  searchTopicTreeOptions.value = []
  searchKnowledgeTreeOptions.value = []
  if (subjectId) {
    try { searchVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { searchVersionOptions.value = [] }
  }
}

async function handleSearchVersionChange(versionId: number) {
  queryParams.value.volumeId = undefined
  queryParams.value.topicId = undefined
  queryParams.value.knowledgeIds = []
  searchVolumeOptions.value = []
  searchTopicTreeOptions.value = []
  searchKnowledgeTreeOptions.value = []
  if (versionId) {
    try { searchVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { searchVolumeOptions.value = [] }
  }
}

async function handleSearchVolumeChange(volumeId: number) {
  queryParams.value.topicId = undefined
  queryParams.value.knowledgeIds = []
  searchTopicTreeOptions.value = []
  searchKnowledgeTreeOptions.value = []
  if (volumeId) {
    try { searchTopicTreeOptions.value = await getTopicTree(volumeId) } catch { searchTopicTreeOptions.value = [] }
    try { searchKnowledgeTreeOptions.value = await getKnowledgeOptionsByVolume(volumeId) } catch { searchKnowledgeTreeOptions.value = [] }
  }
}

// ========== 新增/编辑对话框 ==========
const dialogVisible = ref(false)
const dialogTitle = ref('新增试题')
const isEdit = ref(false)
const formRef = ref()
const judgeAnswer = ref('1')

const form = ref<any>({
  questionId: null,
  questionCode: null,
  questionType: 1,
  difficulty: 2,
  subjectId: undefined,
  gradeId: undefined,
  versionId: undefined,
  volumeId: undefined,
  topicId: undefined,
  knowledgeIds: [] as number[],
  defaultScore: 1.0,
  questionContent: '',
  questionContentText: '',
  optionsJson: null,
  answerContent: '',
  answerAnalysis: '',
  sourceType: 1,
  isPublic: 1,
  status: 0,
  remark: null
})

const optionsList = ref<{ content: string }[]>([
  { content: '' }
])

const formRules = {
  questionType: [{ required: true, message: '请选择题型', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择学科', trigger: 'change' }],
  questionContent: [{ required: true, message: '请输入题干内容', trigger: 'blur' }]
}

// 表单级联选项
const formVersionOptions = ref<any[]>([])
const formVolumeOptions = ref<any[]>([])
const formTopicTreeOptions = ref<any[]>([])
const formKnowledgeTreeOptions = ref<any[]>([])

// ========== 知识点权重配置 ==========
const useDefaultWeight = ref(true)
const knowledgeWeightMap = reactive<Record<string | number, number>>({})
const knowledgeMainMap = reactive<Record<string | number, number>>({})
const originalKnowledgeWeights = ref<Record<string | number, number>>({})

const weightSum = computed(() => {
  const kids = form.value.knowledgeIds || []
  if (kids.length <= 1) return 1.0
  let sum = 0
  kids.forEach((kid: number) => {
    sum += knowledgeWeightMap[kid] || 0
  })
  return Number(sum.toFixed(2))
})

const weightSumValid = computed(() => {
  const kids = form.value.knowledgeIds || []
  if (kids.length === 0) return true
  if (kids.length === 1) return true
  if (useDefaultWeight.value) return true
  return Math.abs(weightSum.value - 1.0) < 0.01
})

function getKnowledgeName(kid: number): string {
  const findName = (nodes: any[]): string | null => {
    for (const node of nodes) {
      if (node.knowledgeId === kid) return node.knowledgeName
      if (node.children && node.children.length) {
        const found = findName(node.children)
        if (found) return found
      }
    }
    return null
  }
  return findName(formKnowledgeTreeOptions.value) || `知识点${kid}`
}

function initKnowledgeWeights(questionData: any) {
  Object.keys(knowledgeWeightMap).forEach(k => delete knowledgeWeightMap[k])
  Object.keys(knowledgeMainMap).forEach(k => delete knowledgeMainMap[k])
  originalKnowledgeWeights.value = {}
  useDefaultWeight.value = true

  const ids = form.value.knowledgeIds || []
  if (questionData?.knowledgeList && questionData.knowledgeList.length > 0) {
    for (const k of questionData.knowledgeList) {
      if (k.knowledgeId) {
        knowledgeMainMap[k.knowledgeId] = k.isMain || 0
        if (k.weight != null) {
          knowledgeWeightMap[k.knowledgeId] = Number(k.weight)
          originalKnowledgeWeights.value[k.knowledgeId] = Number(k.weight)
          useDefaultWeight.value = false
        } else {
          knowledgeWeightMap[k.knowledgeId] = calcDefaultWeightFor(k.knowledgeId, ids)
        }
      }
    }
  } else {
    for (let i = 0; i < ids.length; i++) {
      const kid = ids[i]
      knowledgeMainMap[kid] = i === 0 ? 1 : 0
      knowledgeWeightMap[kid] = calcDefaultWeightFor(kid, ids)
    }
  }
}

function calcDefaultWeightFor(kid: number, allIds: number[]): number {
  const n = allIds.length
  if (n <= 1) return 1.0
  const isMain = knowledgeMainMap[kid] === 1

  if (isMain) {
    const mainWeight = n === 2 ? 0.60 : n === 3 ? 0.50 : 0.40
    return Number(mainWeight.toFixed(4))
  }
  const hasMain = Object.values(knowledgeMainMap).some(v => v === 1)
  if (hasMain) {
    const mainWeight = n === 2 ? 0.60 : n === 3 ? 0.50 : 0.40
    const otherWeight = (1.0 - mainWeight) / (n - 1)
    return Number(otherWeight.toFixed(4))
  }
  return Number((1.0 / n).toFixed(4))
}

function handleMainChange(kid: number, val: number) {
  if (val === 1) {
    Object.keys(knowledgeMainMap).forEach(k => {
      if (String(k) !== String(kid)) {
        knowledgeMainMap[k] = 0
      }
    })
  }
  if (useDefaultWeight.value) {
    const ids = form.value.knowledgeIds || []
    ids.forEach((id: number) => {
      knowledgeWeightMap[id] = calcDefaultWeightFor(id, ids)
    })
  }
}

function handleWeightChange(changedKid: number, newVal: number) {
  if (useDefaultWeight.value) return
  const kids = form.value.knowledgeIds || []
  if (kids.length <= 1) return

  const others = kids.filter((k: number) => String(k) !== String(changedKid))
  if (others.length === 0) return

  const remaining = 1.0 - (newVal || 0)
  const perOther = Number((remaining / others.length).toFixed(4))
  others.forEach((k: number) => {
    knowledgeWeightMap[k] = perOther
  })
}

function removeKnowledge(kid: number) {
  const idx = form.value.knowledgeIds.indexOf(kid)
  if (idx >= 0) {
    form.value.knowledgeIds.splice(idx, 1)
  }
  delete knowledgeWeightMap[kid]
  delete knowledgeMainMap[kid]
  const ids = form.value.knowledgeIds || []
  if (useDefaultWeight.value) {
    ids.forEach((id: number) => {
      knowledgeWeightMap[id] = calcDefaultWeightFor(id, ids)
    })
  } else {
    ids.forEach((id: number) => {
      knowledgeWeightMap[id] = Number((1.0 / ids.length).toFixed(4))
    })
  }
}

function buildSubmitKnowledge() {
  const ids = form.value.knowledgeIds || []
  if (ids.length === 0) {
    return { knowledgeIds: [], knowledgeList: [] }
  }
  if (!useDefaultWeight.value) {
    const knowledgeList = ids.map((kid: number, idx: number) => ({
      knowledgeId: kid,
      isMain: knowledgeMainMap[kid] || 0,
      weight: knowledgeWeightMap[kid] || calcDefaultWeightFor(kid, ids),
      sort: idx
    }))
    return { knowledgeList, knowledgeIds: [] }
  }
  return { knowledgeIds: [...ids], knowledgeList: [] }
}

// 监听知识点选择变化，自动初始化权重
watch(() => form.value.knowledgeIds, (newIds, oldIds) => {
  if (!newIds || newIds.length === 0) {
    Object.keys(knowledgeWeightMap).forEach(k => delete knowledgeWeightMap[k])
    Object.keys(knowledgeMainMap).forEach(k => delete knowledgeMainMap[k])
    useDefaultWeight.value = true
    return
  }
  const oldSet = new Set((oldIds || []).map(String))
  const newSet = new Set(newIds.map(String))
  if (oldSet.size !== newSet.size || [...oldSet].some(k => !newSet.has(k))) {
    initKnowledgeWeights(null)
  }
}, { deep: true })

// ========== 表单操作 ==========
function resetForm() {
  form.value = {
    questionId: null, questionCode: null, questionType: 1, difficulty: 2,
    subjectId: undefined, gradeId: undefined, versionId: undefined, volumeId: undefined,
    topicId: undefined, knowledgeIds: [], defaultScore: 1.0,
    questionContent: '', questionContentText: '', optionsJson: null,
    answerContent: '', answerAnalysis: '', sourceType: 1, isPublic: 1,
    status: 0, remark: null
  }
  optionsList.value = [{ content: '' }]
  judgeAnswer.value = '1'
  formVersionOptions.value = []
  formVolumeOptions.value = []
  formTopicTreeOptions.value = []
  formKnowledgeTreeOptions.value = []
  useDefaultWeight.value = true
  Object.keys(knowledgeWeightMap).forEach(k => delete knowledgeWeightMap[k])
  Object.keys(knowledgeMainMap).forEach(k => delete knowledgeMainMap[k])
  originalKnowledgeWeights.value = {}
}

function handleManualAdd() {
  resetForm()
  resetSession()
  isEdit.value = false
  dialogTitle.value = '新增试题'
  dialogVisible.value = true
}

async function handleEdit(row: Question) {
  resetForm()
  isEdit.value = true
  dialogTitle.value = '编辑试题'
  try {
    const detail = await getQuestionDetail(row.questionId)
    form.value = { ...detail }
    // 恢复选项
    if (detail.optionsJson) {
      try {
        const opts = JSON.parse(detail.optionsJson)
        if (Array.isArray(opts)) {
          optionsList.value = opts.map((o: any) => ({ content: o.content || o.optionContent || o.label || '' }))
        }
      } catch { optionsList.value = [{ content: '' }, { content: '' }, { content: '' }, { content: '' }] }
    } else {
      optionsList.value = [{ content: '' }, { content: '' }, { content: '' }, { content: '' }]
    }
    // 判断题答案
    if (detail.questionType === 3) {
      judgeAnswer.value = detail.answerContent || '1'
    }
    // 恢复级联选项
    const subjectId = detail.subjectId
    const versionId = detail.versionId
    const volumeId = detail.volumeId
    if (subjectId) {
      try { formVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { formVersionOptions.value = [] }
    }
    if (versionId) {
      try { formVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { formVolumeOptions.value = [] }
    }
    if (volumeId) {
      try { formTopicTreeOptions.value = await getTopicTree(volumeId) } catch { formTopicTreeOptions.value = [] }
      try { formKnowledgeTreeOptions.value = await getKnowledgeOptionsByVolume(volumeId) } catch { formKnowledgeTreeOptions.value = [] }
    }
    // 加载完知识点树后初始化权重数据
    nextTick(() => {
      initKnowledgeWeights(detail)
    })
  } catch {
    form.value = { ...row }
  }
  dialogVisible.value = true
}

// ========== 表单级联 ==========
async function handleSubjectChange(subjectId: number) {
  form.value.versionId = undefined
  form.value.volumeId = undefined
  form.value.topicId = undefined
  form.value.knowledgeIds = []
  formVersionOptions.value = []
  formVolumeOptions.value = []
  formTopicTreeOptions.value = []
  formKnowledgeTreeOptions.value = []
  if (subjectId) {
    try { formVersionOptions.value = await getVersionOptionsBySubject(subjectId) } catch { formVersionOptions.value = [] }
  }
}

async function handleVersionChange(versionId: number) {
  form.value.volumeId = undefined
  form.value.topicId = undefined
  form.value.knowledgeIds = []
  formVolumeOptions.value = []
  formTopicTreeOptions.value = []
  formKnowledgeTreeOptions.value = []
  if (versionId) {
    try { formVolumeOptions.value = await getVolumeOptionsByVersion(versionId) } catch { formVolumeOptions.value = [] }
  }
}

async function handleVolumeChange(volumeId: number) {
  form.value.topicId = undefined
  form.value.knowledgeIds = []
  formTopicTreeOptions.value = []
  formKnowledgeTreeOptions.value = []
  if (volumeId) {
    try { formTopicTreeOptions.value = await getTopicTree(volumeId) } catch { formTopicTreeOptions.value = [] }
    try { formKnowledgeTreeOptions.value = await getKnowledgeOptionsByVolume(volumeId) } catch { formKnowledgeTreeOptions.value = [] }
    // 自动设置年级
    const selectedVolume = formVolumeOptions.value.find((v: any) => v.volumeId === volumeId)
    if (selectedVolume && selectedVolume.gradeId) {
      form.value.gradeId = selectedVolume.gradeId
    }
  }
}

// ========== 选项操作 ==========
function addOption() {
  if (optionsList.value.length < 8) optionsList.value.push({ content: '' })
}

function removeOption(idx: number) {
  optionsList.value.splice(idx, 1)
}

// ========== 试题编码生成 ==========
function generateQuestionCode(content: string, questionType: number, optionsJson: string): string {
  let str = (questionType ? 'T' + questionType + '_' : '') + stripHtml(content || '')

  if (optionsJson) {
    try {
      const opts = typeof optionsJson === 'string' ? JSON.parse(optionsJson) : optionsJson
      if (Array.isArray(opts)) {
        str += '_O' + opts.map((o: any) => (o.content || o.label || '')).join('|')
      }
    } catch { /* ignore */ }
  }

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const imgMatches = content ? Array.from(content.matchAll(imgRegex)) : []
  if (imgMatches.length > 0) {
    const urls = imgMatches.map(m => m[1]).filter(Boolean).sort()
    str += '_I' + urls.join(',')
  }

  let h1 = 0, h2 = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(31, h1) + ch | 0
    h2 = Math.imul(37, h2) + ch | 0
  }
  const h1x = (h1 >>> 0).toString(16).toUpperCase().padStart(8, '0')
  const h2x = (h2 >>> 0).toString(16).toUpperCase().padStart(8, '0')
  return 'Q' + (h1x + h2x).slice(0, 12)
}

function stripHtml(html: string): string {
  if (!html) return ''
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s{2,}/g, ' ').trim()
}

// ========== 提交表单 ==========
function buildOptionsJson() {
  if ([1, 2].includes(form.value.questionType)) {
    form.value.optionsJson = JSON.stringify(
      optionsList.value.map((opt, idx) => ({
        label: String.fromCharCode(65 + idx),
        content: opt.content
      }))
    )
  } else if (form.value.questionType === 3) {
    form.value.optionsJson = JSON.stringify([
      { label: 'A', content: '正确' },
      { label: 'B', content: '错误' }
    ])
    form.value.answerContent = judgeAnswer.value
  }
}

async function submitForm() {
  try {
    await formRef.value?.validate()
  } catch { return }

  // 构建选项JSON
  buildOptionsJson()

  // 生成试题编码
  form.value.questionCode = generateQuestionCode(
    form.value.questionContent, form.value.questionType, form.value.optionsJson
  )

  // 提取题干纯文本
  form.value.questionContentText = stripHtml(form.value.questionContent).substring(0, 1000)

  // 确保session存在
  await ensureSession()

  // 处理图片
  const fields = ['questionContent', 'answerContent', 'answerAnalysis']
  for (const field of fields) {
    if (form.value[field]) {
      form.value[field] = await processImages(form.value[field])
    }
  }
  // 处理选项中的图片
  if (form.value.optionsJson) {
    try {
      const opts = JSON.parse(form.value.optionsJson)
      let optsChanged = false
      for (const opt of opts) {
        if (opt.content) {
          opt.content = await processImages(opt.content)
          optsChanged = true
        }
      }
      if (optsChanged) {
        form.value.optionsJson = JSON.stringify(opts)
      }
    } catch { /* ignore */ }
  }

  // 构建提交数据
  const submitKnowledge = buildSubmitKnowledge()
  const submitData = {
    questionId: form.value.questionId,
    questionCode: form.value.questionCode,
    questionType: form.value.questionType,
    questionContent: form.value.questionContent,
    questionContentText: form.value.questionContentText,
    optionsJson: form.value.optionsJson,
    answerContent: form.value.answerContent,
    answerAnalysis: form.value.answerAnalysis,
    subjectId: form.value.subjectId,
    gradeId: form.value.gradeId,
    versionId: form.value.versionId,
    volumeId: form.value.volumeId,
    topicId: form.value.topicId,
    ...submitKnowledge,
    difficulty: form.value.difficulty,
    defaultScore: form.value.defaultScore,
    sourceType: form.value.sourceType,
    isPublic: form.value.isPublic,
    status: form.value.status,
    remark: form.value.remark || null
  }

  try {
    if (isEdit.value) {
      await updateQuestion(submitData)
      ElMessage.success('修改成功')
    } else {
      const result = await addQuestion(submitData)
      const dupData = result?.data?.duplicate || result?.duplicate
      if (dupData && dupData.hasDuplicate && dupData.duplicates?.length > 0) {
        showDuplicateDialog(dupData.duplicates)
      } else {
        ElMessage.success('新增成功')
      }
    }
    dialogVisible.value = false
    fetchQuestionList()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

// ========== 查重对话框 ==========
const questionTypeLabels: Record<number, string> = { 1: '单选题', 2: '多选题', 3: '判断题', 4: '填空题', 5: '简答题', 6: '计算题' }

function showDuplicateDialog(duplicates: any[]) {
  const listHtml = duplicates.map((d, i) => {
    const typeLabel = questionTypeLabels[d.questionType] || '其他'
    const pct = (d.similarity * 100).toFixed(1)
    return `<div style="margin-bottom:8px;padding:8px;background:#f5f7fa;border-radius:4px">
      <strong>#${i + 1}</strong>
      <span style="margin-left:6px;font-size:12px;color:#409eff">相似度 ${pct}%</span>
      <span style="margin-left:4px;font-size:12px;color:#e6a23c">${typeLabel}</span>
      <span style="margin-left:6px;color:#909399;font-size:12px">编码: ${d.questionCode || '-'}</span>
      <p style="margin:4px 0 0;font-size:13px;color:#606266">${d.questionContent || ''}</p>
    </div>`
  }).join('')

  ElMessageBox.alert(
    `<div style="max-height:360px;overflow-y:auto">${listHtml}</div>`,
    '检测到重复试题',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '知道了',
      type: 'warning',
      customClass: 'duplicate-warn-dialog'
    }
  ).then(() => {
    ElMessage.success('新增成功')
  })
}

// ========== 删除 ==========
async function handleDelete(row: Question) {
  try {
    await ElMessageBox.confirm('确定要删除该试题吗？删除后可在回收站恢复。', '提示', { type: 'warning' })
    await deleteQuestion(row.questionId)
    ElMessage.success('删除成功')
    fetchQuestionList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

async function handleBatchDelete() {
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 道试题吗？`, '提示', { type: 'warning' })
    await deleteQuestion(selectedIds.value.join(','))
    ElMessage.success('删除成功')
    fetchQuestionList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

// ========== 提交审核 ==========
async function handleSubmitAudit(row: Question) {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', { type: 'info' })
    await submitAudit(row.questionId)
    ElMessage.success('提交成功')
    fetchQuestionList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('提交失败') }
}

// ========== 预览 ==========
const previewDialogVisible = ref(false)
const previewQuestion = ref<Question | null>(null)

function handlePreview(row: Question) {
  previewQuestion.value = row
  previewDialogVisible.value = true
}

function parseOptions(optionsJson: string): any[] {
  if (!optionsJson) return []
  try { return JSON.parse(optionsJson) } catch { return [] }
}

function getPreviewKnowledgeList(q: Question): string[] {
  if (q.knowledgeList && Array.isArray(q.knowledgeList)) {
    return q.knowledgeList.map((k: any) => k.knowledgeName || `知识点${k.knowledgeId}`)
  }
  if (q.knowledgeNames) {
    if (typeof q.knowledgeNames === 'string') return q.knowledgeNames.split(',')
    if (Array.isArray(q.knowledgeNames)) return q.knowledgeNames
  }
  return []
}

// ========== 互联网试题 ==========
const webQuestionVisible = ref(false)
const webQuestionSessionUuid = ref('')

async function handleWebQuestion() {
  const sid = await ensureSession()
  webQuestionSessionUuid.value = sid || ''
  webQuestionVisible.value = true
}

function handleWebQuestionApply(webData: any) {
  if (!webData) return

  resetForm()
  resetSession()

  if (webData.questionContent) {
    form.value.questionContent = webData.questionContent
  }
  if (webData.questionContentText) {
    form.value.questionContentText = webData.questionContentText
  }
  if (webData.questionType) {
    form.value.questionType = webData.questionType
  }
  if (webData.optionsJson) {
    try {
      if (Array.isArray(webData.optionsJson)) {
        optionsList.value = webData.optionsJson.map((p: any) => ({ content: p.content || p.label || '' }))
      } else if (typeof webData.optionsJson === 'string') {
        const parsed = JSON.parse(webData.optionsJson)
        if (Array.isArray(parsed)) {
          optionsList.value = parsed.map((p: any) => ({ content: p.content || p.label || '' }))
        }
      }
    } catch { /* ignore */ }
  }
  if (webData.sourceType) {
    form.value.sourceType = webData.sourceType
  }

  isEdit.value = false
  dialogTitle.value = '新增试题'
  dialogVisible.value = true
}

// ========== Word导入 ==========
const wordUploaderVisible = ref(false)

function handleDocxImport() {
  wordUploaderVisible.value = true
}

// ========== 拍照识题 ==========
const ocrRecognizerVisible = ref(false)

function handleOcrRecognize() {
  ocrRecognizerVisible.value = true
}

function handleOcrApply(result: any) {
  if (!result) return

  resetForm()
  resetSession()

  if (result.questionContent) {
    form.value.questionContent = result.questionContent
  }
  if (result.questionType) {
    form.value.questionType = result.questionType
  }
  if (result.optionsJson) {
    try {
      const parsed = typeof result.optionsJson === 'string' ? JSON.parse(result.optionsJson) : result.optionsJson
      if (Array.isArray(parsed)) {
        optionsList.value = parsed.map((o: any) => ({ content: o.content || o.optionContent || '' }))
      }
    } catch { /* ignore */ }
  }
  if (result.answerContent) {
    form.value.answerContent = result.answerContent
  }
  if (result.answerAnalysis) {
    form.value.answerAnalysis = result.answerAnalysis
  }
  form.value.sourceType = 2

  isEdit.value = false
  dialogTitle.value = '新增试题'
  dialogVisible.value = true
}

// ========== 智能识题 ==========
const minerURecognizerVisible = ref(false)

function handleMinerURecognize() {
  minerURecognizerVisible.value = true
}

function handleMinerUApply(result: any) {
  if (!result) return

  resetForm()
  resetSession()

  if (result.questionContent) {
    form.value.questionContent = result.questionContent
  }
  if (result.questionType) {
    form.value.questionType = result.questionType
  }
  if (result.optionsJson) {
    try {
      const parsed = typeof result.optionsJson === 'string' ? JSON.parse(result.optionsJson) : result.optionsJson
      if (Array.isArray(parsed)) {
        optionsList.value = parsed.map((o: any) => ({ content: o.content || o.optionContent || '' }))
      }
    } catch { /* ignore */ }
  }
  if (result.answerContent) {
    form.value.answerContent = result.answerContent
  }
  if (result.answerAnalysis) {
    form.value.answerAnalysis = result.answerAnalysis
  }
  form.value.sourceType = 2

  isEdit.value = false
  dialogTitle.value = '新增试题'
  dialogVisible.value = true
}

// ========== 对话框关闭 ==========
function handleDialogClose() {
  resetSession()
}

// ========== 回收站 ==========
const recycleDialogVisible = ref(false)
const recycleLoading = ref(false)
const recycleList = ref<Question[]>([])
const recycleTotal = ref(0)
const recycleSelectedIds = ref<number[]>([])
const recycleQueryParams = ref<TeacherQuestionQuery>({
  pageNum: 1,
  pageSize: 10,
  questionCode: ''
})

async function fetchRecycleList() {
  recycleLoading.value = true
  try {
    const result = await getRecycleList(recycleQueryParams.value)
    recycleList.value = result.rows
    recycleTotal.value = result.total
  } catch (e) {
    console.error('获取回收站列表失败:', e)
  } finally {
    recycleLoading.value = false
  }
}

async function handleRestoreQuestion(row: Question) {
  try {
    await ElMessageBox.confirm('确定要恢复该试题吗？', '提示', { type: 'info' })
    await restoreQuestion(row.questionId)
    ElMessage.success('恢复成功')
    fetchRecycleList()
    fetchQuestionList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('恢复失败') }
}

async function handleBatchRestore() {
  try {
    await ElMessageBox.confirm(`确定要恢复选中的 ${recycleSelectedIds.value.length} 道试题吗？`, '提示', { type: 'info' })
    await restoreQuestion(recycleSelectedIds.value.join(','))
    ElMessage.success('恢复成功')
    fetchRecycleList()
    fetchQuestionList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('恢复失败') }
}

async function handlePermanentDeleteQuestion(row: Question) {
  try {
    await ElMessageBox.confirm('彻底删除后不可恢复，确定要删除吗？', '警告', { type: 'warning' })
    await permanentDeleteQuestion(row.questionId)
    ElMessage.success('删除成功')
    fetchRecycleList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

async function handleBatchPermanentDelete() {
  try {
    await ElMessageBox.confirm(`彻底删除后不可恢复，确定要删除选中的 ${recycleSelectedIds.value.length} 道试题吗？`, '警告', { type: 'warning' })
    await permanentDeleteQuestion(recycleSelectedIds.value.join(','))
    ElMessage.success('删除成功')
    fetchRecycleList()
  } catch (e) { if (e !== 'cancel') ElMessage.error('删除失败') }
}

function handleRecycleSelectionChange(selection: Question[]) {
  recycleSelectedIds.value = selection.map(item => item.questionId)
}

watch(recycleDialogVisible, (val) => {
  if (val) {
    recycleQueryParams.value.pageNum = 1
    fetchRecycleList()
  }
})

// ========== 格式化工具 ==========
function getQuestionTypeLabel(type: number): string {
  const map: Record<number, string> = { 1: '单选', 2: '多选', 3: '判断', 4: '填空', 5: '简答', 6: '计算' }
  return map[type] || '未知'
}

function getQuestionTypeTag(type: number): string {
  const map: Record<number, string> = { 1: '', 2: 'success', 3: 'warning', 4: 'info', 5: 'danger', 6: '' }
  return map[type] || 'info'
}

function getDifficultyLabel(d: number): string {
  const map: Record<number, string> = { 1: '简单', 2: '中等', 3: '较难', 4: '困难', 5: '极难' }
  return map[d] || '未知'
}

function getDifficultyTag(d: number): string {
  const map: Record<number, string> = { 1: 'success', 2: '', 3: 'warning', 4: 'danger', 5: 'danger' }
  return map[d] || 'info'
}

function getStatusLabel(s: number): string {
  const map: Record<number, string> = { 0: '草稿', 1: '待审核', 2: '已发布', 3: '已下架' }
  return map[s] || '未知'
}

function getStatusTag(s: number): string {
  const map: Record<number, string> = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[s] || 'info'
}

// ========== 初始化 ==========
onMounted(async () => {
  fetchQuestionList()
  try {
    subjectOptions.value = await getSubjectOptions()
    gradeOptions.value = await getGradeOptions()
  } catch { /* ignore */ }
})
</script>

<style scoped>
.teacher-question-page {
  min-height: calc(100vh - 60px);
  padding: 24px 0;
  background: var(--bg-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 4px 0;
  font-size: 22px;
}

.page-desc {
  margin: 0;
  color: #999;
  font-size: 13px;
}

.search-card,
.toolbar-card,
.table-card {
  margin-bottom: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 题干内容单元格 */
.content-cell {
  max-height: 48px;
  overflow: hidden;
  line-height: 1.5;
  word-break: break-all;
}

.content-cell :deep(img) {
  max-width: 40px;
  max-height: 40px;
  vertical-align: middle;
}

.content-cell :deep(p) {
  margin: 0;
  display: inline;
}

.content-cell :deep(.katex) {
  font-size: 0.9em;
}

/* 选项编辑 */
.options-editor {
  width: 100%;
}

.option-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8px;
  gap: 8px;
}

.option-tag {
  min-width: 28px;
  text-align: center;
  margin-top: 6px;
  flex-shrink: 0;
}

.option-editor {
  flex: 1;
  min-width: 0;
}

.option-delete-btn {
  margin-top: 6px;
  flex-shrink: 0;
}

/* 预览 */
.question-preview {
  padding: 12px;
}

.preview-header {
  margin-bottom: 12px;
}

.preview-meta {
  margin-bottom: 12px;
  font-size: 13px;
  color: #909399;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.preview-content {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
}

.preview-content :deep(img) {
  max-width: 100%;
}

.preview-option {
  margin-bottom: 6px;
  padding: 4px 0;
}

.preview-option .option-label {
  font-weight: bold;
  margin-right: 8px;
}

/* 知识点权重配置面板 */
.knowledge-weight-panel {
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  max-width: 600px;
}

.weight-list .weight-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.weight-list .weight-item + .weight-item {
  border-top: 1px dashed #e4e7ed;
}

.weight-label {
  min-width: 120px;
  font-size: 13px;
  color: #303133;
}

.weight-hint {
  font-size: 12px;
  color: #909399;
}

.weight-summary {
  margin-top: 8px;
  padding-top: 6px;
  border-top: 1px solid #dcdfe6;
  font-size: 13px;
  color: #606266;
}

.weight-valid {
  font-weight: 600;
  color: #67c23a;
}

.weight-invalid {
  font-weight: 600;
  color: #f56c6c;
}

.weight-warning {
  font-size: 12px;
  color: #e6a23c;
  margin-left: 8px;
}

/* 回收站 */
.recycle-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recycle-toolbar-left {
  display: flex;
  gap: 8px;
}

.recycle-toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
