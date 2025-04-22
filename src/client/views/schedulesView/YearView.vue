<template>
  <div class="year-view">
    <div class="year-header">
      <el-button @click="$emit('prev-year')">
        上一年
      </el-button>
      <h2>{{ currentYear }}年排班统计</h2>
      <el-button @click="$emit('next-year')">
        下一年
      </el-button>
    </div>
    <div class="months-grid">
      <ElCard 
        v-for="(count, index) in monthlyScheduleCount" 
        :key="index" 
        class="month-card" 
        style="padding: 8px;" 
        @click="$emit('month-click', index)"
      >
        <template #header>
          <div class="month-header">
            {{ getMonthName(index) }}
          </div>
        </template>
        <div class="month-count">
          排班总人数: {{ count }}
        </div>
      </ElCard>
    </div>
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
  margin-top: 20px;
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.month-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.month-card:hover {
  transform: translateY(-4px);
}

.month-header {
  font-weight: bold;
}

.month-count {
  font-size: 14px;
  color: var(--text-light);
}
</style>