<script setup lang="ts">
import { ElCard } from 'element-plus'
import { computed, ref } from 'vue'

// 接收父组件传递的属性
const props = defineProps<{
  scheduleData: Array<any>
}>()

// 定义事件
const emit = defineEmits<{
  'update:date': [date: Date]
  'update:view': [view: 'year' | 'month' | 'day']
}>()

// 当前年份
const currentYear = ref(new Date().getFullYear())

// 按月统计排班人数
const monthlyScheduleCount = computed(() => {
  const counts = Array(12).fill(0)
  props.scheduleData.forEach((item) => {
    const month = item.date.getMonth()
    counts[month]++
  })
  return counts
})

/**
 * 处理月份点击事件，切换到月视图
 * @param monthIndex 月份索引
 */
function handleMonthClick(monthIndex: number) {
  emit('update:view', 'month')
  emit('update:date', new Date(currentYear.value, monthIndex, 1))
}

/**
 * 获取月份名称
 * @param index 月份索引
 * @returns 月份名称
 */
function getMonthName(index: number): string {
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  return monthNames[index]
}
</script>

<template>
  <div class="year-view">
    <div class="year-header">
      <el-button @click="currentYear--">
        上一年
      </el-button>
      <h2>{{ currentYear }}年排班统计</h2>
      <el-button @click="currentYear++">
        下一年
      </el-button>
    </div>
    <div class="months-grid">
      <ElCard v-for="(count, index) in monthlyScheduleCount" :key="index" class="month-card" style="padding: 8px;" @click="handleMonthClick(index)">
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

<style scoped>
.year-view {
  padding: 20px;
}

.year-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  padding: 16px;
}

.month-card {
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
  border: 1px solid #ebeef5;

  :deep(.el-card__header) {
    background: linear-gradient(135deg, var(--primary-color), #79bbff);
    border-radius: 8px 8px 0 0;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 8px 24px rgba(64,158,255,0.15);
  }
}

.month-header {
  color: var(--primary-color);
  font-size: 15px;
  letter-spacing: 0.5px;
}

.month-count {
  color: var(--text-light);
  font-size: 20px;
  font-weight: 500;
}
</style>