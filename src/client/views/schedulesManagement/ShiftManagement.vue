<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useShiftStore } from '@/stores/shiftStore'
import { useStoreStore } from '@/stores/storeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref, computed } from 'vue'
import type { Shift } from '@/types/shiftTypes'

const route = useRoute()
const shiftStore = useShiftStore()
const storeStore = useStoreStore()

const scheduleId = Number(route.params.scheduleId)
const storeId = Number(route.params.storeId)
const dialogVisible = ref(false)
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

// 当前编辑的班次
const currentShift = ref<Partial<Shift>>({
  day: 0,
  start_time: '09:00',
  end_time: '17:00',
  status: 'open',
  store_id: storeId,
  positions: []
})

// 表单引用
const formRef = ref()

// 表单验证规则
const rules = {
  day: [{ required: true, message: '请选择工作日', trigger: 'change' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

// 按日期分组的班次
const shiftsByDay = computed(() => {
  const result: Record<number, any[]> = {}
  for (let i = 0; i < 7; i++) {
    result[i] = shiftStore.getShiftsByDay(i)
  }
  return result
})

// 获取门店名称
const storeName = computed(() => {
  const store = storeStore.stores.find(s => Number(s.id) === storeId)
  return store?.name || '未知门店'
})

// 加载班次数据
async function loadShifts() {
  try {
    await shiftStore.loadShifts(storeId)
  } catch (error) {
    ElMessage.error('加载班次数据失败')
  }
}

// 打开新增/编辑班次对话框
function openShiftDialog(shift?: any) {
  if (shift) {
    currentShift.value = { ...shift }
  } else {
    currentShift.value = {
      day: 0,
      start_time: '09:00',
      end_time: '17:00',
      status: 'open',
      store_id: storeId,
      positions: []
    }
  }
  dialogVisible.value = true
}

// 提交班次表单
async function submitShift() {
  try {
    await formRef.value.validate()
    
    // 准备提交数据
    const shiftData = {
      day: currentShift.value.day,
      start_time: currentShift.value.start_time,
      end_time: currentShift.value.end_time,
      status: currentShift.value.status,
      store_id: storeId,
      positions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (currentShift.value.id) {
      await shiftStore.updateExistingShift(currentShift.value.id, shiftData)
      ElMessage.success('班次更新成功')
    } else {
      await shiftStore.createNewShift(shiftData)
      ElMessage.success('班次创建成功')
    }
    
    dialogVisible.value = false
    await loadShifts()
  } catch (error) {
    console.error('提交班次数据失败:', error)
    ElMessage.error('操作失败')
  }
}

// 删除班次
async function deleteShift(id: number) {
  try {
    await ElMessageBox.confirm('确定要删除这个班次吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await shiftStore.removeShift(id)
    ElMessage.success('班次删除成功')
    await loadShifts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 切换班次状态
async function toggleStatus(shift: any) {
  try {
    const newStatus = shift.status === 'open' ? 'closed' : 'open'
    await shiftStore.toggleShiftStatus(shift.id, newStatus)
    ElMessage.success(`班次状态已更改为${newStatus === 'open' ? '开放' : '关闭'}`)
  } catch (error) {
    ElMessage.error('更改状态失败')
  }
}

// 格式化时间显示
function formatTime(time: string) {
  return time || ''
}

onMounted(async () => {
  await Promise.all([
    loadShifts(),
    storeStore.fetchStores()
  ])
})
</script>

<template>
  <div class="shift-management">
    <div class="header">
      <h2>班次管理 - {{ storeName }} (排班ID: {{ scheduleId }})</h2>
      <el-button type="primary" @click="openShiftDialog()">
        新建班次
      </el-button>
    </div>

    <div class="shifts-container">
      <div v-for="day in 7" :key="day-1" class="day-section">
        <h3>{{ weekdays[day-1] }}</h3>
        
        <div class="shifts-list">
          <el-empty v-if="shiftsByDay[day-1]?.length === 0" description="暂无班次" />
          
          <el-card 
            v-for="shift in shiftsByDay[day-1]" 
            :key="shift.id" 
            class="shift-card"
            :class="{ 'closed': shift.status === 'closed' }"
          >
            <div class="shift-header">
              <span class="shift-time">{{ formatTime(shift.start_time) }} - {{ formatTime(shift.end_time) }}</span>
              <el-tag :type="shift.status === 'open' ? 'success' : 'info'">
                {{ shift.status === 'open' ? '开放' : '关闭' }}
              </el-tag>
            </div>
            
            <div class="shift-actions">
              <el-button size="small" @click="openShiftDialog(shift)">
                编辑
              </el-button>
              <el-button 
                size="small" 
                :type="shift.status === 'open' ? 'warning' : 'success'"
                @click="toggleStatus(shift)"
              >
                {{ shift.status === 'open' ? '关闭' : '开放' }}
              </el-button>
              <el-button size="small" type="danger" @click="deleteShift(shift.id)">
                删除
              </el-button>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- 新增/编辑班次对话框 -->
    <el-dialog v-model="dialogVisible" :title="currentShift.id ? '编辑班次' : '新建班次'">
      <el-form ref="formRef" :model="currentShift" :rules="rules" label-width="100px">
        <el-form-item prop="day" label="工作日" required>
          <el-select v-model="currentShift.day">
            <el-option 
              v-for="(name, index) in weekdays" 
              :key="index" 
              :label="name" 
              :value="index" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item prop="start_time" label="开始时间" required>
          <el-time-picker 
            v-model="currentShift.start_time" 
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择开始时间"
          />
        </el-form-item>
        
        <el-form-item prop="end_time" label="结束时间" required>
          <el-time-picker 
            v-model="currentShift.end_time" 
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择结束时间"
          />
        </el-form-item>
        
        <el-form-item prop="status" label="状态">
          <el-radio-group v-model="currentShift.status">
            <el-radio label="open">开放</el-radio>
            <el-radio label="closed">关闭</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitShift">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.shift-management {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.shifts-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.day-section {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f8f8;
}

.shifts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.shift-card {
  margin-bottom: 10px;
}

.shift-card.closed {
  opacity: 0.7;
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shift-time {
  font-weight: bold;
}

.shift-actions {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}
</style>