<script setup lang="ts">
import { useScheduleStore } from '@/stores/scheduleStore'
import { useStoreStore } from '@/stores/storeStore'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const storeStore = useStoreStore()
const scheduleStore = useScheduleStore()
const dialogVisible = ref(false)
function formatStore(row: any) {
  const store = storeStore.stores.find(s => s.id === row.store_id)
  return store?.name || '未知门店'
}

function formatDate(row: any, column: any, value: string) {
  return value ? value.split('T')[0] : ''
}

interface Schedule {
  id: number
  start_date: string
  end_date: string
  status: string
  store_id?: string
}

const formRef = ref()
const rules = {
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'blur' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'blur' }],
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
}

const currentSchedule = ref<Schedule>({ id: 0, start_date: '', end_date: '', status: 'draft', store_id: '0' })

async function loadSchedules() {
  try {
    await scheduleStore.fetchSchedules()
    // 确保数据是数组
    if (!Array.isArray(scheduleStore.schedules)) {
      scheduleStore.schedules = []
      ElMessage.warning('获取排班数据格式不正确')
    }
  }
  catch (error) {
    ElMessage.error('获取排班数据失败')
    console.log(scheduleStore.schedules)
    scheduleStore.schedules = []
  }
}

// 新增：计算最近周一的日期
function getNearestMonday(date = new Date()) {
  const day = date.getDay();
  const diff = day >= 1 ? date.getDate() - (day - 1) : date.getDate() - 6;
  return new Date(date.setDate(diff));
}

// 修改后的 openEditDialog 函数
function openEditDialog(schedule?: any) {
  if (!schedule) {
    const monday = getNearestMonday();
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    currentSchedule.value = {
      id: 0,
      start_date: monday.toISOString().split('T')[0],
      end_date: sunday.toISOString().split('T')[0],
      status: 'draft',
      store_id: storeStore.currentStore?.id,
    }
  }
  else {
    currentSchedule.value = { ...schedule }
  }
  dialogVisible.value = true
}

async function submitSchedule() {
  try {
    await formRef.value.validate()
    // 转换日期格式为YYYY-MM-DD
    const scheduleToSubmit = {
      ...currentSchedule.value,
      start_date: currentSchedule.value.start_date,
      end_date: currentSchedule.value.end_date,
    }

    console.log('正在提交排班数据：', scheduleToSubmit)

    if (currentSchedule.value.id) {
      await scheduleStore.updateSchedule(scheduleToSubmit)
    }
    else {
      await scheduleStore.createSchedule(scheduleToSubmit)
    }

    console.log('排班操作成功，更新后的数据：', scheduleToSubmit)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    await loadSchedules()
  }
  catch (error) {
    console.error('排班操作发生错误：', error)
    ElMessage.error('操作失败')
  }
}

async function deleteSchedule(id: number) {
  try {
    await scheduleStore.deleteSchedule(id)
    ElMessage.success('删除成功')
    await loadSchedules()
  }
  catch (error) {
    ElMessage.error('删除失败')
  }
}

function manageShifts(schedule: any) {
  router.push({
    name: 'ShiftManagement',
    params: {
      scheduleId: schedule.id,
      storeId: schedule.store_id,
    },
  })
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
      <el-table-column prop="start_date" label="开始日期" :formatter="formatDate" />
      <el-table-column prop="end_date" label="结束日期" :formatter="formatDate" />
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
        <el-form-item prop="start_date" label="开始日期" required>
          <el-date-picker v-model="currentSchedule.start_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item prop="end_date" label="结束日期" required>
          <el-date-picker v-model="currentSchedule.end_date" type="date" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item prop="store_id" label="门店" required>
          <el-select v-model="currentSchedule.store_id" filterable>
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

// 更新验证规则
const rules = {
  start_date: [
    { required: true, message: '请选择开始日期', trigger: 'blur' },
    {
      validator: (_, value) => {
        const day = new Date(value).getDay();
        if (day !== 1) return Promise.reject('开始日期必须为周一');
        return Promise.resolve();
      },
      trigger: 'change'
    }
  ],
  end_date: [
    { required: true, message: '请选择结束日期', trigger: 'blur' },
    {
      validator: (_, value, { start_date }) => {
        const startDate = new Date(start_date);
        const endDate = new Date(value);
        endDate.setHours(0, 0, 0, 0);
        
        const expectedEnd = new Date(startDate);
        expectedEnd.setDate(startDate.getDate() + 6);
        
        if (endDate.getTime() !== expectedEnd.getTime()) {
          return Promise.reject('排班周期必须为完整周（7天）');
        }
        return Promise.resolve();
      },
      trigger: 'change'
    }
  ],
  store_id: [{ required: true, message: '请选择门店', trigger: 'change' }],
}
