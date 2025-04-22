<script setup lang="ts">
import { useScheduleStore } from '@/stores/scheduleStore'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

interface EmployeeShift {
  id: string
  name: string
  position: string
  department: string
  shifts: Record<string, string> // 时间段 -> 班次类型
}

interface TimeSlot {
  key: string
  label: string
  start: string
  end: string
}

const props = defineProps<{
  date: Date
}>()

const emit = defineEmits<{
  (e: 'update:date', date: Date): void
}>()

const scheduleStore = useScheduleStore()
const currentDate = ref(props.date)
const employeeList = ref<EmployeeShift[]>([])
const showGrouping = ref(false)

// 按部门分组的员工列表
const groupedEmployees = computed(() => {
  const groups: Record<string, EmployeeShift[]> = {}

  employeeList.value.forEach((employee) => {
    if (!groups[employee.department]) {
      groups[employee.department] = []
    }
    groups[employee.department].push(employee)
  })

  return groups
})

// 表格合并单元格方法（用于时间轴标记）
function objectSpanMethod({ row, column, rowIndex, columnIndex }: any) {
  // 只处理时间列的表头合并
  if (column.property && column.property.endsWith(':00')) {
    // 整点列可以考虑合并
    return {
      colspan: 1,
      rowspan: 1,
    }
  }
  return {
    colspan: 1,
    rowspan: 1,
  }
}

// 监听日期变化
const formattedDate = computed(() => {
  return currentDate.value.toISOString().slice(0, 10)
})

// 生成时间段（从8:00到22:00，每30分钟一个时间段）
const timeSlots = computed(() => {
  const slots: TimeSlot[] = []
  const startHour = 8
  const endHour = 22

  for (let hour = startHour; hour < endHour; hour++) {
    // 整点时间段
    slots.push({
      key: `${hour.toString().padStart(2, '0')}:00`,
      label: `${hour}:00`, // 显示所有整点时间
      start: `${hour.toString().padStart(2, '0')}:00`,
      end: `${hour.toString().padStart(2, '0')}:30`,
    })

    // 半点时间段
    slots.push({
      key: `${hour.toString().padStart(2, '0')}:30`,
      label: '', // 半点不显示标签
      start: `${hour.toString().padStart(2, '0')}:30`,
      end: `${(hour + 1).toString().padStart(2, '0')}:00`,
    })
  }

  return slots
})

// 获取指定时间段的班次信息
function getShiftForTimeSlot(employee: EmployeeShift, timeSlotKey: string): string | null {
  return employee.shifts[timeSlotKey] || null
}

// 根据班次类型获取样式类
function getShiftClass(shiftType: string | null): string {
  if (!shiftType)
    return ''

  const classMap: Record<string, string> = {
    早班: 'shift-morning',
    中班: 'shift-mid',
    晚班: 'shift-evening',
    夜班: 'shift-night',
    培训: 'shift-training',
    休息: 'shift-rest',
  }

  return classMap[shiftType] || 'shift-default'
}

// 获取单元格样式
function getCellClass({ row, column }: { row: EmployeeShift, column: any }): string {
  if (column.property === 'name')
    return ''

  const shiftType = getShiftForTimeSlot(row, column.property)
  return shiftType ? getShiftClass(shiftType) : ''
}

// 前一天
function prevDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() - 1)
  currentDate.value = newDate
  emit('update:date', newDate)
  loadScheduleData()
}

// 后一天
function nextDay() {
  const newDate = new Date(currentDate.value)
  newDate.setDate(newDate.getDate() + 1)
  currentDate.value = newDate
  emit('update:date', newDate)
  loadScheduleData()
}

// 加载排班数据
async function loadScheduleData() {
  try {
    // 模拟数据 - 实际项目中应该从 scheduleStore 获取
    const mockEmployees = [
      { id: '1', name: '张三', position: '收银员', department: '客服组' },
      { id: '2', name: '李四', position: '理货员', department: '运营组' },
      { id: '3', name: '王五', position: '客服专员', department: '客服组' },
      { id: '4', name: '赵六', position: '仓库管理员', department: '物流组' },
      { id: '5', name: '钱七', position: '保洁员', department: '后勤组' },
      { id: '6', name: '孙八', position: '收银员', department: '客服组' },
      { id: '7', name: '周九', position: '客服专员', department: '客服组' },
      { id: '8', name: '吴十', position: '理货员', department: '运营组' },
    ]

    // 模拟班次数据
    const mockShifts: Record<string, Record<string, string>> = {
      1: { '08:00': '早班', '08:30': '早班', '09:00': '休息', '09:30': '早班', '10:00': '早班' },
      2: { '09:00': '培训', '09:30': '培训', '10:00': '培训', '10:30': '中班', '11:00': '中班' },
      3: { '12:00': '中班', '12:30': '中班', '13:00': '中班', '13:30': '休息', '14:00': '中班' },
      4: { '16:00': '晚班', '16:30': '晚班', '17:00': '晚班', '17:30': '晚班', '18:00': '晚班' },
      5: { '20:00': '夜班', '20:30': '夜班', '21:00': '夜班', '21:30': '夜班' },
      6: { '08:00': '早班', '08:30': '早班', '09:00': '早班', '09:30': '早班', '10:00': '休息' },
      7: { '14:00': '中班', '14:30': '中班', '15:00': '中班', '15:30': '中班', '16:00': '中班' },
      8: { '11:00': '中班', '11:30': '中班', '12:00': '休息', '12:30': '中班', '13:00': '中班' },
    }

    // 转换为组件所需的数据格式
    employeeList.value = mockEmployees.map(emp => ({
      id: emp.id,
      name: emp.name,
      position: emp.position,
      department: emp.department,
      shifts: mockShifts[emp.id] || {},
    }))

    // 实际项目中应该从 scheduleStore 获取数据
    // await scheduleStore.fetchSchedules()
    // const scheduleForDate = scheduleStore.schedules.find(s =>
    //   new Date(s.start_date).toISOString().slice(0, 10) === formattedDate.value
    // )

    // if (scheduleForDate) {
    //   // 处理实际数据...
    // }
  }
  catch (error) {
    ElMessage.error('加载排班数据失败')
    console.error('加载排班数据失败', error)
  }
}

