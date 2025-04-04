<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRosterStore } from '../../stores/rosterStore'
import type { Employee } from '../../types'
import { ElMessage } from 'element-plus'
import ConflictDetector from './ConflictDetector.vue'

const emit = defineEmits<{
  (e: 'assign-success', data: { shiftId: string, employeeId: string, position: string }): void
  (e: 'unassign-success', data: { shiftId: string, employeeId: string, position: string }): void
}>()

const rosterStore = useRosterStore()
const loading = ref(false)
const draggingEmployee = ref<Employee | null>(null)
const showConflictDialog = ref(false)
const conflictInfo = ref<any[]>([])
const pendingAssignment = ref<{shiftId: string, employeeId: string, position: string} | null>(null)
const conflictDetectorRef = ref()

// 获取所有员工列表
const allEmployees = ref<Employee[]>([])
const loadEmployees = async () => {
  loading.value = true
  try {
    // 这里应该调用API获取员工列表
    // 暂时使用模拟数据
    allEmployees.value = []
    
    // 如果有排班表，从中提取员工信息
    if (rosterStore.schedule) {
      const employeeMap = new Map<string, Employee>()
      
      rosterStore.schedule.shifts.forEach(shift => {
        Object.values(shift.assignments).forEach(assignments => {
          assignments.forEach(emp => {
            if (!employeeMap.has(emp.id)) {
              employeeMap.set(emp.id, emp as any)
            }
          })
        })
      })
      
      allEmployees.value = Array.from(employeeMap.values())
    }
  } catch (error) {
    console.error('加载员工列表失败:', error)
    ElMessage.error('加载员工列表失败')
  } finally {
    loading.value = false
  }
}

// 开始拖拽员工
const onDragStart = (employee: Employee) => {
  draggingEmployee.value = employee
}

// 拖拽结束
const onDragEnd = () => {
  draggingEmployee.value = null
}

// 允许放置和处理放置的逻辑已移至onDragStart和onDragEnd函数

// 处理冲突检测结果
const handleConflictDetected = (data: { conflicts: any[] }) => {
  conflictInfo.value = data.conflicts
  showConflictDialog.value = true
}

// 处理无冲突情况
const handleNoConflict = () => {
  assignEmployee()
}

// 确认分配（忽略冲突）
const confirmAssignWithConflicts = () => {
  assignEmployee()
  showConflictDialog.value = false
}

// 取消分配
const cancelAssign = () => {
  pendingAssignment.value = null
  showConflictDialog.value = false
}

// 分配员工到班次
const assignEmployee = async () => {
  if (!pendingAssignment.value) return
  
  try {
    loading.value = true
    await rosterStore.assignShift({
      shiftId: pendingAssignment.value.shiftId,
      employeeId: pendingAssignment.value.employeeId,
      position: pendingAssignment.value.position
    })
    
    ElMessage.success('分配成功')
    emit('assign-success', pendingAssignment.value)
  } catch (error) {
    console.error('分配失败:', error)
    ElMessage.error('分配失败')
  } finally {
    loading.value = false
    pendingAssignment.value = null
  }
}

// 取消分配员工
// 此函数暂未使用，但保留以备将来实现取消分配功能
// const unassignEmployee = async (shiftId: string, employeeId: string, position: string) => {
//   try {
//     loading.value = true
//     await rosterStore.unassignShift({
//       shiftId,
//       employeeId,
//       position
//     })
//     
//     ElMessage.success('取消分配成功')
//     emit('unassign-success', { shiftId, employeeId, position })
//   } catch (error) {
//     console.error('取消分配失败:', error)
//     ElMessage.error('取消分配失败')
//   } finally {
//     loading.value = false
//   }
// }

// 监听排班表变化，重新加载员工列表
watch(() => rosterStore.schedule, () => {
  loadEmployees()
}, { immediate: true })

onMounted(() => {
  loadEmployees()
})
</script>

<template>
  <div class="drag-drop-assign" v-loading="loading">
    <!-- 员工列表 -->
    <div class="employee-list">
      <h3>可用员工</h3>
      <div 
        v-for="employee in allEmployees" 
        :key="employee.id"
        class="employee-item"
        draggable="true"
        @dragstart="onDragStart(employee)"
        @dragend="onDragEnd"
      >
        <el-tag :type="employee.position === '门店经理' ? 'danger' : employee.position === '副经理' ? 'warning' : 'info'">
          {{ employee.position }}
        </el-tag>
        <span class="employee-name">{{ employee.name }}</span>
      </div>
      
      <div v-if="allEmployees.length === 0" class="empty-list">
        暂无员工数据
      </div>
    </div>
    
    <!-- 冲突检测器（隐藏） -->
    <ConflictDetector
      v-if="pendingAssignment"
      ref="conflictDetectorRef"
      :shiftId="pendingAssignment.shiftId"
      :employeeId="pendingAssignment.employeeId"
      :position="pendingAssignment.position"
      @conflict-detected="handleConflictDetected"
      @no-conflict="handleNoConflict"
    />
    
    <!-- 冲突提示对话框 -->
    <el-dialog
      v-model="showConflictDialog"
      title="排班冲突提示"
      width="500px"
    >
      <div class="conflict-list">
        <div v-for="(conflict, index) in conflictInfo" :key="index" class="conflict-item">
          <el-alert
            :title="conflict.message"
            :type="conflict.severity === 'error' ? 'error' : 'warning'"
            :closable="false"
            show-icon
          >
            <div class="conflict-details" v-if="conflict.details">
              <div v-if="conflict.type === 'overlap'">
                与 {{ conflict.details.existingShift.date }} 的班次时间重叠
              </div>
              <div v-else-if="conflict.type === 'rest_hours'">
                休息时间不足 {{ conflict.details.minRequired }} 小时
              </div>
              <div v-else-if="conflict.type === 'max_daily_hours'">
                {{ conflict.details.date }} 工作时长超过 {{ conflict.details.maxAllowed }} 小时
              </div>
              <div v-else-if="conflict.type === 'max_weekly_hours'">
                {{ conflict.details.weekStart }} 至 {{ conflict.details.weekEnd }} 工作时长超过 {{ conflict.details.maxAllowed }} 小时
              </div>
              <div v-else-if="conflict.type === 'consecutive_days'">
                连续工作天数超过 {{ conflict.details.maxAllowed }} 天
              </div>
            </div>
          </el-alert>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelAssign">取消分配</el-button>
          <el-button type="warning" @click="confirmAssignWithConflicts">忽略冲突并分配</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.drag-drop-assign {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.employee-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  background-color: #f5f7fa;
}

.employee-list h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  color: #606266;
}

.employee-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: white;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
  border: 1px solid #dcdfe6;
}

.employee-item:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.employee-name {
  margin-left: 10px;
  font-weight: bold;
}

.empty-list {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.conflict-list {
  max-height: 300px;
  overflow-y: auto;
}

.conflict-item {
  margin-bottom: 10px;
}

.conflict-details {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}
</style>