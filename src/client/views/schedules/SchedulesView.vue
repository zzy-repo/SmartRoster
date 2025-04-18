<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElCalendar, ElCard } from 'element-plus'

import ShiftItem from './ShiftItem.vue'
import { useScheduleStore } from '@/stores/scheduleStore'
import initialScheduleData from '@/assets/data/schedules.json'

const scheduleStore = useScheduleStore()
const currentView = ref<'year' | 'month' | 'week' | 'day'>('month')
const currentDate = ref(new Date())
const currentYear = ref(new Date().getFullYear())

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

// 按月统计排班人数（用于年视图）
const monthlyScheduleCount = computed(() => {
  const counts = Array(12).fill(0);
  scheduleData.value.forEach(item => {
    const month = item.date.getMonth();
    counts[month]++;
  });
  return counts;
});

// 按日统计排班人数（用于月视图）
const weeklyPositionCount = computed(() => {
  const counts: Record<string, Record<string, number>> = {};
  scheduleData.value.forEach(item => {
    const dateStr = item.date.toISOString().slice(0, 10);
    if (!counts[dateStr]) {
      counts[dateStr] = {};
    }
    counts[dateStr][item.content.position] = (counts[dateStr][item.content.position] || 0) + 1;
  });
  return counts;
});

const handleDragEnd = (updatedShift: any) => {
  scheduleStore.updateShiftAssignment(updatedShift)
}

// 获取月份名称
const handleMonthClick = (monthIndex: number) => {
  currentView.value = 'month';
  currentDate.value = new Date(currentYear.value, monthIndex, 1);
};

const getMonthName = (index: number): string => {
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  return monthNames[index];
}
</script>

<template>
  <div class="schedule-container">
    <div class="view-controls">
      <el-radio-group v-model="currentView">
        <el-radio-button label="year">年视图</el-radio-button>
        <el-radio-button label="month">月视图</el-radio-button>
        <el-radio-button label="week">周视图</el-radio-button>
        <el-radio-button label="day">日视图</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 年视图 -->
    <div v-if="currentView === 'year'" class="year-view">
      <div class="year-header">
        <el-button @click="currentYear--">上一年</el-button>
        <h2>{{ currentYear }}年排班统计</h2>
        <el-button @click="currentYear++">下一年</el-button>
      </div>
      <div class="months-grid">
        <el-card v-for="(count, index) in monthlyScheduleCount" :key="index" class="month-card" @click="handleMonthClick(index)" style="padding: 8px;">
          <template #header>
            <div class="month-header">{{ getMonthName(index) }}</div>
          </template>
          <div class="month-count">排班总人数: {{ count }}</div>
        </el-card>
      </div>
    </div>

    <!-- 月视图 -->
    <div v-else-if="currentView === 'month'">
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click="() => { currentView = 'day'; currentDate = new Date(data.day); }">
            <div class="date-count">
              <el-tag 
              v-for="(count, position) in weeklyPositionCount[new Date(data.day).toISOString().slice(0,10)] || {}"
              :key="position"
              size="small"
              class="position-tag"
              :style="{ marginRight: '4px', marginBottom: '4px' }"
            >
              {{ position }}: {{ count }}
            </el-tag>
            </div>
          </div>
        </template>
      </el-calendar>
    </div>

    <!-- 周视图 -->
    <div v-else-if="currentView === 'week'">
      <div class="week-header">
        <el-button @click="currentDate = new Date(currentDate.getTime() - 604800000)">上一周</el-button>
        <h3>{{ currentDate.toISOString().slice(0,10) }} 所在周</h3>
        <el-button @click="currentDate = new Date(currentDate.getTime() + 604800000)">下一周</el-button>
      </div>
      <el-calendar v-model="currentDate" :range="getWeekRange(currentDate)">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click="() => { currentView = 'day'; currentDate = new Date(data.day); }">
            <div class="date-count">
              <el-tag 
              v-for="(count, position) in weeklyPositionCount[new Date(data.day).toISOString().slice(0,10)] || {}"
              :key="position"
              size="small"
              class="position-tag"
              :style="{ marginRight: '4px', marginBottom: '4px' }"
            >
              {{ position }}: {{ count }}
            </el-tag>
            </div>
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

    <!-- 日视图 -->
    <div v-else-if="currentView === 'day'" class="day-view">
      <div class="day-header">
        <el-button @click="currentDate = new Date(currentDate.getTime() - 86400000)">前一天</el-button>
        <h3>{{ currentDate.toISOString().slice(0,10) }} 排班详情</h3>
        <el-button @click="currentDate = new Date(currentDate.getTime() + 86400000)">后一天</el-button>
      </div>
      <div class="day-shifts">
        <div v-if="scheduleData.filter(d => new Date(d.date).toISOString().slice(0,10) === currentDate.toISOString().slice(0,10)).length === 0" class="no-shifts">
          当天没有排班
        </div>
        <div v-for="(item, index) in scheduleData.filter(d => 
          new Date(d.date).toISOString().slice(0,10) === currentDate.toISOString().slice(0,10))" :key="index" class="day-shift-item">
          <ShiftItem 
            :shift="item.content"
            @drag-end="handleDragEnd"
          />
        </div>
      </div>
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

.calendar-cell {
  --cell-padding: 12px;
  
  min-height: 140px;
  padding: var(--cell-padding);
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 16px rgba(64,158,255,0.15);
    border-color: var(--primary-color);
  }
  
  .position-tag {
    background: rgba(64,158,255,0.1);
    border-color: rgba(64,158,255,0.2);
    color: var(--primary-color);
    margin: 4px;
    flex-shrink: 0;
  }
}

.date-count {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: var(--text-light);
}

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
  gap: 8px;
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
  font-size: 14px;
  font-weight: bold;
}

.month-count {
  font-size: 18px;
  text-align: center;
  padding: 12px 0;
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

.position-tag {
  white-space: normal;
  line-height: 1.5;
  min-width: 60px;
  text-align: center;
  border-radius: 14px;
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

.week-header h3 {
  color: var(--primary-color);
  font-size: 18px;
  margin: 0 20px;
}