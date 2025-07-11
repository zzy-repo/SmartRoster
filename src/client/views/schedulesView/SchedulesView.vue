<script setup lang="ts">
import initialScheduleData from '@/assets/data/schedules.json'
import { useScheduleStore } from '@/stores/scheduleStore'

import DayScheduleView from '@/views/schedulesView/DayScheduleView.vue'
import { computed, ref } from 'vue'

import YearView from './YearView.vue'
import MonthView from './MonthView.vue'

const scheduleStore = useScheduleStore()
const currentView = ref<'year' | 'month' | 'week' | 'day'>('month')
const currentDate = ref(new Date())
const currentYear = ref(new Date().getFullYear())

// 获取排班数据
scheduleStore.fetchSchedules()

const scheduleData = computed(() => {
  const data = initialScheduleData
  return data.map(schedule => ({
    date: new Date(schedule.start_date),
    content: {
      shiftId: schedule.id,
      position: schedule.position,
      employee: schedule.employee_name,
      time: `${schedule.start_time}-${schedule.end_time}`,
      overrideReason: schedule.override_reason,
    },
  }))
})

// 按月统计排班人数（用于年视图）
const monthlyScheduleCount = computed(() => {
  const counts: number[] = Array.from({ length: 12 }).fill(0) as number[]
  scheduleData.value.forEach((item) => {
    const month = item.date.getMonth()
    counts[month]++
  })
  return counts
})

// 按日统计排班人数（用于月视图）
const weeklyPositionCount = computed(() => {
  const counts: Record<string, Record<string, number>> = {}
  scheduleData.value.forEach((item) => {
    const dateStr = item.date.toISOString().slice(0, 10)
    if (!counts[dateStr]) {
      counts[dateStr] = {}
    }
    counts[dateStr][item.content.position] = (counts[dateStr][item.content.position] || 0) + 1
  })
  return counts
})

// 获取月份名称
function handleMonthClick(monthIndex: number) {
  currentView.value = 'month'
  currentDate.value = new Date(currentYear.value, monthIndex, 1)
}

// 处理年份变化
function handleYearChange(year: number) {
  currentYear.value = year
  if (currentView.value === 'year') {
    currentDate.value = new Date(year, 0, 1)
  }
}
</script>

<template>
  <div class="schedule-container">
    <div class="view-controls">
      <el-radio-group v-model="currentView">
        <el-radio-button label="year">
          年视图
        </el-radio-button>
        <el-radio-button label="month">
          月视图
        </el-radio-button>
        <el-radio-button label="day">
          日视图
        </el-radio-button>
      </el-radio-group>
    </div>

    <YearView
      v-if="currentView === 'year'"
      :current-year="currentYear"
      :monthly-schedule-count="monthlyScheduleCount"
      @prev-year="currentYear--"
      @next-year="currentYear++"
      @month-click="handleMonthClick"
    />

    <MonthView
      v-else-if="currentView === 'month'"
      :weekly-position-count="weeklyPositionCount"
      @day-click="(date) => { currentView = 'day'; currentDate = date; }"
    />

    <div v-else-if="currentView === 'day'" class="day-view">
      <DayScheduleView
        v-model:date="currentDate"
      />
    </div>
  </div>
</template>

<style scoped>
.schedule-container {
  --primary-color: #409EFF;
  --secondary-color: #67C23A;
  --text-light: #606266;

  padding: 24px;
  background: #f8fafc;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.day-view {
  padding: 20px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.day-shifts {
  background: white;
  border-radius: 12px;
  padding: 24px;
  min-height: 400px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);

  .day-shift-item {
    padding: 16px;
    margin-bottom: 16px;
    background: #f8fafc;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
  }
}

.day-shift-item {
  margin-bottom: 10px;
}

.no-shifts {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  font-size: 14px;
}
</style>
