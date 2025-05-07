<script setup lang="ts">
import { useShiftStore } from '@/stores/shiftStore'
import { useStoreStore } from '@/stores/storeStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { Shift, ShiftPosition } from '@/types/shiftTypes'

const route = useRoute()
const shiftStore = useShiftStore()
const storeStore = useStoreStore()

// 基础数据
const dialogVisible = ref(false)
const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const currentDayIndex = ref(0)
const formRef = ref()

// 职位选项
const positionOptions = ref([
  { value: 'cashier', label: '收银员' },
  { value: 'waiter', label: '服务员' },
  { value: 'cook', label: '厨师' },
  { value: 'manager', label: '店长' },
])

/**
 * 班次基础类型定义
 */
export interface ShiftTemp {
  id?: number;               // 班次ID (可选，新建时可能没有)
  day: number;               // 工作日 (0-6 对应周一到周日)
  start_time: string;        // 开始时间 (格式: "HH:mm")
  end_time: string;          // 结束时间 (格式: "HH:mm")
  store_id: number;          // 所属门店ID
  position: string;          // 单职位
  count: number;             // 需求人数
}

// 获取并验证路由参数
const scheduleId = computed(() => {
  const id = Number(route.params.scheduleId)
  if (isNaN(id)) {
    ElMessage.error('无效的排班ID')
    return 0
  }
  return id
})

const storeId = computed(() => {
  const id = Number(route.params.storeId)
  if (isNaN(id)) {
    ElMessage.error('无效的门店ID')
    return 0
  }
  return id
})

// 当前编辑的班次
const currentShift = ref<ShiftTemp>({
  day: currentDayIndex.value,
  start_time: '09:00',
  end_time: '17:00',
  store_id: 0,
  position: '',
  count: 1,
})

// 监听currentDayIndex的变化，更新currentShift的day
watch(currentDayIndex, (newValue) => {
  if (currentShift.value) {
    currentShift.value.day = Number(newValue)
  }
})

// 监听storeId的变化，更新currentShift的store_id
watch(storeId, (newValue) => {
  if (currentShift.value) {
    currentShift.value.store_id = Number(newValue)
  }
})

