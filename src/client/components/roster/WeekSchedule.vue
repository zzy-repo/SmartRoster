<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRosterStore } from '../../stores/rosterStore'
import type { ScheduleShift, Employee } from '../../types'

const props = defineProps<{
  weekStart: Date
  storeId: string
  groupBy: 'position' | 'employee' | 'skill'
}>()

const emit = defineEmits<{
  (e: 'assign', data: { shiftId: string, position: string }): void
  (e: 'unassign', data: { shiftId: string, employeeId: string, position: string }): void
}>()

const rosterStore = useRosterStore()
const loading = ref(false)
const weekDays = ref<Date[]>([])

// 计算周日期范围
const calculateWeekDays = (startDate: Date) => {
  const days: Date[] = []
  const start = new Date(startDate)
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    days.push(day)
  }
  
  return days
}

// 格式化日期为YYYY-MM-DD (注释掉未使用的函数)
// const formatDate = (date: Date): string => {
//   return date.toISOString().split('T')[0]
// }

// 格式化时间为HH:MM
const formatTime = (timeStr: string): string => {
  return timeStr
}

// 计算班次时长（小时）
const calculateShiftDuration = (shift: ScheduleShift): number => {
  const start = new Date(`2000-01-01T${shift.start_time}`)
  const end = new Date(`2000-01-01T${shift.end_time}`)
  const diff = end.getTime() - start.getTime()
  return diff / (1000 * 60 * 60)
}

// 获取班次在一周中的位置
const getShiftDayIndex = (shift: ScheduleShift): number => {
  const shiftDate = new Date(shift.date)
  const dayOfWeek = shiftDate.getDay()
  return dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 调整为周一为0，周日为6
}

// 定义排班表数据类型
interface ScheduleGroup {
  groupName: string;
  shifts: ScheduleShift[][];
}

// 根据分组方式获取排班表数据
const scheduleData = computed((): ScheduleGroup[] => {
  if (!rosterStore.schedule) return []
  
  const weekShifts = rosterStore.currentWeekSchedule
  
  if (props.groupBy === 'position') {
    // 按岗位分组
    const positionGroups: Record<string, ScheduleShift[][]> = {}
    
    // 初始化每个岗位的7天数组
    const allPositions = new Set<string>()
    weekShifts.forEach(shift => {
      Object.keys(shift.required_positions).forEach(pos => allPositions.add(pos))
    })
    
    allPositions.forEach(position => {
      positionGroups[position] = Array(7).fill(null).map(() => [])
    })
    
    // 填充班次数据
    weekShifts.forEach(shift => {
      const dayIndex = getShiftDayIndex(shift)
      Object.keys(shift.required_positions).forEach(position => {
        if (positionGroups[position]) {
          positionGroups[position][dayIndex].push(shift)
        }
      })
    })
    
    return Object.entries(positionGroups).map(([position, shifts]) => ({
      groupName: position,
      shifts
    }))
  } else if (props.groupBy === 'employee') {
    // 按员工分组
    const employeeGroups: Record<string, ScheduleShift[][]> = {}
    
    // 收集所有员工
    const allEmployees = new Map<string, Employee>()
    weekShifts.forEach(shift => {
      Object.values(shift.assignments).forEach(assignments => {
        assignments.forEach(employee => {
          allEmployees.set(employee.id, employee as any)
        })
      })
    })
    
    // 初始化每个员工的7天数组
    allEmployees.forEach((_employee, id) => {
      employeeGroups[id] = Array(7).fill(null).map(() => [])
    })
    
    // 填充班次数据
    weekShifts.forEach(shift => {
      const dayIndex = getShiftDayIndex(shift)
      Object.entries(shift.assignments).forEach(([_, assignments]) => {
        assignments.forEach(employee => {
          if (employeeGroups[employee.id]) {
            employeeGroups[employee.id][dayIndex].push(shift)
          }
        })
      })
    })
    
    return Array.from(allEmployees.entries()).map(([id, emp]) => ({
      groupName: emp.name,
      shifts: employeeGroups[id]
    }))
  } else {
    // 按技能分组（简化为按职位分组）
    return scheduleData.value
  }
})

