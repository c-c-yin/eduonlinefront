<template>
  <div class="teacher-video-page">
    <div class="container">
      <div class="page-header">
        <h1>我的视频</h1>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增视频
        </el-button>
      </div>

      <div class="filter-section">
        <el-form :model="queryParams" inline>
          <el-form-item label="视频名称">
            <el-input v-model="queryParams.videoName" placeholder="请输入视频名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 120px">
              <el-option label="草稿" :value="0" />
              <el-option label="待审核" :value="1" />
              <el-option label="已发布" :value="2" />
              <el-option label="已下架" :value="3" />
            </el-select>
          </el-form-item>
          <el-form-item label="审核状态">
            <el-select v-model="queryParams.auditStatus" placeholder="请选择审核状态" clearable style="width: 120px">
              <el-option label="未审核" :value="0" />
              <el-option label="审核通过" :value="1" />
              <el-option label="审核驳回" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="创建时间">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 240px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleQuery">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            <el-icon><Delete /></el-icon>
            批量删除
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-button @click="recycleDialogVisible = true">
            <el-icon><Delete /></el-icon>
            回收站
          </el-button>
          <el-button @click="handleExport">
            <el-icon><Download /></el-icon>
            导出Excel
          </el-button>
          <el-button @click="handlePrint">
            <el-icon><Printer /></el-icon>
            打印
          </el-button>
        </div>
      </div>

      <div class="video-list">
        <el-table :data="videoList" v-loading="loading" stripe id="video-table" @selection-change="handleSelectionChange">
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column prop="videoName" label="视频名称" min-width="200">
            <template #default="{ row }">
              <div class="video-name">
                <el-image v-if="row.coverPath" :src="row.coverPath" class="video-cover" fit="cover" />
                <div class="video-info">
                  <span class="name">{{ row.videoName }}</span>
                  <span class="desc" v-if="row.videoDesc">{{ row.videoDesc }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="时长" width="100" align="center">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column prop="viewCount" label="观看次数" width="100" align="center" />
          <el-table-column prop="collectCount" label="收藏次数" width="100" align="center" />
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tooltip v-if="row.auditStatus === 2 && row.rejectReason" :content="'驳回原因：' + row.rejectReason" placement="top">
                <el-tag :type="getStatusType(row.status)" class="cursor-pointer">{{ getStatusText(row.status) }}</el-tag>
              </el-tooltip>
              <el-tag v-else :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="auditStatus" label="审核状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.auditStatus !== null" :type="getAuditStatusType(row.auditStatus)">
                {{ getAuditStatusText(row.auditStatus) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
          <el-table-column label="操作" width="320" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleView(row)">查看</el-button>
              <el-button v-if="row.status === 0 || row.status === 1 || row.auditStatus === 2" link type="primary" @click="handleEdit(row)">编辑</el-button>
              <el-button v-if="row.status !== 2" link type="primary" @click="handleResource(row)">资源</el-button>
              <el-button v-if="row.status !== 2" link type="primary" @click="handleKnowledge(row)">知识点</el-button>
              <el-button v-if="row.status !== 2" link type="danger" @click="handleDelete(row)">删除</el-button>
              <el-button v-if="row.status === 0" link type="success" @click="handleSubmit(row)">提交审核</el-button>
              <el-button v-if="row.auditStatus === 2 && row.status !== 2" link type="warning" @click="handleRepublish(row)">重新提交</el-button>
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
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="videoDialogVisible" :title="dialogTitle" width="900px" destroy-on-close>
      <el-form ref="formRef" :model="videoForm" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="视频名称" prop="videoName">
              <el-input v-model="videoForm.videoName" placeholder="请输入视频名称" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="课程二级分类" prop="courseSubType">
              <el-select v-model="videoForm.courseSubType" placeholder="请选择课程二级分类" clearable style="width: 100%">
                <el-option v-for="dict in courseSubTypeOptions" :key="dict.value" :label="dict.label" :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年级" prop="gradeId">
              <el-select v-model="videoForm.gradeId" placeholder="请选择年级" clearable style="width: 100%" @change="handleGradeChange">
                <el-option v-for="item in gradeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学科" prop="subjectId">
              <el-select v-model="videoForm.subjectId" placeholder="请选择学科" clearable style="width: 100%" @change="handleSubjectChange">
                <el-option v-for="item in subjectOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="教材版本" prop="versionId">
              <el-select v-model="videoForm.versionId" placeholder="请选择教材版本" clearable style="width: 100%" @change="handleVersionChange">
                <el-option v-for="item in textbookVersionOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="教材册次" prop="volumeId">
              <el-select v-model="videoForm.volumeId" placeholder="请选择教材册次" clearable style="width: 100%" @change="handleVolumeChange">
                <el-option v-for="item in volumeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课题" prop="topicId">
              <el-select v-model="videoForm.topicId" placeholder="请选择课题" clearable style="width: 100%">
                <el-option v-for="item in topicOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="存储类型" prop="storageType">
              <el-select v-model="videoForm.storageType" placeholder="请选择存储类型" style="width: 100%">
                <el-option label="本地存储" :value="1" />
                <el-option label="云存储" :value="2" />
                <el-option label="混合存储" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="授课人类型" prop="teacherType">
              <el-select v-model="videoForm.teacherType" placeholder="请选择授课人类型" style="width: 100%">
                <el-option label="内部教师" :value="1" />
                <el-option label="外部教师" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="videoForm.teacherType === 1">
            <el-form-item label="内部教师" prop="innerTeacherId">
              <el-select v-model="videoForm.innerTeacherId" placeholder="请选择内部教师" clearable style="width: 100%">
                <el-option v-for="item in teacherOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="videoForm.teacherType === 2">
          <el-col :span="12">
            <el-form-item label="外部教师姓名" prop="outerTeacherName">
              <el-input v-model="videoForm.outerTeacherName" placeholder="请输入外部教师姓名" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="外部教师组织" prop="outerTeacherOrg">
              <el-input v-model="videoForm.outerTeacherOrg" placeholder="请输入外部教师组织" maxlength="128" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="videoForm.teacherType === 2">
          <el-col :span="24">
            <el-form-item label="外部教师简介" prop="outerTeacherIntro">
              <el-input v-model="videoForm.outerTeacherIntro" type="textarea" :rows="3" placeholder="请输入外部教师简介" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="视频文件" prop="filePath">
              <div class="upload-switch">
                <el-radio-group v-model="inputType" size="small" style="margin-bottom: 8px">
                  <el-radio-button :value="1">上传文件</el-radio-button>
                  <el-radio-button :value="2">手动输入</el-radio-button>
                </el-radio-group>
                <VideoUpload
                  v-if="inputType === 1"
                  v-model="videoForm.filePath"
                  v-model:file-name="videoForm.fileFormat"
                  v-model:file-size="videoForm.fileSize"
                  @uploaded="handleVideoUploaded"
                />
                <el-input v-else v-model="videoForm.filePath" placeholder="请输入视频路径" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="视频时长" prop="duration">
              <el-input-number v-model="videoForm.duration" :min="0" placeholder="秒" style="width: 100%" />
              <div class="form-tip" v-if="videoForm.filePath">上传视频时自动获取</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分辨率" prop="resolution">
              <el-input v-model="videoForm.resolution" placeholder="如：1080P、720P" maxlength="20" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="视频格式" prop="fileFormat">
              <el-input v-model="videoForm.fileFormat" placeholder="如：mp4、avi" maxlength="8" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件大小" prop="fileSize">
              <el-input-number v-model="videoForm.fileSize" :min="0" placeholder="KB" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="封面图片" prop="coverPath">
              <ImageUpload v-model="videoForm.coverPath" :show-tip="true" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="视频描述" prop="videoDesc">
              <el-input v-model="videoForm.videoDesc" type="textarea" :rows="3" placeholder="请输入视频描述" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="appStore.topicVisibleToTeacher || appStore.broadcastVisibleToTeacher">
          <el-col :span="12" v-if="appStore.topicVisibleToTeacher">
            <el-form-item label="参加专题" prop="selectedTopicIds">
              <el-select v-model="selectedTopicIds" multiple placeholder="请选择要参加的专题" style="width: 100%" @change="handleTopicChange">
                <el-option v-for="item in visibleTopics" :key="item.topicId" :label="item.topicName" :value="item.topicId" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="appStore.broadcastVisibleToTeacher">
            <el-form-item label="参加展播" prop="selectedBatchIds">
              <el-select v-model="selectedBatchIds" multiple placeholder="请选择要参加的展播" style="width: 100%" @change="handleBatchChange">
                <el-option v-for="item in visibleBatches" :key="item.batchId" :label="item.batchName" :value="item.batchId">
                  <span>{{ item.batchName }}</span>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 12px">{{ item.batchStartTime?.substring(0, 10) }} ~ {{ item.batchEndTime?.substring(0, 10) }}</span>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="videoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resourceDialogVisible" title="资源管理" width="900px" destroy-on-close>
      <div class="resource-toolbar">
        <el-button type="primary" @click="handleAddResource">
          <el-icon><Plus /></el-icon>
          添加资源
        </el-button>
      </div>
      <el-table :data="resourceList" v-loading="resourceLoading" stripe>
        <el-table-column prop="resourceName" label="资源名称" min-width="150" />
        <el-table-column prop="resourceType" label="资源类型" width="100" align="center">
          <template #default="{ row }">
            {{ getResourceTypeText(row.resourceType) }}
          </template>
        </el-table-column>
        <el-table-column prop="fileSize" label="文件大小" width="100" align="center">
          <template #default="{ row }">
            {{ formatFileSize(row.fileSize) }}
          </template>
        </el-table-column>
        <el-table-column prop="isPublic" label="公开" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isPublic === 1 ? 'success' : 'info'" size="small">{{ row.isPublic === 1 ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditResource(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteResource(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="resourceFormDialogVisible" :title="resourceDialogTitle" width="600px" destroy-on-close>
      <el-form ref="resourceFormRef" :model="resourceForm" :rules="resourceRules" label-width="100px">
        <el-form-item label="资源名称" prop="resourceName">
          <el-input v-model="resourceForm.resourceName" placeholder="请输入资源名称" maxlength="200" />
        </el-form-item>
        <el-form-item label="资源类型" prop="resourceType">
          <el-select v-model="resourceForm.resourceType" placeholder="请选择资源类型" style="width: 100%">
            <el-option label="试题" :value="1" />
            <el-option label="学案" :value="2" />
            <el-option label="课件" :value="3" />
            <el-option label="教案" :value="4" />
            <el-option label="笔记" :value="5" />
            <el-option label="其他" :value="6" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源描述" prop="resourceDesc">
          <el-input v-model="resourceForm.resourceDesc" type="textarea" :rows="2" placeholder="请输入资源描述" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="文件路径" prop="filePath">
          <el-upload
            :action="resourceUploadUrl"
            :headers="uploadHeaders"
            :show-file-list="false"
            :before-upload="handleResourceBeforeUpload"
            :on-success="handleResourceUploadSuccess"
            :on-error="handleResourceUploadError"
            accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt"
          >
            <el-button type="primary" size="small">选取文件</el-button>
          </el-upload>
          <div v-if="resourceForm.filePath" class="resource-file-info">
            <el-icon><Document /></el-icon>
            <span>{{ resourceForm.fileName || resourceForm.filePath }}</span>
            <el-button link type="danger" size="small" @click="resourceForm.filePath = ''">删除</el-button>
          </div>
          <div class="form-tip">支持 pdf/docx/xlsx/pptx 格式，大小不超过 100MB</div>
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-radio-group v-model="resourceForm.isPublic">
            <el-radio :value="1">是</el-radio>
            <el-radio :value="0">否</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="resourceForm.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="resourceForm.remark" type="textarea" :rows="2" placeholder="请输入备注" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resourceFormDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitResource">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="knowledgeDialogVisible" title="知识点关联" width="700px" destroy-on-close>
      <div class="knowledge-content">
        <el-tree
          ref="knowledgeTreeRef"
          :data="knowledgeTreeData"
          :props="{ label: 'knowledgeName', children: 'children' }"
          show-checkbox
          node-key="knowledgeId"
          :default-checked-keys="selectedKnowledgeIds"
          :default-expanded-keys="expandedKnowledgeIds"
          check-strictly
        >
          <template #default="{ node, data }">
            <span class="knowledge-node">
              <span>{{ data.knowledgeName }}</span>
              <el-tag v-if="data.knowledgeId === mainKnowledgeId" type="success" size="small" style="margin-left: 8px">主要</el-tag>
            </span>
          </template>
        </el-tree>
      </div>
      <div class="knowledge-main-select" v-if="selectedKnowledgeIds.length > 0">
        <span>主要知识点：</span>
        <el-select v-model="mainKnowledgeId" placeholder="请选择主要知识点" style="width: 200px">
          <el-option
            v-for="id in selectedKnowledgeIds"
            :key="id"
            :label="getKnowledgeNameById(id)"
            :value="id"
          />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="knowledgeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveKnowledge">保存</el-button>
      </template>
    </el-dialog>

    <!-- 回收站对话框 -->
    <el-dialog v-model="recycleDialogVisible" title="回收站" width="1000px" destroy-on-close>
      <div class="recycle-toolbar">
        <div class="recycle-toolbar-left">
          <el-button type="primary" :disabled="recycleSelectedIds.length === 0" @click="handleBatchRestore">
            批量恢复
          </el-button>
          <el-button type="danger" :disabled="recycleSelectedIds.length === 0" @click="handleBatchPermanentDelete">
            批量彻底删除
          </el-button>
        </div>
        <el-input v-model="recycleQueryParams.videoName" placeholder="搜索视频名称" clearable style="width: 200px" @keyup.enter="fetchRecycleList" @clear="fetchRecycleList" />
      </div>
      <el-table :data="recycleList" v-loading="recycleLoading" stripe @selection-change="handleRecycleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="videoName" label="视频名称" min-width="200">
          <template #default="{ row }">
            <div class="video-name">
              <el-image v-if="row.coverPath" :src="row.coverPath" class="video-cover" fit="cover" />
              <span>{{ row.videoName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长" width="100" align="center">
          <template #default="{ row }">{{ formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="原状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="删除时间" width="180" align="center" />
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleRestore(row)">恢复</el-button>
            <el-button link type="danger" @click="handlePermanentDelete(row)">彻底删除</el-button>
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

    <!-- 视频预览对话框 -->
    <el-dialog v-model="previewDialogVisible" title="视频预览" width="800px" destroy-on-close>
      <div class="video-preview-container">
        <video v-if="previewVideoUrl" :src="previewVideoUrl" controls class="preview-video-player" />
        <el-empty v-else description="暂无视频可播放" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Plus, Delete, Download, Printer, Document } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useTeacherVideoApi, useTeacherResourceApi, useTeacherKnowledgeApi, type TeacherVideoQuery, type KnowledgeRelation, type VisibleTopic, type VisibleBatch } from '@/composables/useTeacherVideoApi'
import type { VideoResource } from '@/types'
import { get } from '@/utils/request'
import { getToken } from '@/utils/auth'
import { formatDuration, formatFileSize } from '@/utils/format'
import type { Video } from '@/types'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/user'
import { useExport } from '@/composables/useExport'
import { useEducationApi } from '@/composables/useEducationApi'
import VideoUpload from '@/components/common/VideoUpload.vue'
import ImageUpload from '@/components/common/ImageUpload.vue'

const userStore = useUserStore()
const { exportToExcel, printTable } = useExport()
const educationApi = useEducationApi()

definePageMeta({
  layout: 'default',
  middleware: ['teacher']
})

const { getMyVideoList, getVideoDetail, publishVideo, updateVideo, deleteVideo, batchDeleteVideo, submitForAudit, republish, getRecycleList, restoreVideo, restoreVideoBatch, permanentDeleteVideo, permanentDeleteVideoBatch, getVisibleTopics, getVisibleBatches } = useTeacherVideoApi()
const { getResourceList, addResource, updateResource, deleteResource } = useTeacherResourceApi()
const { getKnowledgeRelations, saveKnowledgeRelations } = useTeacherKnowledgeApi()
const appStore = useAppStore()

const loading = ref(false)
const videoList = ref<Video[]>([])
const total = ref(0)
const selectedIds = ref<number[]>([])
const dateRange = ref<string[]>([])
const queryParams = ref<TeacherVideoQuery>({
  pageNum: 1,
  pageSize: 10,
  videoName: '',
  status: undefined,
  auditStatus: undefined
})

const videoDialogVisible = ref(false)
const dialogTitle = ref('新增视频')
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const videoForm = ref<Partial<Video>>({
  videoName: '',
  videoDesc: '',
  videoType: 1,
  courseSubType: undefined,
  filePath: '',
  coverPath: '',
  duration: 0,
  fileFormat: '',
  resolution: '',
  fileSize: 0,
  storageType: 1,
  gradeId: undefined,
  subjectId: undefined,
  versionId: undefined,
  volumeId: undefined,
  topicId: undefined,
  teacherType: 1,
  innerTeacherId: undefined,
  outerTeacherName: '',
  outerTeacherOrg: '',
  outerTeacherIntro: ''
})

const rules: FormRules = {
  videoName: [{ required: true, message: '请输入视频名称', trigger: 'blur' }],
  duration: [{ required: true, message: '请输入视频时长', trigger: 'blur' }],
  filePath: [{ required: true, message: '请上传视频文件', trigger: 'change' }]
}

// 视频文件输入方式：1=上传 2=手动输入
const inputType = ref(1)

// 课程二级类型选项（视频类型固定为课程视频时的二级分类）
const courseSubTypeOptions = [
  { value: 1, label: '同步课堂' },
  { value: 2, label: '知识点解析' },
  { value: 3, label: '习题讲解' },
  { value: 4, label: '复习总结' },
  { value: 5, label: '拓展提高' }
]

const gradeOptions = ref<any[]>([])
const subjectOptions = ref<any[]>([])
const textbookVersionOptions = ref<any[]>([])
const volumeOptions = ref<any[]>([])
const topicOptions = ref<any[]>([])
const teacherOptions = ref<any[]>([])

const resourceDialogVisible = ref(false)
const resourceLoading = ref(false)
const resourceList = ref<VideoResource[]>([])
const currentVideoId = ref<number>(0)

const resourceFormDialogVisible = ref(false)
const resourceDialogTitle = ref('添加资源')
const isEditResource = ref(false)
const resourceFormRef = ref<FormInstance>()
const resourceForm = ref<any>({
  resourceName: '',
  resourceType: 1,
  resourceDesc: '',
  filePath: '',
  fileSize: 0,
  isPublic: 1,
  sort: 0,
  remark: ''
})

const resourceRules: FormRules = {
  resourceName: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  resourceType: [{ required: true, message: '请选择资源类型', trigger: 'change' }],
  filePath: [{ required: true, message: '请上传文件', trigger: 'change' }]
}

const knowledgeDialogVisible = ref(false)
const knowledgeTreeRef = ref()
const knowledgeTreeData = ref<any[]>([])
const selectedKnowledgeIds = ref<number[]>([])
const expandedKnowledgeIds = ref<number[]>([])
const mainKnowledgeId = ref<number | undefined>()

const visibleTopics = ref<VisibleTopic[]>([])
const visibleBatches = ref<VisibleBatch[]>([])
const selectedTopicIds = ref<number[]>([])
const selectedBatchIds = ref<number[]>([])

// 回收站相关状态
const recycleDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const previewVideoUrl = ref('')
const recycleLoading = ref(false)
const recycleList = ref<Video[]>([])
const recycleTotal = ref(0)
const recycleSelectedIds = ref<number[]>([])
const recycleQueryParams = ref<TeacherVideoQuery>({
  pageNum: 1,
  pageSize: 10,
  videoName: ''
})

const statusMap: Record<number, { text: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  0: { text: '草稿', type: 'info' },
  1: { text: '待审核', type: 'warning' },
  2: { text: '已发布', type: 'success' },
  3: { text: '已下架', type: 'danger' }
}

const auditStatusMap: Record<number, { text: string; type: '' | 'success' | 'warning' | 'info' | 'danger' }> = {
  0: { text: '未审核', type: 'info' },
  1: { text: '审核通过', type: 'success' },
  2: { text: '审核驳回', type: 'danger' }
}

function getStatusText(status: number) {
  return statusMap[status]?.text || '未知'
}

function getStatusType(status: number) {
  return statusMap[status]?.type || 'info'
}

function getAuditStatusText(status: number) {
  return auditStatusMap[status]?.text || '未知'
}

function getAuditStatusType(status: number) {
  return auditStatusMap[status]?.type || 'info'
}

function getResourceTypeText(type: number) {
  const types: Record<number, string> = { 1: '试题', 2: '学案', 3: '课件', 4: '教案', 5: '笔记', 6: '其他' }
  return types[type] || '未知'
}

async function fetchVideoList() {
  loading.value = true
  try {
    const params: any = { ...queryParams.value }
    if (dateRange.value?.length === 2) {
      params.beginTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const result = await getMyVideoList(params)
    videoList.value = result.rows
    total.value = result.total
  } catch (error) {
    console.error('获取视频列表失败:', error)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  queryParams.value.pageNum = 1
  fetchVideoList()
}

function handleSizeChange() {
  queryParams.value.pageNum = 1
  fetchVideoList()
}

function handlePageChange() {
  fetchVideoList()
}

function handleReset() {
  queryParams.value = {
    pageNum: 1,
    pageSize: 10,
    videoName: '',
    status: undefined,
    auditStatus: undefined
  }
  fetchVideoList()
}

function handleSelectionChange(selection: Video[]) {
  selectedIds.value = selection.map(item => item.videoId)
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增视频'
  inputType.value = 1
  videoForm.value = {
    videoName: '',
    videoDesc: '',
    videoType: 1,
    courseSubType: 1,
    filePath: '',
    coverPath: '',
    duration: 0,
    fileFormat: '',
    resolution: '',
    fileSize: 0,
    storageType: 1,
    gradeId: undefined,
    subjectId: undefined,
    versionId: undefined,
    volumeId: undefined,
    topicId: undefined,
    teacherType: 1,
    innerTeacherId: userStore.teacherId || userStore.userId,
    outerTeacherName: '',
    outerTeacherOrg: '',
    outerTeacherIntro: '',
    topicIds: undefined,
    batchIds: undefined
  }
  selectedTopicIds.value = []
  selectedBatchIds.value = []
  fetchVisibleOptions()
  fetchTeacherOptions()
  videoDialogVisible.value = true
}

async function handleEdit(row: Video) {
  isEdit.value = true
  dialogTitle.value = '编辑视频'
  inputType.value = 1
  try {
    const detail = await getVideoDetail(row.videoId)
    videoForm.value = { ...detail }
  } catch (e) {
    videoForm.value = { ...row }
  }
  videoForm.value.videoType = 1
  // 确保内部教师ID有值
  if (videoForm.value.teacherType === 1 && !videoForm.value.innerTeacherId) {
    videoForm.value.innerTeacherId = userStore.teacherId || userStore.userId
  }
  selectedTopicIds.value = row.topicIds ? row.topicIds.split(',').map(Number) : []
  selectedBatchIds.value = row.batchIds ? row.batchIds.split(',').map(Number) : []
  fetchVisibleOptions()
  // 恢复级联选项
  if (videoForm.value.subjectId) fetchVersionOptions(videoForm.value.subjectId)
  if (videoForm.value.versionId) fetchVolumeOptions(videoForm.value.versionId)
  if (videoForm.value.volumeId) fetchTopicOptions(videoForm.value.volumeId)
  fetchTeacherOptions()
  videoDialogVisible.value = true
}

function handleView(row: Video) {
  if (row.filePath) {
    previewVideoUrl.value = row.filePath
    previewDialogVisible.value = true
  } else {
    navigateTo(`/videos/${row.videoId}`)
  }
}

async function handleDelete(row: Video) {
  try {
    await ElMessageBox.confirm('确定要删除该视频吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteVideo(row.videoId)
    ElMessage.success('删除成功')
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请选择要删除的视频')
    return
  }
  try {
    await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个视频吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await batchDeleteVideo(selectedIds.value)
    ElMessage.success('删除成功')
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleSubmit(row: Video) {
  try {
    await ElMessageBox.confirm('确定要提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await submitForAudit(row.videoId)
    ElMessage.success('提交成功')
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败')
    }
  }
}

async function handleRepublish(row: Video) {
  try {
    await ElMessageBox.confirm('确定要重新提交审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    await republish(row.videoId)
    ElMessage.success('重新提交成功')
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重新提交失败')
    }
  }
}

async function fetchVisibleOptions() {
  try {
    if (appStore.topicVisibleToTeacher) {
      visibleTopics.value = await getVisibleTopics()
    }
    if (appStore.broadcastVisibleToTeacher) {
      visibleBatches.value = await getVisibleBatches()
    }
  } catch (error) {
    console.error('获取专题/展播选项失败:', error)
  }
}

function handleTopicChange(val: number[]) {
  videoForm.value.topicIds = val.length > 0 ? val.join(',') : undefined
}

function handleBatchChange(val: number[]) {
  videoForm.value.batchIds = val.length > 0 ? val.join(',') : undefined
}

async function handleSubmitForm() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEdit.value && videoForm.value.videoId) {
      await updateVideo(videoForm.value)
      ElMessage.success('修改成功')
    } else {
      await publishVideo(videoForm.value)
      ElMessage.success('新增成功')
    }
    videoDialogVisible.value = false
    fetchVideoList()
  } catch (error) {
    ElMessage.error(isEdit.value ? '修改失败' : '新增失败')
  }
}

// 课程分类级联选择
function handleGradeChange() {
  // 年级变化时重新加载学科
}

function handleSubjectChange(subjectId: any) {
  videoForm.value.versionId = undefined
  videoForm.value.volumeId = undefined
  videoForm.value.topicId = undefined
  textbookVersionOptions.value = []
  volumeOptions.value = []
  topicOptions.value = []
  if (subjectId) {
    fetchVersionOptions(subjectId)
  }
}

function handleVersionChange(versionId: any) {
  videoForm.value.volumeId = undefined
  videoForm.value.topicId = undefined
  volumeOptions.value = []
  topicOptions.value = []
  if (versionId) {
    fetchVolumeOptions(versionId)
  }
}

function handleVolumeChange(volumeId: any) {
  videoForm.value.topicId = undefined
  topicOptions.value = []
  if (volumeId) {
    fetchTopicOptions(volumeId)
  }
}

async function fetchVersionOptions(subjectId: number) {
  try {
    const list = await educationApi.getVersionOptionsBySubject(subjectId)
    textbookVersionOptions.value = list.map((item: any) => ({
      value: item.versionId, label: item.versionName
    }))
  } catch (e) {
    textbookVersionOptions.value = []
  }
}

async function fetchVolumeOptions(versionId: number) {
  try {
    const list = await educationApi.getVolumeOptionsByVersion(versionId)
    volumeOptions.value = list.map((item: any) => ({
      value: item.volumeId, label: item.volumeName
    }))
  } catch (e) {
    volumeOptions.value = []
  }
}

async function fetchTopicOptions(volumeId: number) {
  try {
    const list = await educationApi.getTopicOptionsByVolume(volumeId)
    topicOptions.value = list.map((item: any) => ({
      value: item.topicId, label: item.topicName
    }))
  } catch (e) {
    topicOptions.value = []
  }
}

async function fetchTeacherOptions() {
  try {
    const list = await educationApi.getTeacherOptions()
    teacherOptions.value = list.map((item: any) => ({
      value: item.teacherId, label: item.teacherName || item.realName
    }))
  } catch (e) {
    teacherOptions.value = []
  }
}

function handleVideoUploaded(info: { url: string; name: string; size: number }) {
  // 上传成功后自动填充视频元信息
  if (info.name) {
    const ext = info.name.split('.').pop()?.toLowerCase() || ''
    if (ext) {
      videoForm.value.fileFormat = ext
    }
  }
  if (info.size) {
    videoForm.value.fileSize = Math.round(info.size / 1024)
  }
}

async function handleResource(row: Video) {
  currentVideoId.value = row.videoId
  resourceDialogVisible.value = true
  await fetchResourceList()
}

async function fetchResourceList() {
  resourceLoading.value = true
  try {
    resourceList.value = await getResourceList(currentVideoId.value)
  } catch (error) {
    console.error('获取资源列表失败:', error)
  } finally {
    resourceLoading.value = false
  }
}

function handleAddResource() {
  isEditResource.value = false
  resourceDialogTitle.value = '添加资源'
  resourceForm.value = {
    videoId: currentVideoId.value,
    resourceName: '',
    resourceType: 1,
    resourceDesc: '',
    filePath: '',
    fileSize: 0,
    isPublic: 1,
    sort: 0,
    remark: ''
  }
  resourceFormDialogVisible.value = true
}

function handleEditResource(row: VideoResource) {
  isEditResource.value = true
  resourceDialogTitle.value = '编辑资源'
  resourceForm.value = { ...row }
  resourceFormDialogVisible.value = true
}

async function handleDeleteResource(row: VideoResource) {
  try {
    await ElMessageBox.confirm('确定要删除该资源吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteResource(row.resourceId)
    ElMessage.success('删除成功')
    fetchResourceList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

async function handleSubmitResource() {
  if (!resourceFormRef.value) return
  const valid = await resourceFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    if (isEditResource.value && resourceForm.value.resourceId) {
      await updateResource(resourceForm.value)
      ElMessage.success('修改成功')
    } else {
      await addResource(resourceForm.value)
      ElMessage.success('添加成功')
    }
    resourceFormDialogVisible.value = false
    fetchResourceList()
  } catch (error) {
    ElMessage.error(isEditResource.value ? '修改失败' : '添加失败')
  }
}

// 资源文件上传相关
const runtimeConfig = useRuntimeConfig()
const resourceUploadUrl = (runtimeConfig.public.apiBase as string || '') + '/file/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

function handleResourceBeforeUpload(file: File) {
  const allowedExts = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt']
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!allowedExts.includes(ext)) {
    ElMessage.error('只支持 pdf/docx/xlsx/pptx 格式文件')
    return false
  }
  const isLt = file.size / 1024 / 1024 < 100
  if (!isLt) {
    ElMessage.error('文件大小不能超过 100MB')
    return false
  }
  return true
}

function handleResourceUploadSuccess(response: any) {
  if (response.code === 200) {
    resourceForm.value.filePath = response.data.url
    resourceForm.value.fileName = response.data.name || response.data.originalName || ''
    resourceForm.value.fileSize = response.data.size || 0
    ElMessage.success('文件上传成功')
  } else {
    ElMessage.error(response.msg || '上传失败')
  }
}

function handleResourceUploadError() {
  ElMessage.error('上传文件失败')
}

async function handleKnowledge(row: Video) {
  currentVideoId.value = row.videoId
  knowledgeDialogVisible.value = true
  await fetchKnowledgeData()
}

async function fetchKnowledgeData() {
  try {
    const list = await educationApi.getKnowledgeOptions()
    knowledgeTreeData.value = list
    
    const relations = await getKnowledgeRelations(currentVideoId.value)
    selectedKnowledgeIds.value = relations.map(r => r.knowledgeId)
    expandedKnowledgeIds.value = selectedKnowledgeIds.value
    
    const mainRelation = relations.find(r => r.isMain === 1)
    mainKnowledgeId.value = mainRelation?.knowledgeId
  } catch (error) {
    console.error('获取知识点数据失败:', error)
  }
}

function getKnowledgeNameById(id: number): string {
  const findName = (nodes: any[]): string => {
    for (const node of nodes) {
      if (node.knowledgeId === id) return node.knowledgeName
      if (node.children) {
        const name = findName(node.children)
        if (name) return name
      }
    }
    return ''
  }
  return findName(knowledgeTreeData.value)
}

async function handleSaveKnowledge() {
  const checkedNodes = knowledgeTreeRef.value?.getCheckedNodes(false, true) || []
  const knowledgeIds = checkedNodes.map((node: any) => node.knowledgeId)

  try {
    await saveKnowledgeRelations(currentVideoId.value, knowledgeIds, mainKnowledgeId.value)
    ElMessage.success('保存成功')
    knowledgeDialogVisible.value = false
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// ========== 回收站方法 ==========

async function fetchRecycleList() {
  recycleLoading.value = true
  try {
    const result = await getRecycleList(recycleQueryParams.value)
    recycleList.value = result.rows
    recycleTotal.value = result.total
  } catch (error) {
    console.error('获取回收站列表失败:', error)
  } finally {
    recycleLoading.value = false
  }
}

async function handleRestore(row: Video) {
  try {
    await ElMessageBox.confirm('确定要恢复该视频吗？', '提示', { type: 'info' })
    await restoreVideo(row.videoId)
    ElMessage.success('恢复成功')
    fetchRecycleList()
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('恢复失败')
  }
}

async function handleBatchRestore() {
  try {
    await ElMessageBox.confirm(`确定要恢复选中的 ${recycleSelectedIds.value.length} 个视频吗？`, '提示', { type: 'info' })
    await restoreVideoBatch(recycleSelectedIds.value)
    ElMessage.success('恢复成功')
    fetchRecycleList()
    fetchVideoList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('恢复失败')
  }
}

async function handlePermanentDelete(row: Video) {
  try {
    await ElMessageBox.confirm('彻底删除后不可恢复，确定要删除吗？', '警告', { type: 'warning' })
    await permanentDeleteVideo(row.videoId)
    ElMessage.success('删除成功')
    fetchRecycleList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

async function handleBatchPermanentDelete() {
  try {
    await ElMessageBox.confirm(`彻底删除后不可恢复，确定要删除选中的 ${recycleSelectedIds.value.length} 个视频吗？`, '警告', { type: 'warning' })
    await permanentDeleteVideoBatch(recycleSelectedIds.value)
    ElMessage.success('删除成功')
    fetchRecycleList()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

function handleRecycleSelectionChange(selection: Video[]) {
  recycleSelectedIds.value = selection.map(item => item.videoId)
}

watch(recycleDialogVisible, (val) => {
  if (val) {
    recycleQueryParams.value.pageNum = 1
    fetchRecycleList()
  }
})

function handleExport() {
  if (videoList.value.length === 0) {
    ElMessage.warning('没有可导出的数据')
    return
  }
  exportToExcel(videoList.value, [
    { key: 'videoName', label: '视频名称' },
    { key: 'duration', label: '时长', render: (v) => formatDuration(v) },
    { key: 'viewCount', label: '观看次数' },
    { key: 'collectCount', label: '收藏次数' },
    { key: 'status', label: '状态', render: (v) => getStatusText(v) },
    { key: 'auditStatus', label: '审核状态', render: (v) => v !== null ? getAuditStatusText(v) : '-' },
    { key: 'createTime', label: '创建时间' }
  ], '视频列表')
}

function handlePrint() {
  printTable('video-table')
}

onMounted(async () => {
  fetchVideoList()
  // 预加载年级和学科选项
  try {
    const gradeList = await educationApi.getGradeOptions()
    gradeOptions.value = gradeList.map((item: any) => ({
      value: item.gradeId, label: item.gradeName
    }))
  } catch (e) { /* ignore */ }
  try {
    const subjectList = await educationApi.getSubjectOptions()
    subjectOptions.value = subjectList.map((item: any) => ({
      value: item.subjectId, label: item.stageName ? `${item.stageName}>${item.subjectName}` : item.subjectName
    }))
  } catch (e) { /* ignore */ }
})

useSeoMeta({
  title: '我的视频 - 教师中心',
  description: '教师视频管理'
})
</script>

<style scoped>
.teacher-video-page {
  min-height: calc(100vh - var(--header-height) - var(--footer-height));
  padding: 24px 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.filter-section {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.video-list {
  background: var(--bg-color);
  border-radius: 8px;
  padding: 16px;
}

.video-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.video-cover {
  width: 80px;
  height: 45px;
  border-radius: 4px;
  flex-shrink: 0;
}

.video-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-info .name {
  font-weight: 500;
}

.video-info .desc {
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.resource-toolbar {
  margin-bottom: 16px;
}

.knowledge-content {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
}

.knowledge-node {
  display: flex;
  align-items: center;
}

.knowledge-main-select {
  margin-top: 16px;
  padding: 12px;
  background: var(--bg-color-page);
  border-radius: 4px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.upload-switch {
  width: 100%;
}

.upload-area {
  width: 100%;
}

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

.resource-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.resource-file-info span {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.video-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.preview-video-player {
  width: 100%;
  max-height: 500px;
  border-radius: 8px;
  background: #000;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
