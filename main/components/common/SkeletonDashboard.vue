<template>
  <div class="skeleton-dashboard">
    <!-- 统计卡片骨架 -->
    <div class="sk-stats-grid">
      <div v-for="i in 4" :key="'stat-' + i" class="sk-stat-card">
        <el-skeleton animated>
          <template #template>
            <div class="sk-stat-inner">
              <el-skeleton-item variant="circle" style="width: 56px; height: 56px" />
              <div class="sk-stat-text">
                <el-skeleton-item variant="text" style="width: 60px; height: 28px" />
                <el-skeleton-item variant="text" style="width: 80px; height: 14px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- 操作栏骨架 -->
    <div class="sk-actions">
      <div v-for="i in 5" :key="'act-' + i" class="sk-action-item">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="rect" style="width: 100%; height: 48px" />
          </template>
        </el-skeleton>
      </div>
    </div>

    <!-- 内容面板骨架 -->
    <div class="sk-panels">
      <div v-for="i in 2" :key="'panel-' + i" class="sk-panel">
        <el-skeleton animated>
          <template #template>
            <el-skeleton-item variant="text" style="width: 40%; height: 20px; margin-bottom: 16px" />
            <el-skeleton-item variant="rect" style="width: 100%; height: 200px" />
          </template>
        </el-skeleton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 0 0;
}

.sk-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.sk-stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sk-stat-inner {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sk-stat-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.sk-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.sk-action-item {
  flex: 1;
  min-width: 100px;
}

.sk-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.sk-panel {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

@media (max-width: 900px) {
  .sk-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .sk-panels {
    grid-template-columns: 1fr;
  }
  .sk-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 600px) {
  .sk-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>