// 表单验证规则
const rules = {
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value || !currentShift.value.end_time) {
          callback()
          return
        }
        if (value >= currentShift.value.end_time) {
          callback(new Error('开始时间不能高于或等于结束时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (!value || !currentShift.value.start_time) {
          callback()
          return
        }
        if (value <= currentShift.value.start_time) {
          callback(new Error('结束时间不能低于或等于开始时间'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
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
  const store = storeStore.stores.find(s => Number(s.id) === storeId.value)
  return store?.name || '未知门店'
})

// 加载班次数据
async function loadShifts() {
  try {
    if (!scheduleId.value || !storeId.value) {
      ElMessage.error('缺少必要的参数')
      return
    }

    await shiftStore.loadShifts(storeId.value, scheduleId.value)
    console.log('加载到的班次数据:', {
      storeId: storeId.value,
      scheduleId: scheduleId.value,
      shifts: shiftStore.shifts,
      shiftsByDay: shiftsByDay.value
    })
  }
  catch (error) {
    console.error('加载班次数据失败:', error)
    ElMessage.error('加载班次数据失败')
  }
}

// 打开新增/编辑班次对话框
function openShiftDialog(shift?: any) {
  try {
    if (shift) {
      // 处理时间格式
      const formattedShift = {
        ...shift,
        start_time: shift.start_time ? shift.start_time.split(':').slice(0, 2).join(':') : '09:00',
        end_time: shift.end_time ? shift.end_time.split(':').slice(0, 2).join(':') : '17:00'
      }
      currentShift.value = { ...formattedShift }
      // 同步当前选中的工作日
      currentDayIndex.value = shift.day
    } else {
      // 确保使用当前选中的日期
      const currentDay = Number(currentDayIndex.value)
      currentShift.value = {
        day: currentDay,
        start_time: '09:00',
        end_time: '17:00',
        store_id: storeId.value,
        position: '',
        count: 1,
      }
    }
    dialogVisible.value = true
  } catch (error) {
    console.error('打开班次对话框失败:', error)
    ElMessage.error('打开班次对话框失败')
  }
}

// 提交班次表单
async function submitShift() {
  try {
    await formRef.value.validate()

    // 验证必要参数
    const requiredFields: Partial<Record<keyof ShiftTemp, string>> = {
      position: '请选择职位',
      count: '请输入有效的人数',
      store_id: '缺少门店ID',
      day: '缺少工作日',
      start_time: '缺少开始时间',
      end_time: '缺少结束时间'
    }

    for (const [field, message] of Object.entries(requiredFields)) {
      const key = field as keyof ShiftTemp
      if (
        (key === 'count' && (!currentShift.value[key] || currentShift.value[key] < 1)) ||
        (key === 'day' && currentShift.value[key] === undefined) ||
        (key !== 'count' && key !== 'day' && !currentShift.value[key])
      ) {
        ElMessage.error(message)
        return
      }
    }

    // 准备提交数据
    const shiftData: Omit<Shift, 'id' | 'created_at' | 'updated_at'> = {
      day: Number(currentShift.value.day),
      start_time: currentShift.value.start_time,
      end_time: currentShift.value.end_time,
      store_id: Number(storeId.value),
      schedule_id: Number(scheduleId.value),
      positions: [{
        position: currentShift.value.position,
        count: Number(currentShift.value.count),
        id: 0,
        shift_id: currentShift.value.id || 0
      }]
    }

    // 验证positions字段
    if (!shiftData.positions?.[0]?.position || !shiftData.positions?.[0]?.count) {
      ElMessage.error('职位信息不完整')
      return
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
  }
  catch (error) {
    console.error('提交班次失败:', error)
    ElMessage.error('提交班次失败')
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
  try {
    if (!time) return ''
    // 如果是HH:mm:ss格式，转换为HH:mm
    return time.split(':').slice(0, 2).join(':')
  } catch (error) {
    console.error('格式化时间失败:', error)
    return ''
  }
}

// 计算当前周的日期
const getWeekDates = () => {
  try {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))
    
    return weekdays.map((_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    })
  } catch (error) {
    console.error('计算周日期失败:', error)
    return weekdays.map(() => '日期计算错误')
  }
}

const weekDates = ref(getWeekDates())

// 计算时间段进度条样式
function getTimeBarStyle(start: string, end: string) {
  // start, end 格式为 HH:mm
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMinutes = sh * 60 + sm
  const endMinutes = eh * 60 + em
  const totalMinutes = 24 * 60
  const left = (startMinutes / totalMinutes) * 100
  const width = ((endMinutes - startMinutes) / totalMinutes) * 100
  return {
    left: `${left}%`,
    width: `${width}%`
  }
}

onMounted(async () => {
  try {
    await Promise.all([
      loadShifts(),
      storeStore.fetchStores(),
    ])
  } catch (error) {
    console.error('初始化数据失败:', error)
    ElMessage.error('初始化数据失败')
  }
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
          :label="`${dayName}（${weekDates[index]}）`"
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
                <div class="shift-row">
                  <div class="shift-time-block">
                    <span class="shift-time-main">{{ formatTime(shift.start_time) }} - {{ formatTime(shift.end_time) }}</span>
                  </div>
                  <div class="shift-positions-inline" v-if="shift.positions?.length">
                    <div
                      v-for="position in shift.positions"
                      :key="position.position"
                      class="position-row-inline"
                    >
                      <span class="position-label-inline">
                        {{ positionOptions.find(p => p.value === position.position)?.label || position.position }}
                      </span>
                      <span class="position-badge-inline">{{ position.count }}人</span>
                    </div>
                  </div>
                  <div class="shift-actions-inline">
                    <el-button size="small" @click="openShiftDialog(shift)">
                      编辑
                    </el-button>
                    <el-button size="small" type="danger" @click="deleteShift(shift.id)">
                      删除
                    </el-button>
                  </div>
                </div>
                <div class="shift-time-bar-bg">
                  <div
                    class="shift-time-bar"
                    :style="getTimeBarStyle(formatTime(shift.start_time), formatTime(shift.end_time))"
                  ></div>
                </div>
                <div class="shift-time-ruler">
                  <span v-for="t in [0,6,12,18,24]" :key="t" class="ruler-tick" :style="{ left: (t/24*100) + '%' }">
                    {{ t === 24 ? '24:00' : (t < 10 ? '0' + t : t) + ':00' }}
                  </span>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增/编辑班次对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentShift.id ? `编辑班次（${weekdays[currentShift.day]}）` : `新建班次（${weekdays[currentShift.day]}）`"
      width="500px"
    >
      <el-form ref="formRef" :model="currentShift" :rules="rules" label-width="100px">
        <el-form-item prop="start_time" label="开始时间" required>
          <el-time-select
            v-model="currentShift.start_time"
            :picker-options="{ start: '00:00', end: '23:30', step: '00:30' }"
            placeholder="选择开始时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item prop="end_time" label="结束时间" required>
          <el-time-select
            v-model="currentShift.end_time"
            :picker-options="{ start: '00:00', end: '23:30', step: '00:30' }"
            placeholder="选择结束时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>

        <el-form-item label="职位需求" required>
          <el-select
            v-model="currentShift.position"
            placeholder="请选择职位"
            style="width: 60%"
          >
            <el-option
              v-for="item in positionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-input-number
            v-model="currentShift.count"
            :min="1"
            style="margin-left: 16px; width: 120px"
            :step="1"
            controls-position="right"
            placeholder="人数"
          />
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
  margin-bottom: 3px;
  padding: 0;
  border-radius: 5px;
  box-shadow: 0 1px 2px #ececec;
}

.shift-row {
  display: flex;
  align-items: center;
  padding: 5px 8px 2px 8px;
  gap: 8px;
}

.shift-time-block {
  min-width: 80px;
  background: linear-gradient(90deg, #e3f0ff 60%, #fff 100%);
  border-radius: 4px;
  padding: 3px 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 13px;
  color: #3578e5;
  margin-right: 6px;
}

.shift-positions-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}

.position-row-inline {
  display: flex;
  align-items: center;
  gap: 2px;
}

.position-label-inline {
  background: #f0f6ff;
  color: #3578e5;
  padding: 0 6px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
}

.position-badge-inline {
  background: #e6f7e6;
  color: #2e7d32;
  border-radius: 6px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 500;
  min-width: 18px;
  text-align: center;
  display: inline-block;
}

.shift-actions-inline {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.shift-time-bar-bg {
  position: relative;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  margin: 2px 0 0 0;
  width: 100%;
  overflow: hidden;
}
.shift-time-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #6fbaf8, #3578e5);
  border-radius: 2px;
}

.shift-time-ruler {
  position: relative;
  height: 10px;
  width: 100%;
  margin-top: 0;
}
.ruler-tick {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 12px;
  color: #dddddd;
  user-select: none;
  font-family: monospace;
}
</style>
