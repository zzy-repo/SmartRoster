<script setup lang="ts">
import type { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { employeeApi } from '../../api/employeeApi'

// 定义员工偏好类型
// 修改类型定义，与数据库结构保持一致
interface EmployeePreference {
  workday_pref: [number, number] 
  time_pref: [string, string] 
  max_daily_hours: number
  max_weekly_hours: number
}

// 修改API响应结构定义
interface ApiResponse<T> {
  data: T
}

const route = useRoute()
const router = useRouter()
const employeeId = ref<string>(route.params.id as string)

const weekDays = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]



const preferences = ref<EmployeePreference>({
  workday_pref: [0, 6], // 默认周一至周日
  time_pref: ['09:00', '17:00'],
  max_daily_hours: 8,
  max_weekly_hours: 40,
})

const employeeName = ref('')

onMounted(async () => {
  try {
    // 获取员工完整信息（包含偏好设置）
    const empRes = await employeeApi.getEmployeeById(employeeId.value) as unknown as AxiosResponse<ApiResponse<any>>
    const employee = empRes.data.data
    
    employeeName.value = employee.name

    // 从员工数据中提取偏好设置
    preferences.value = {
      workday_pref: [
        employee.workday_pref_start ?? 0, 
        employee.workday_pref_end ?? 6
      ],
      time_pref: [
        employee.time_pref_start || '08:00:00',
        employee.time_pref_end || '20:00:00'
      ],
      max_daily_hours: employee.max_daily_hours || 8,
      max_weekly_hours: employee.max_weekly_hours || 40,
    }
  }
  catch (error) {
    ElMessage.error('加载数据失败')
  }
})

async function handleSubmit() {
  try {
    // 获取当前员工完整信息
    const empRes = await employeeApi.getEmployeeById(employeeId.value) as unknown as AxiosResponse<ApiResponse<any>>
    const employee = empRes.data.data
    // 将前端的 preferences 对象转换为后端需要的格式
    const employeeDataToUpdate = {
      ...employee, // 保留原有员工数据
      workday_pref_start: preferences.value.workday_pref[0],
      workday_pref_end: preferences.value.workday_pref[1],
      time_pref_start: preferences.value.time_pref[0],
      time_pref_end: preferences.value.time_pref[1],
      max_daily_hours: preferences.value.max_daily_hours,
      max_weekly_hours: preferences.value.max_weekly_hours,
    }
    
    // 调用更新员工信息的API，只传递偏好设置相关的字段
    await employeeApi.updateEmployee(employeeId.value, employeeDataToUpdate)
    ElMessage.success('偏好设置已保存')
    returnPage()
  }
  catch (error) {
    console.error('保存偏好设置失败:', error) // 添加更详细的错误日志
    ElMessage.error('保存失败')
  }
}


function returnPage() {
  router.push('/employees')
}
</script>

<template>
  <div class="preferences-container">
    <h2>{{ employeeName }}的偏好设置</h2>

    <el-form :model="preferences" label-width="120px">
      <!-- 可用时间设置 -->
      <el-form-item label="工作日偏好">
        <el-select v-model="preferences.workday_pref[0]" style="width: 100%">
          <el-option
            v-for="day in weekDays"
            :key="day.value"
            :label="day.label"
            :value="day.value - 1"
          />
        </el-select>
        <el-select v-model="preferences.workday_pref[1]" style="width: 100%; margin-top: 10px">
          <el-option
            v-for="day in weekDays"
            :key="day.value"
            :label="day.label"
            :value="day.value - 1"
          />
        </el-select>
      </el-form-item>

      

      <!-- 时间区间选择 -->
      <el-form-item label="工作时间偏好">
        <el-time-select
          v-model="preferences.time_pref[0]"
          placeholder="开始时间"
          :max-time="preferences.time_pref[1]"
        />
        <el-time-select
          v-model="preferences.time_pref[1]"
          placeholder="结束时间"
          :min-time="preferences.time_pref[0]"
        />
      </el-form-item>
      <el-form-item label="每天工作时长">
        <el-input-number v-model="preferences.max_daily_hours" :min="0" :max="24" />
      </el-form-item>
      <el-form-item label="每周工作时长">
        <el-input-number v-model="preferences.max_weekly_hours" :min="0" :max="168" />
      </el-form-item>

      <el-button type="primary" @click="handleSubmit">
        保存设置
      </el-button>
      <el-button @click="returnPage">
        返回
      </el-button>
    </el-form>
  </div>
</template>

<style scoped>
.preferences-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
</style>
