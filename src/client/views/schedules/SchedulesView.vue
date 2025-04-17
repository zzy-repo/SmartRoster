<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElCalendar } from 'element-plus'

import ShiftItem from './ShiftItem.vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import initialScheduleData from '@/assets/data/schedules.json'

const scheduleStore = useScheduleStore()
const currentView = ref<'day' | 'week' | 'month'>('month')
const currentDate = ref(new Date())

const getWeekRange = (date: Date): [Date, Date] => {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  const end = new Date(date);
  end.setDate(date.getDate() + (6 - date.getDay()));
  return [start, end];
}

// 获取排班数据
scheduleStore.fetchSchedules()

const scheduleData = computed(() => {
  const data = scheduleStore.schedules.length > 0 ? scheduleStore.schedules : initialScheduleData
  return data.map(schedule => ({
    date: new Date(schedule.start_date),
    content: {
      shiftId: schedule.id,
      position: schedule.position,
      employee: schedule.employee_name,
      time: `${schedule.start_time}-${schedule.end_time}`,
      overrideReason: schedule.override_reason
    }
  }))
})

const handleDragEnd = (updatedShift: any) => {
  scheduleStore.updateShiftAssignment(updatedShift)
}
</script>

<template>
  <div class="schedule-container">
    <div class="view-controls">
      <el-radio-group v-model="currentView">
        <el-radio-button label="month">月视图</el-radio-button>
        <el-radio-button label="week">周视图</el-radio-button>
        <el-radio-button label="day">日视图</el-radio-button>
      </el-radio-group>
    </div>

    <el-calendar v-model="currentDate" :range="currentView === 'week' ? getWeekRange(currentDate) : undefined">
      <template #date-cell="{ data }">
        <div class="calendar-cell">
          <div v-for="(item, index) in scheduleData.filter(d => 
            new Date(d.date).toISOString().slice(0,10) === new Date(data.day).toISOString().slice(0,10))" :key="index">
            <ShiftItem 
              :shift="item.content"
              @drag-end="handleDragEnd"
            />
          </div>
        </div>
      </template>
    </el-calendar>
  </div>
</template>

<style scoped>
.schedule-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.calendar-cell {
  min-height: 120px;
  padding: 5px;
  border-bottom: 1px solid #ebeef5;
}
</style>