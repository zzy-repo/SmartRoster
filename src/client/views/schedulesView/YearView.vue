<template>
  <div class="year-view">
    <el-card class="year-card">
      <template #header>
        <div class="year-header">
          <el-button plain @click="$emit('prev-year')">last year</el-button>
          <span class="year-title">{{ currentYear }}年排班统计</span>
          <el-button plain @click="$emit('next-year')">next year</el-button>
        </div>
      </template>
      <div class="months-grid">
        <el-card
          v-for="(count, index) in monthlyScheduleCount"
          :key="index"
          class="month-card"
          shadow="hover"
          @click="$emit('month-click', index)"
        >
          <div class="month-compact">
            <span class="month-label">{{ getMonthName(index) }}</span>
            <span class="month-count">{{ count }}人</span>
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">

defineProps<{
  currentYear: number
  monthlyScheduleCount: number[]
}>()

defineEmits<{
  (e: 'prev-year'): void
  (e: 'next-year'): void
  (e: 'month-click', index: number): void
}>()

/**
 * 获取月份名称
 * @param index 月份索引 (0-11)
 * @returns 月份中文名称
 */
function getMonthName(index: number): string {
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return monthNames[index]
}
</script>

<style scoped>
.year-view {
  padding: 20px;
}

.year-card {
  background-color: var(--el-bg-color);
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.year-title {
  font-size: 20px;
  text-align: center;
  color: var(--el-text-color-primary);
  font-weight: bold;
  flex: 1;
}

.year-btn-group {
  margin-left: auto;
}

.year-btn-group .el-button {
  font-size: 12px;
  color: #555;
  border-radius: 6px;
  font-weight: 500;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px;
}

.month-card {
  cursor: pointer;
  transition: all 0.2s;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.month-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.month-compact {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px 0;
}

.month-label {
  font-size: 15px;
  color: var(--el-text-color-primary);
  font-weight: 500;
  margin-bottom: 4px;
}

.month-count {
  font-size: 15px;
  color: var(--el-color-primary);
  font-weight: bold;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-card__body) {
  padding: 0;
}
</style>