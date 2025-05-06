<script setup lang="ts">
import { useScheduleStore } from '@/stores/scheduleStore'
import { useStoreStore } from '@/stores/storeStore'
import { ElMessage } from 'element-plus'
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const storeStore = useStoreStore()
const scheduleStore = useScheduleStore()
const dialogVisible = ref(false)
const formRef = ref()

// 类型定义
interface Schedule {
  id: number
  start_date: string
  end_date: string
  status: string
  store_id?: string
  year?: number
  month?: number
  week_number?: number
}

// 日期处理函数
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const getDateFromWeek = (year: number, week: number) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = simple
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  return ISOweekStart
}

// 当前日期相关函数
const getCurrentDate = () => new Date()
const getCurrentYear = () => getCurrentDate().getFullYear()
const getCurrentMonth = () => getCurrentDate().getMonth() + 1
const getCurrentWeekNumber = () => getWeekNumber(getCurrentDate())

// 选项生成函数
const generateYearOptions = () => Array.from({ length: 11 }, (_, i) => {
  const year = getCurrentYear() - 5 + i
  return { value: year, label: `${year}年` }
})

const generateMonthOptions = () => Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`
}))

const getWeekOptionsForMonth = (year: number, month: number) => {
  const weeks = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  let currentDate = new Date(firstDay)
  while (currentDate.getDay() !== 1) {
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  while (currentDate <= lastDay) {
    const weekNumber = getWeekNumber(currentDate)
    const endDate = new Date(currentDate)
    endDate.setDate(currentDate.getDate() + 6)
    
    if (endDate > lastDay) {
      endDate.setTime(lastDay.getTime())
    }
    
    weeks.push({
      value: weekNumber,
      label: `第${weekNumber}周 (${currentDate.getMonth() + 1}/${currentDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()})`
    })
    
    currentDate.setDate(currentDate.getDate() + 7)
  }
  
  return weeks
}

// 响应式数据
const currentSchedule = ref<Schedule>({
  id: 0,
  start_date: '',
  end_date: '',
  status: 'draft',
  store_id: '0',
  year: getCurrentYear(),
  month: getCurrentMonth(),
  week_number: getCurrentWeekNumber()
})

const yearOptions = generateYearOptions()
const monthOptions = generateMonthOptions()
const weekOptions = ref(getWeekOptionsForMonth(
  currentSchedule.value.year!,
  currentSchedule.value.month!
))

// 表单验证规则
const rules = {
  year: [{ required: true, message: '请选择年份', trigger: 'change' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }],
  week_number: [{ required: true, message: '请选择周数', trigger: 'change' }],
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
}

// 监听器
watch([() => currentSchedule.value.year, () => currentSchedule.value.month], ([newYear, newMonth]) => {
  if (newYear && newMonth) {
    weekOptions.value = getWeekOptionsForMonth(newYear, newMonth)
    currentSchedule.value.week_number = weekOptions.value[0]?.value || 1
  }
})

// 业务函数
const formatStore = (row: any) => {
  const store = storeStore.stores.find(s => s.id === row.store_id)
  return store?.name || '未知门店'
}

const formatSchedulePeriod = (row: any) => {
  const startDate = new Date(row.start_date)
  const year = startDate.getFullYear()
  const weekNumber = getWeekNumber(startDate)
  return `${year}年第${weekNumber}周`
}

const openEditDialog = (schedule?: any) => {
  if (!schedule) {
    currentSchedule.value = {
      id: 0,
      start_date: '',
      end_date: '',
      status: 'draft',
      store_id: storeStore.currentStore?.id,
      year: getCurrentYear(),
      month: getCurrentMonth(),
      week_number: getCurrentWeekNumber()
    }
  } else {
    const startDate = new Date(schedule.start_date)
    currentSchedule.value = {
      ...schedule,
      year: startDate.getFullYear(),
      month: startDate.getMonth() + 1,
      week_number: getWeekNumber(startDate)
    }
  }
  weekOptions.value = getWeekOptionsForMonth(
    currentSchedule.value.year!,
    currentSchedule.value.month!
  )
  dialogVisible.value = true
}

const submitSchedule = async () => {
  try {
    await formRef.value.validate()
    
    const startDate = getDateFromWeek(currentSchedule.value.year!, currentSchedule.value.week_number!)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)

    const scheduleToSubmit = {
      ...currentSchedule.value,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    }

    if (currentSchedule.value.id) {
      await scheduleStore.updateSchedule(scheduleToSubmit)
    } else {
      await scheduleStore.createSchedule(scheduleToSubmit)
    }

    ElMessage.success('操作成功')
    dialogVisible.value = false
    await loadSchedules()
  } catch (error) {
    console.error('排班操作发生错误：', error)
    ElMessage.error('操作失败')
  }
}

const deleteSchedule = async (id: number) => {
  try {
    await scheduleStore.deleteSchedule(id)
    ElMessage.success('删除成功')
    await loadSchedules()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const manageShifts = (schedule: any) => {
  router.push({
    name: 'ShiftManagement',
    params: {
      scheduleId: schedule.id,
      storeId: schedule.store_id,
    },
  })
}

const loadSchedules = async () => {
  try {
    await scheduleStore.fetchSchedules()
    if (!Array.isArray(scheduleStore.schedules)) {
      scheduleStore.schedules = []
      ElMessage.warning('获取排班数据格式不正确')
    }
  } catch (error) {
    ElMessage.error('获取排班数据失败')
    console.error(error)
    scheduleStore.schedules = []
  }
}

onMounted(async () => {
  await Promise.all([
    loadSchedules(),
    storeStore.fetchStores(),
  ])
})
</script>

<template>
  <div class="schedule-management">
    <el-button type="primary" @click="openEditDialog()">
      新建排班
    </el-button>

    <el-table v-if="Array.isArray(scheduleStore.schedules)" :data="scheduleStore.schedules" border>
      <el-table-column prop="start_date" label="排班周期" :formatter="formatSchedulePeriod" />
      <el-table-column prop="store_id" label="门店" :formatter="formatStore" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-button size="small" type="primary" @click="manageShifts(row)">
            管理班次
          </el-button>
          <el-button size="small" type="danger" @click="deleteSchedule(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentSchedule.id ? '编辑排班' : '新建排班'">
      <el-form ref="formRef" :model="currentSchedule" :rules="rules" label-width="100px">
        <el-form-item prop="year" label="年份" required>
          <el-select v-model="currentSchedule.year" placeholder="请选择年份">
            <el-option
              v-for="year in yearOptions"
              :key="year.value"
              :label="year.label"
              :value="year.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="month" label="月份" required>
          <el-select v-model="currentSchedule.month" placeholder="请选择月份">
            <el-option
              v-for="month in monthOptions"
              :key="month.value"
              :label="month.label"
              :value="month.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="week_number" label="周数" required>
          <el-select v-model="currentSchedule.week_number" placeholder="请选择周数">
            <el-option
              v-for="week in weekOptions"
              :key="week.value"
              :label="week.label"
              :value="week.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="store_id" label="门店" required>
          <el-select v-model="currentSchedule.store_id" filterable placeholder="请选择门店">
            <el-option
              v-for="store in storeStore.stores"
              :key="store.id"
              :label="store.name"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="submitSchedule">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.schedule-management {
  padding: 20px;
}
</style>