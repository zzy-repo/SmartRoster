<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import DaySchedule from '../../components/roster/DaySchedule.vue'
import WeekSchedule from '../../components/roster/WeekSchedule.vue'
import { useRosterStore } from '../../stores/rosterStore'
import { useStoreStore } from '../../stores/storeStore'

interface Employee {
  id: string
  name: string
  position: string
}

const route = useRoute()
const rosterStore = useRosterStore()
const storeStore = useStoreStore()

// 状态
const loading = ref(false)
const currentDate = ref(new Date())
const selectedStoreId = ref('')
const showAssignDialog = ref(false)
const currentShiftId = ref('')
const currentPosition = ref('')
const availableEmployees = ref<Employee[]>([])
const selectedEmployeeId = ref('')

// 计算属性
const formattedDate = computed(() => {
  return currentDate.value.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

const weekStart = computed(() => {
  const date = new Date(currentDate.value)
  const day = date.getDay() || 7
  if (day !== 1) {
    date.setHours(-24 * (day - 1))
  }
  return date
})

const weekEnd = computed(() => {
  const date = new Date(weekStart.value)
  date.setDate(date.getDate() + 6)
  return date
})

// 格式化日期为YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

// 加载排班表数据
async function loadSchedule() {
  if (!selectedStoreId.value) {
    ElMessage.warning('请先选择门店')
    return
  }

  loading.value = true
  try {
    const params = {
      startDate: formatDate(weekStart.value),
      endDate: formatDate(weekEnd.value),
      storeId: selectedStoreId.value,
    }

    await rosterStore.fetchSchedule(params)
  }
  catch (error) {
    console.error('加载排班表失败:', error)
    ElMessage.error('加载排班表失败')
  }
  finally {
    loading.value = false
  }
}

// 生成排班表
async function generateSchedule() {
  if (!selectedStoreId.value) {
    ElMessage.warning('请先选择门店')
    return
  }

  try {
    await ElMessageBox.confirm(
      '确定要生成新的排班表吗？这将覆盖当前的排班数据。',
      '确认生成',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    loading.value = true
    const params = {
      startDate: formatDate(weekStart.value),
      endDate: formatDate(weekEnd.value),
      storeId: selectedStoreId.value,
    }

    await rosterStore.generateSchedule(params)
    ElMessage.success('排班表生成成功')
  }
  catch (error) {
    if (error !== 'cancel') {
      console.error('生成排班表失败:', error)
      ElMessage.error('生成排班表失败')
    }
  }
  finally {
    loading.value = false
  }
}

// 切换视图
function switchView(view: 'day' | 'week') {
  rosterStore.setCurrentView(view)
}

// 切换分组方式
function switchGroupBy(groupBy: 'position' | 'employee' | 'skill') {
  rosterStore.setGroupBy(groupBy)
}

// 处理日期变化
function handleDateChange(date: Date) {
  currentDate.value = date
  rosterStore.setCurrentDate(date)
  loadSchedule()
}

// 上一天/周
function goToPrevious() {
  const date = new Date(currentDate.value)
  if (rosterStore.currentView === 'day') {
    date.setDate(date.getDate() - 1)
  }
  else {
    date.setDate(date.getDate() - 7)
  }
  handleDateChange(date)
}

// 下一天/周
function goToNext() {
  const date = new Date(currentDate.value)
  if (rosterStore.currentView === 'day') {
    date.setDate(date.getDate() + 1)
  }
  else {
    date.setDate(date.getDate() + 7)
  }
  handleDateChange(date)
}

// 今天
function goToToday() {
  handleDateChange(new Date())
}

// 处理分配班次
async function handleAssignShift(data: { shiftId: string, position: string }) {
  currentShiftId.value = data.shiftId
  currentPosition.value = data.position

  // 获取可用员工列表
  try {
    const response = await rosterStore.getAvailableEmployees({
      shiftId: data.shiftId,
      position: data.position,
    })
    availableEmployees.value = response.data
    showAssignDialog.value = true
  }
  catch (error) {
    console.error('获取可用员工列表失败:', error)
    ElMessage.error('获取可用员工列表失败')
  }
}

// 处理取消分配
async function handleUnassignShift(data: { shiftId: string, employeeId: string, position: string }) {
  try {
    await ElMessageBox.confirm(
      '确定要取消该员工的班次分配吗？',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )

    await rosterStore.unassignShift(data)
    ElMessage.success('取消分配成功')
  }
  catch (error) {
    if (error !== 'cancel') {
      console.error('取消分配失败:', error)
      ElMessage.error('取消分配失败')
    }
  }
}

// 确认分配班次
async function confirmAssign() {
  if (!selectedEmployeeId.value) {
    ElMessage.warning('请选择员工')
    return
  }

  try {
    await rosterStore.assignShift({
      shiftId: currentShiftId.value,
      employeeId: selectedEmployeeId.value,
      position: currentPosition.value,
    })

    showAssignDialog.value = false
    selectedEmployeeId.value = ''
    ElMessage.success('分配班次成功')
  }
  catch (error) {
    console.error('分配班次失败:', error)
    ElMessage.error('分配班次失败')
  }
}

// 取消分配对话框
function cancelAssign() {
  showAssignDialog.value = false
  selectedEmployeeId.value = ''
}

// 加载门店数据
async function loadStores() {
  try {
    await storeStore.fetchStores()
    if (storeStore.stores.length > 0 && !selectedStoreId.value) {
      selectedStoreId.value = storeStore.stores[0].id
    }
  }
  catch (error) {
    console.error('加载门店数据失败:', error)
  }
}

// 初始化
onMounted(async () => {
  await loadStores()
  if (selectedStoreId.value) {
    loadSchedule()
  }

  // 如果路由中有视图参数，则切换到对应视图
  if (route.params.view === 'day') {
    switchView('day')
  }
  else if (route.params.view === 'week') {
    switchView('week')
  }
})
</script>

<template>
  <div class="roster-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>排班表</h2>
          <div class="header-actions">
            <el-select v-model="selectedStoreId" placeholder="选择门店" @change="loadSchedule">
              <el-option
                v-for="store in storeStore.stores"
                :key="store.id"
                :label="store.name"
                :value="store.id"
              />
            </el-select>

            <el-button-group>
              <el-button
                :type="rosterStore.currentView === 'day' ? 'primary' : 'default'"
                @click="switchView('day')"
              >
                日视图
              </el-button>
              <el-button
                :type="rosterStore.currentView === 'week' ? 'primary' : 'default'"
                @click="switchView('week')"
              >
                周视图
              </el-button>
            </el-button-group>

            <el-dropdown @command="switchGroupBy">
              <el-button>
                分组方式
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="position">
                    按岗位
                  </el-dropdown-item>
                  <el-dropdown-item command="employee">
                    按员工
                  </el-dropdown-item>
                  <el-dropdown-item command="skill">
                    按技能
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button type="success" :loading="loading" @click="generateSchedule">
              生成排班表
            </el-button>
          </div>
        </div>
      </template>

      <div class="date-navigation">
        <el-button-group>
          <el-button @click="goToPrevious">
            <el-icon><arrow-left /></el-icon>
            {{ rosterStore.currentView === 'day' ? '前一天' : '前一周' }}
          </el-button>
          <el-button @click="goToToday">
            今天
          </el-button>
          <el-button @click="goToNext">
            {{ rosterStore.currentView === 'day' ? '后一天' : '后一周' }}
            <el-icon><arrow-right /></el-icon>
          </el-button>
        </el-button-group>

        <div class="current-date">
          <template v-if="rosterStore.currentView === 'day'">
            {{ formattedDate }}
          </template>
          <template v-else>
            {{ weekStart.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }} -
            {{ weekEnd.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}
          </template>
        </div>

        <el-date-picker
          v-model="currentDate"
          :type="rosterStore.currentView === 'day' ? 'date' : 'week'"
          format="YYYY/MM/DD"
          placeholder="选择日期"
          @change="handleDateChange"
        />
      </div>

      <div class="schedule-container">
        <template v-if="rosterStore.currentView === 'day'">
          <DaySchedule
            :date="currentDate"
            :store-id="selectedStoreId"
            :group-by="rosterStore.groupBy"
            @assign="handleAssignShift"
            @unassign="handleUnassignShift"
          />
        </template>

        <template v-else>
          <WeekSchedule
            :week-start="weekStart"
            :store-id="selectedStoreId"
            :group-by="rosterStore.groupBy"
            @assign="handleAssignShift"
            @unassign="handleUnassignShift"
          />
        </template>
      </div>
    </el-card>

    <!-- 分配员工对话框 -->
    <el-dialog
      v-model="showAssignDialog"
      title="分配员工"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="岗位">
          <el-tag>{{ currentPosition }}</el-tag>
        </el-form-item>

        <el-form-item label="选择员工">
          <el-select v-model="selectedEmployeeId" placeholder="请选择员工" style="width: 100%">
            <el-option
              v-for="emp in availableEmployees"
              :key="emp.id"
              :label="emp.name"
              :value="emp.id"
            >
              <div class="employee-option">
                <span>{{ emp.name }}</span>
                <span class="employee-position">{{ emp.position }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="cancelAssign">取消</el-button>
          <el-button type="primary" @click="confirmAssign">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.roster-view {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.current-date {
  font-size: 18px;
  font-weight: bold;
}

.schedule-container {
  margin-top: 20px;
}

.employee-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-position {
  color: #909399;
  font-size: 12px;
}
</style>
