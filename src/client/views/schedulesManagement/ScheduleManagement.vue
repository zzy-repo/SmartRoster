<script setup lang="ts">
import { useScheduleStore } from '@/stores/scheduleStore'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const scheduleStore = useScheduleStore()
const dialogVisible = ref(false)
const currentSchedule = ref({ id: 0, start_date: '', end_date: '', status: 'draft', store_id: 0 })

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

function openEditDialog(schedule?: any) {
  currentSchedule.value = schedule ? { ...schedule } : { id: 0, start_date: '', end_date: '', status: 'draft', store_id: 0 }
  dialogVisible.value = true
}

async function submitSchedule() {
  try {
    if (currentSchedule.value.id) {
      await scheduleStore.updateSchedule(currentSchedule.value)
    }
    else {
      await scheduleStore.createSchedule(currentSchedule.value)
    }
    ElMessage.success('操作成功')
    dialogVisible.value = false
    await loadSchedules()
  }
  catch (error) {
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

onMounted(async () => {
  await loadSchedules()
})
</script>

<template>
  <div class="schedule-management">
    <el-button type="primary" @click="openEditDialog()">
      新建排班
    </el-button>

    <el-table :data="scheduleStore.schedules" border>
      <el-table-column prop="start_date" label="开始日期" />
      <el-table-column prop="end_date" label="结束日期" />
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
          <el-button size="small" type="danger" @click="deleteSchedule(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentSchedule.id ? '编辑排班' : '新建排班'">
      <el-form label-width="100px">
        <el-form-item label="开始日期">
          <el-date-picker v-model="currentSchedule.start_date" type="date" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="currentSchedule.end_date" type="date" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="currentSchedule.status">
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
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
