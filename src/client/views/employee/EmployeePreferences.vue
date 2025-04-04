<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'

// 定义员工偏好类型
interface EmployeePreference {
  availableDays: string[]
  preferredShiftTypes: string[]
  startTime: string
  endTime: string
  workday_pref: [string, string]
  time_pref: [string, string]
  max_daily_hours: number
  max_weekly_hours: number
}

const loading = ref(true)

// 表单数据
const form = reactive<EmployeePreference>({
  availableDays: [] as string[],
  preferredShiftTypes: [] as string[],
  startTime: '09:00',
  endTime: '18:00',
  workday_pref: ['09:00', '18:00'],
  time_pref: ['09:00', '18:00'],
  max_daily_hours: 8,
  max_weekly_hours: 40
})

// 加载员工数据
onMounted(async () => {
  try {
    // 模拟API调用
    setTimeout(() => {
      Object.assign(form, {
        availableDays: ['周一', '周三', '周五'],
        preferredShiftTypes: ['早班'],
        startTime: '08:00',
        endTime: '17:00',
        workday_pref: ['08:00', '17:00'],
        time_pref: ['08:00', '17:00'],
        max_daily_hours: 8,
        max_weekly_hours: 40
      } as EmployeePreference)
      loading.value = false
    }, 1000)
  }
  catch (error) {
    ElMessage.error('加载数据失败')
    loading.value = false
  }
})

// 提交表单
async function submitForm() {
  try {
    // 这里应该调用API保存偏好设置
    ElMessage.success('偏好设置已保存')
  }
  catch (error) {
    ElMessage.error('保存失败')
  }
}
</script>

<template>
  <div class="preference-container">
    <h2>员工偏好设置</h2>
    <el-form v-loading="loading" label-width="120px">
      <el-form-item label="可工作日期">
        <el-checkbox-group v-model="form.availableDays">
          <el-checkbox label="周一" />
          <el-checkbox label="周二" />
          <el-checkbox label="周三" />
          <el-checkbox label="周四" />
          <el-checkbox label="周五" />
          <el-checkbox label="周六" />
          <el-checkbox label="周日" />
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="偏好班次类型">
        <el-checkbox-group v-model="form.preferredShiftTypes">
          <el-checkbox label="早班 (08:00-17:00)" />
          <el-checkbox label="晚班 (13:00-22:00)" />
          <el-checkbox label="全天班 (09:00-21:00)" />
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="最早到岗时间">
        <el-time-picker
          v-model="form.startTime"
          format="HH:mm"
          value-format="HH:mm"
          type="time"
        />
      </el-form-item>

      <el-form-item label="最晚离岗时间">
        <el-time-picker
          v-model="form.endTime"
          format="HH:mm"
          value-format="HH:mm"
          type="time"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">
          保存设置
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.preference-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.el-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>