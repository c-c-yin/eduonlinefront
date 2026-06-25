<template>
  <div class="list-toolbar">
    <div class="toolbar-left">
      <slot name="search">
        <el-input
          v-if="searchPlaceholder"
          v-model="searchValue"
          :placeholder="searchPlaceholder"
          clearable
          style="width: 200px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </slot>
      <slot name="filters" />
    </div>
    <div class="toolbar-right">
      <slot name="actions" />
      <el-button v-if="showExport" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button v-if="showPrint" @click="handlePrint">
        <el-icon><Printer /></el-icon>
        打印
      </el-button>
      <el-button v-if="columns.length > 0" @click="columnDialogVisible = true">
        <el-icon><Operation /></el-icon>
        列设置
      </el-button>
    </div>

    <!-- 列设置弹窗 -->
    <el-dialog v-model="columnDialogVisible" title="列设置" width="400px" append-to-body>
      <el-checkbox-group v-model="visibleColumns">
        <div class="column-check-list">
          <el-checkbox v-for="col in columns" :key="col.key" :label="col.key" :value="col.key">
            {{ col.label }}
          </el-checkbox>
        </div>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="columnDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleColumnConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { Search, Download, Printer, Operation } from '@element-plus/icons-vue'

interface ColumnConfig {
  key: string
  label: string
}

const props = withDefaults(defineProps<{
  searchPlaceholder?: string
  showExport?: boolean
  showPrint?: boolean
  columns?: ColumnConfig[]
  defaultVisibleColumns?: string[]
}>(), {
  showExport: false,
  showPrint: false,
  columns: () => [],
  defaultVisibleColumns: () => []
})

const emit = defineEmits<{
  (e: 'search', value: string): void
  (e: 'export'): void
  (e: 'print'): void
  (e: 'column-change', columns: string[]): void
}>()

const searchValue = ref('')
const columnDialogVisible = ref(false)
const visibleColumns = ref<string[]>(props.defaultVisibleColumns.length > 0
  ? [...props.defaultVisibleColumns]
  : props.columns.map(c => c.key)
)

function handleSearch() {
  emit('search', searchValue.value)
}

function handleExport() {
  emit('export')
}

function handlePrint() {
  emit('print')
}

function handleColumnConfirm() {
  columnDialogVisible.value = false
  emit('column-change', visibleColumns.value)
}

defineExpose({
  resetSearch() {
    searchValue.value = ''
  }
})
</script>

<style scoped>
.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.column-check-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>