onMounted(() => {
  loadScheduleData()
})
</script>

<template>
  <div class="day-schedule-view">
    <div class="day-header">
      <el-button @click="prevDay">
        前一天
      </el-button>
      <h3>{{ formattedDate }} 排班详情</h3>
      <el-button @click="nextDay">
        后一天
      </el-button>
    </div>

    <!-- 分组显示开关 -->
    <div class="view-options">
      <el-switch
        v-model="showGrouping"
        active-text="按部门分组"
        inactive-text="不分组"
      />
    </div>

    <!-- 不分组视图 -->
    <el-table
      v-if="!showGrouping"
      :data="employeeList"
      border
      style="width: 100%"
      :cell-class-name="getCellClass"
      :span-method="objectSpanMethod"
    >
      <!-- 员工信息列 -->
      <el-table-column prop="name" label="员工姓名" width="120" fixed="left" />

      <!-- 动态生成时间段列 -->
      <el-table-column
        v-for="timeSlot in timeSlots"
        :key="timeSlot.key"
        :label="timeSlot.label"
        :prop="timeSlot.key"
        align="center"
        width="80"
        :class-name="timeSlot.key.endsWith(':00') ? 'hour-column' : 'half-hour-column'"
      >
        <template #default="{ row, column }">
          <div
            v-if="getShiftForTimeSlot(row, timeSlot.key)"
            class="shift-cell"
            :class="getShiftClass(getShiftForTimeSlot(row, timeSlot.key))"
          >
            {{ getShiftForTimeSlot(row, timeSlot.key) }}
          </div>
          <div v-else>
            —
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分组视图 -->
    <div v-else>
      <div v-for="(group, groupName) in groupedEmployees" :key="groupName" class="department-group">
        <h4 class="group-title">
          {{ groupName }}
        </h4>
        <el-table
          :data="group"
          border
          style="width: 100%; margin-bottom: 20px"
          :cell-class-name="getCellClass"
        >
          <!-- 员工信息列 -->
          <el-table-column prop="name" label="员工姓名" width="120" fixed="left" />

          <!-- 动态生成时间段列 -->
          <el-table-column
            v-for="timeSlot in timeSlots"
            :key="timeSlot.key"
            :label="timeSlot.label"
            :prop="timeSlot.key"
            align="center"
            width="80"
            :class-name="timeSlot.key.endsWith(':00') ? 'hour-column' : 'half-hour-column'"
          >
            <template #default="{ row, column }">
              <div
                v-if="getShiftForTimeSlot(row, timeSlot.key)"
                class="shift-cell"
                :class="getShiftClass(getShiftForTimeSlot(row, timeSlot.key))"
              >
                {{ getShiftForTimeSlot(row, timeSlot.key) }}
              </div>
              <div v-else>
                —
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.day-schedule-view {
  width: 100%;
  overflow-x: auto;
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.view-options {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.shift-cell {
  padding: 6px 4px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shift-morning {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.shift-mid {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.shift-evening {
  background-color: #fff7e6;
  color: #fa8c16;
  border: 1px solid #ffd591;
}

.shift-night {
  background-color: #f9f0ff;
  color: #722ed1;
  border: 1px solid #d3adf7;
}

.shift-training {
  background-color: #fcf4f6;
  color: #eb2f96;
  border: 1px solid #ffadd2;
}

.shift-rest {
  background-color: #f5f5f5;
  color: #8c8c8c;
  border: 1px solid #d9d9d9;
}

.shift-default {
  background-color: #f0f0f0;
  color: #595959;
  border: 1px solid #d9d9d9;
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-border-color: #ebeef5;
  --el-table-header-bg-color: #f5f7fa;
  border-radius: 6px;
  overflow: hidden;
}

:deep(.el-table__header th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  text-align: center;
  height: 50px;
}

:deep(.el-table__row td) {
  padding: 4px 0;
  height: 50px;
}

:deep(.hour-column) {
  background-color: #f5f7fa;
  border-left: 1px solid #dcdfe6;
}

:deep(.half-hour-column) {
  background-color: #fafafa;
}

.group-title {
  margin: 16px 0 8px 0;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  color: #606266;
  font-size: 14px;
  font-weight: bold;
  border-left: 4px solid #409EFF;
}

.department-group {
  margin-bottom: 24px;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .day-schedule-view {
    padding: 8px;
  }

  :deep(.el-table__row td) {
    padding: 2px 0;
    height: 40px;
  }

  .shift-cell {
    padding: 2px;
    font-size: 10px;
  }
}
</style>