// 获取班次的员工分配情况
const getShiftAssignments = (shift: ScheduleShift, position: string) => {
  return shift.assignments[position] || []
}

// 处理分配班次
const handleAssignShift = (shiftId: string, position: string) => {
  emit('assign', { shiftId, position })
}

// 处理取消分配
const handleUnassignShift = (shiftId: string, employeeId: string, position: string) => {
  emit('unassign', { shiftId, employeeId, position })
}

// 监听周开始日期变化
watch(() => props.weekStart, (newDate) => {
  weekDays.value = calculateWeekDays(newDate)
}, { immediate: true })

onMounted(() => {
  weekDays.value = calculateWeekDays(props.weekStart)
})
</script>

<template>
  <div class="week-schedule">
    <el-card v-loading="loading">
      <!-- 周日期导航 -->
      <div class="week-header">
        <div class="week-day-header" v-for="(day, index) in weekDays" :key="index">
          <div class="day-name">{{ ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index] }}</div>
          <div class="day-date">{{ day.getMonth() + 1 }}/{{ day.getDate() }}</div>
        </div>
      </div>
      
      <!-- 排班表内容 -->
      <div class="schedule-content">
        <div v-for="(group, groupIndex) in scheduleData" :key="groupIndex" class="schedule-group">
          <div class="group-header">{{ group.groupName }}</div>
          
          <div class="group-content">
            <div v-for="(dayShifts, dayIndex) in group.shifts" :key="dayIndex" class="day-shifts">
              <template v-if="dayShifts.length > 0">
                <div v-for="shift in dayShifts" :key="shift.id" class="shift-card">
                  <div class="shift-time">
                    {{ formatTime(shift.start_time) }} - {{ formatTime(shift.end_time) }}
                  </div>
                  
                  <div class="shift-duration">
                    {{ calculateShiftDuration(shift).toFixed(1) }}小时
                  </div>
                  
                  <div class="shift-assignments">
                    <template v-if="props.groupBy === 'position'">
                      <div class="assigned-employees">
                        <el-tag 
                          v-for="emp in getShiftAssignments(shift, group.groupName)" 
                          :key="emp.id"
                          closable
                          @close="handleUnassignShift(shift.id, emp.id, group.groupName)"
                        >
                          {{ emp.name }}
                        </el-tag>
                        
                        <el-button 
                          v-if="getShiftAssignments(shift, group.groupName).length < (shift.required_positions[group.groupName] || 0)"
                          size="small"
                          type="primary"
                          plain
                          @click="handleAssignShift(shift.id, group.groupName)"
                        >
                          分配
                        </el-button>
                      </div>
                    </template>
                    
                    <template v-else-if="props.groupBy === 'employee'">
                      <div class="employee-positions">
                        <el-tag v-for="position in Object.keys(shift.assignments)" :key="position">
                          {{ position }}
                        </el-tag>
                      </div>
                    </template>
                  </div>
                </div>
              </template>
              
              <div v-else class="empty-shift">
                <span>无班次</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.week-schedule {
  width: 100%;
}

.week-header {
  display: flex;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.week-day-header {
  flex: 1;
  text-align: center;
  font-weight: bold;
}

.day-name {
  font-size: 14px;
  margin-bottom: 5px;
}

.day-date {
  font-size: 12px;
  color: #909399;
}

.schedule-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.schedule-group {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.group-header {
  padding: 10px 15px;
  background-color: #f5f7fa;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
}

.group-content {
  display: flex;
}

.day-shifts {
  flex: 1;
  min-height: 100px;
  padding: 10px;
  border-right: 1px solid #ebeef5;
}

.day-shifts:last-child {
  border-right: none;
}

.shift-card {
  background-color: #ecf5ff;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.shift-time {
  font-weight: bold;
  margin-bottom: 5px;
}

.shift-duration {
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.shift-assignments {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.assigned-employees {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.employee-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.empty-shift {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  color: #909399;
  font-size: 12px;
}
</style>