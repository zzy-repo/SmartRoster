<script setup lang="ts">
import type { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { employeeApi } from '../../api/employeeApi'

// 定义员工偏好类型
// 修改类型定义
interface EmployeePreference {
  availableDays: string[]
  preferredShiftTypes: string[]
  startTime: string
  endTime: string
  workday_pref: [number, number] // 改回 number 类型
  time_pref: [string, string]
  max_daily_hours: number
  max_weekly_hours: number
}

// 定义API响应类型
interface EmployeeApiResponse {
  name: string
}

// 修改API响应结构定义
interface ApiResponse<T> {
  data: T
}

const route = useRoute()
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

const shiftTypes = [
  { label: '早班', value: 'morning' },
  { label: '中班', value: 'midday' },
  { label: '晚班', value: 'night' },
  { label: '通宵班', value: 'overnight' },
]

const preferences = ref<EmployeePreference>({
  availableDays: [],
  preferredShiftTypes: [],
  startTime: '09:00',
  endTime: '18:00',
  workday_pref: [9, 17], // 使用数字
  time_pref: ['09:00', '17:00'],
  max_daily_hours: 8,
  max_weekly_hours: 40,
})

const employeeName = ref('')

onMounted(async () => {
  try {
    // 获取员工基本信息
    const empRes = await employeeApi.getEmployeeById(employeeId.value) as unknown as AxiosResponse<ApiResponse<EmployeeApiResponse>>
    employeeName.value = empRes.data.data.name

    // 获取现有偏好设置
    const prefRes = await employeeApi.getEmployeePreferences(employeeId.value) as unknown as AxiosResponse<ApiResponse<EmployeePreference>>

    // 创建一个完整的偏好设置对象
    preferences.value = {
      availableDays: prefRes.data.data.availableDays || [],
      preferredShiftTypes: prefRes.data.data.preferredShiftTypes || [],
      startTime: prefRes.data.data.startTime || '09:00',
      endTime: prefRes.data.data.endTime || '18:00',
      workday_pref: prefRes.data.data.workday_pref || [9, 17], // 使用数字类型的默认值
      time_pref: prefRes.data.data.time_pref || ['09:00', '17:00'],
      max_daily_hours: prefRes.data.data.max_daily_hours || 8,
      max_weekly_hours: prefRes.data.data.max_weekly_hours || 40,
    }
  }
  catch (error) {
    ElMessage.error('加载数据失败')
  }
})

async function handleSubmit() {
  try {
    await employeeApi.updateEmployeePreferences(employeeId.value, preferences.value)
    ElMessage.success('偏好设置已保存')
  }
  catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<template>
  <div class="preferences-container">
    <h2>{{ employeeName }}的偏好设置</h2>

    <el-form :model="preferences" label-width="120px">
      <!-- 可用时间设置 -->
      <el-form-item label="工作日偏好">
        <el-select v-model="preferences.workday_pref" style="width: 100%" multiple :multiple-limit="7">
          <el-option
            v-for="day in weekDays"
            :key="day.value"
            :label="day.label"
            :value="day.value"
          />
        </el-select>
      </el-form-item>

      <!-- 班次类型偏好 -->
      <el-form-item label="偏好班次类型">
        <el-select v-model="preferences.preferredShiftTypes" multiple>
          <el-option
            v-for="shift in shiftTypes"
            :key="shift.value"
            :label="shift.label"
            :value="shift.value"
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
