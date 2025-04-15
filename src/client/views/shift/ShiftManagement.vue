<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'
import type { Shift } from '@/api/shiftApi'
import { createShift, deleteShift, fetchShifts, updateShift } from '@/api/shiftApi'

const shifts = ref<Shift[]>([])
const dialogVisible = ref(false)
const currentShift = ref<Partial<Shift>>({})
const isEditMode = ref(false)

// 初始化加载数据
onMounted(async () => {
  try {
    // TODO: 需要从store获取当前门店ID
    shifts.value = await fetchShifts(1)
  } catch (error) {
    ElMessage.error('获取班次数据失败')
  }
})

// 处理表单提交
const handleSubmit = async () => {
  try {
    if (isEditMode.value && currentShift.value.id) {
      await updateShift(currentShift.value.id, currentShift.value)
      ElMessage.success('更新成功')
    } else {
      await createShift(currentShift.value as Omit<Shift, 'id'>)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    shifts.value = await fetchShifts(1)
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 删除确认
const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm('确认删除该班次？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteShift(id)
    shifts.value = shifts.value.filter(shift => shift.id !== id)
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.info('取消删除')
  }
}

// 打开编辑对话框
const openEditDialog = (shift: Shift) => {
  currentShift.value = { ...shift }
  isEditMode.value = true
  dialogVisible.value = true
}

// 打开新建对话框
const openCreateDialog = () => {
  currentShift.value = { day: 0, startTime: '09:00', endTime: '17:00', status: 'open', storeId: 1 }
  isEditMode.value = false
  dialogVisible.value = true
}
</script>

<template>
  <div class="shift-management">
    <el-button type="primary" @click="openCreateDialog">
      新建班次
    </el-button>

    <el-table :data="shifts" style="width: 100%; margin-top: 20px">
      <el-table-column prop="day" label="星期" width="120">
        <template #default="{ row }">
          {{ ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][row.day] }}
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" />
      <el-table-column prop="endTime" label="结束时间" />
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'open' ? 'success' : 'danger'">
            {{ row.status === 'open' ? '开放' : '关闭' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">
            编辑
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑班次' : '新建班次'"
      width="30%"
    >
      <el-form label-width="80px">
        <el-form-item label="星期">
          <el-select v-model="currentShift.day" placeholder="请选择">
            <el-option
              v-for="item in 7"
              :key="item - 1"
              :label="['周一', '周二', '周三', '周四', '周五', '周六', '周日'][item - 1]"
              :value="item - 1"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker
            v-model="currentShift.startTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
          />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker
            v-model="currentShift.endTime"
            format="HH:mm"
            value-format="HH:mm"
            placeholder="选择时间"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch
            v-model="currentShift.status"
            active-value="open"
            inactive-value="closed"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.shift-management {
  padding: 20px;
}
</style>