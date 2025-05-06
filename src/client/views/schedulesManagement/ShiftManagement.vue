<script setup lang="ts">
import type { Shift } from '@/types/shiftTypes'
import { useShiftStore } from '@/stores/shiftStore'
import { useStoreStore } from '@/stores/storeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const shiftStore = useShiftStore()
const storeStore = useStoreStore()

const scheduleId = Number(route.params.scheduleId)
const storeId = Number(route.params.storeId)
const dialogVisible = ref(false)
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

/**
 * 班次基础类型定义
 */
 export interface ShiftTemp {
  id?: number;               // 班次ID (可选，新建时可能没有)
  day: number;               // 工作日 (0-6 对应周一到周日)
  start_time: string;        // 开始时间 (格式: "HH:mm")
  end_time: string;          // 结束时间 (格式: "HH:mm")
  store_id: number;          // 所属门店ID
  positions: string[];       // 关联的职位数组
}

// 职位选项
const positionOptions = ref([
  { value: 'cashier', label: '收银员' },
  { value: 'waiter', label: '服务员' },
  { value: 'cook', label: '厨师' },
  { value: 'manager', label: '店长' },
])

// 当前编辑的班次
const currentShift = ref<ShiftTemp>({
  day: 0,
  start_time: '09:00',
  end_time: '17:00',
  store_id: storeId,
  positions: [],
})

// 表单引用
const formRef = ref()

// 当前选中的工作日
const currentDayIndex = ref(0)

// 表单验证规则
const rules = {
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
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
  }
  catch (error) {
    ElMessage.error('加载班次数据失败')
  }
}

// 打开新增/编辑班次对话框
function openShiftDialog(shift?: any) {
  if (shift) {
    currentShift.value = { ...shift }
  }
  else {
    currentShift.value = {
      day: currentDayIndex.value,
      start_time: '09:00',
      end_time: '17:00',
      store_id: storeId,
      positions: [],
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
      store_id: storeId,
      positions: currentShift.value.positions.map(position => ({
        id: 0, // 新建时id为0，后端会自动生成
        position,
        count: 1, // 默认每个职位需要1人
        shift_id: currentShift.value.id || 0, // 如果是新建，则为0
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (currentShift.value.id) {
      await shiftStore.updateExistingShift(currentShift.value.id, shiftData)
      ElMessage.success('班次更新成功')
    }
    else {
      await shiftStore.createNewShift(shiftData)
      ElMessage.success('班次创建成功')
    }

    dialogVisible.value = false
    await loadShifts()
  }
  catch (error) {
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
      type: 'warning',
    })

    await shiftStore.removeShift(id)
    ElMessage.success('班次删除成功')
    await loadShifts()
  }
  catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 格式化时间显示
function formatTime(time: string) {
  return time || ''
}

onMounted(async () => {
  await Promise.all([
    loadShifts(),
    storeStore.fetchStores(),
  ])
})
</script>

<template>
  <div class="shift-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h2>班次管理 - {{ storeName }} (排班ID: {{ scheduleId }})</h2>
        </div>
      </template>

      <el-tabs v-model="currentDayIndex" type="card">
        <el-tab-pane
          v-for="(dayName, index) in weekdays"
          :key="index"
          :label="dayName"
          :name="index"
        >
          <div class="day-content">
            <div class="day-header">
              <h3>{{ dayName }}的班次安排</h3>
              <el-button type="primary" size="small" @click="openShiftDialog()">
                添加班次
              </el-button>
            </div>
            <div class="shifts-list">
              <el-empty v-if="shiftsByDay[Number(index)]?.length === 0" description="暂无班次" />
              <el-card
                v-for="shift in shiftsByDay[Number(index)]"
                :key="shift.id"
                class="shift-card"
              >
                <div class="shift-header">
                  <span class="shift-time">{{ formatTime(shift.start_time) }} - {{ formatTime(shift.end_time) }}</span>
                </div>
                <div class="shift-positions" v-if="shift.positions?.length">
                  <el-tag
                    v-for="position in shift.positions"
                    :key="position"
                    class="position-tag"
                  >
                    {{ positionOptions.find(p => p.value === position)?.label || position }}
                  </el-tag>
                </div>
                <div class="shift-actions">
                  <el-button size="small" @click="openShiftDialog(shift)">
                    编辑
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteShift(shift.id)">
                    删除
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑班次对话框 -->
    <el-dialog v-model="dialogVisible" :title="currentShift.id ? '编辑班次' : '新建班次'" width="500px">
      <el-form ref="formRef" :model="currentShift" :rules="rules" label-width="100px">
        <el-form-item label="工作日">
          <span>{{ weekdays[currentShift.day] }}</span>
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

        <el-form-item label="职位需求">
          <el-select
            v-model="currentShift.positions"
            multiple
            placeholder="请选择需要的职位"
            style="width: 100%"
          >
            <el-option
              v-for="item in positionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="submitShift">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.shift-management {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header h2,
.day-header h3 {
  margin: 0;
  font-weight: 500;
}

.card-header h2 {
  font-size: 18px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.day-content {
  padding: 20px;
}

.shifts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.shift-card {
  margin-bottom: 10px;
}

.shift-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.shift-time {
  font-weight: bold;
  font-size: 16px;
}

.shift-positions {
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.shift-actions {
  display: flex;
  gap: 5px;
  margin-top: 10px;
  justify-content: flex-end;
}
</style>
