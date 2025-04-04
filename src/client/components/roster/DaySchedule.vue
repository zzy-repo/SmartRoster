<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRosterStore } from '../../stores/rosterStore'
import type { ScheduleShift, Employee } from '../../types'

const props = defineProps<{
  date: Date
  storeId: string
  groupBy: 'position' | 'employee' | 'skill'
}>()

const emit = defineEmits<{
  (e: 'assign', data: { shiftId: string, position: string }): void
  (e: 'unassign', data: { shiftId: string, employeeId: string, position: string }): void
}>()

const rosterStore = useRosterStore()
const loading = ref(false)

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

// 定义排班表数据类型
interface ScheduleGroup {
  groupName: string;
  shifts: ScheduleShift[];
}

// 根据分组方式获取排班表数据
const scheduleData = computed((): ScheduleGroup[] => {
  if (!rosterStore.schedule) return []
  
  const dayShifts = rosterStore.currentDaySchedule
  
  if (props.groupBy === 'position') {
    // 按岗位分组
    const positionGroups: Record<string, ScheduleShift[]> = {}
    
    // 收集所有岗位
    const allPositions = new Set<string>()
    dayShifts.forEach(shift => {
      Object.keys(shift.required_positions).forEach(pos => allPositions.add(pos))
    })
    
    // 初始化每个岗位的数组
    allPositions.forEach(position => {
      positionGroups[position] = []
    })
    
    // 填充班次数据
    dayShifts.forEach(shift => {
      Object.keys(shift.required_positions).forEach(position => {
        if (positionGroups[position]) {
          positionGroups[position].push(shift)
        }
      })
    })
    
    return Object.entries(positionGroups).map(([position, shifts]) => ({
      groupName: position,
      shifts
    }))
  } else if (props.groupBy === 'employee') {
    // 按员工分组
    const employeeGroups: Record<string, ScheduleShift[]> = {}
    
    // 收集所有员工
    const allEmployees = new Map<string, Employee>()
    dayShifts.forEach(shift => {
      Object.values(shift.assignments).forEach(assignments => {
        assignments.forEach(employee => {
          allEmployees.set(employee.id, employee as any)
        })
      })
    })
    
    // 初始化每个员工的数组
    allEmployees.forEach((_employee, id) => {
      employeeGroups[id] = []
    })
    
    // 填充班次数据
    dayShifts.forEach(shift => {
      Object.entries(shift.assignments).forEach(([_, assignments]) => {
        assignments.forEach(employee => {
          if (employeeGroups[employee.id]) {
            employeeGroups[employee.id].push(shift)
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

// 按时间排序班次
const sortShiftsByTime = (shifts: ScheduleShift[]): ScheduleShift[] => {
  return [...shifts].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time)
  })
}
</script>

<template>
  <div class="day-schedule">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>{{ props.date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) }} 排班表</span>
        </div>
      </template>
      
      <!-- 排班表内容 -->
      <div class="schedule-content">
        <div v-for="(group, groupIndex) in scheduleData" :key="groupIndex" class="schedule-group">
          <div class="group-header">{{ group.groupName }}</div>
          
          <div class="group-content">
            <template v-if="group.shifts.length > 0">
              <div v-for="shift in sortShiftsByTime(group.shifts)" :key="shift.id" class="shift-card">
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
                        v-for="employee in getShiftAssignments(shift, group.groupName)" 
                        :key="employee.id"
                        closable
                        @close="handleUnassignShift(shift.id, employee.id, group.groupName)"
                      >
                        {{ employee.name }}
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
    </el-card>
  </div>
</template>

<style scoped>
.day-schedule {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.schedule-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.schedule-group {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 15px;
}

.group-header {
  padding: 10px 15px;
  background-color: #f5f7fa;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
}

.group-content {
  padding: 15px;
}

.shift-card {
  background-color: #ecf5ff;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shift-time {
  font-weight: bold;
}

.shift-duration {
  font-size: 12px;
  color: #606266;
}

.assigned-employees {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.employee-positions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.empty-shift {
  padding: 20px;
  text-align: center;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
}
</style>