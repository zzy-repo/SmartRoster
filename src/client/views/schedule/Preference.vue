<template>
  <div class="p-4">
    <h2 class="text-2xl font-bold mb-6">意向申报</h2>
    
    <el-form 
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="max-w-2xl"
    >
      <!-- 基本信息 -->
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" />
      </el-form-item>

      <el-form-item label="职位" prop="position">
        <el-select v-model="form.position" placeholder="请选择职位">
          <el-option label="店长" value="店长" />
          <el-option label="店员" value="店员" />
          <el-option label="收银员" value="收银员" />
        </el-select>
      </el-form-item>

      <el-form-item label="联系电话" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入联系电话" />
      </el-form-item>

      <el-form-item label="电子邮箱" prop="email">
        <el-input v-model="form.email" placeholder="请输入电子邮箱" />
      </el-form-item>

      <el-form-item label="所属门店" prop="store">
        <el-input v-model="form.store" placeholder="请输入门店编码" />
      </el-form-item>

      <!-- 工作偏好设置 -->
      <el-form-item label="工作日偏好" prop="workday_pref">
        <el-select
          v-model="form.workday_pref"
          multiple
          placeholder="请选择可工作的日期"
        >
          <el-option
            v-for="(day, index) in weekDays"
            :key="index"
            :label="day"
            :value="index"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="时间段偏好" prop="time_pref">
        <el-time-picker
          v-model="form.time_pref"
          is-range
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          format="HH:mm"
        />
      </el-form-item>

      <el-form-item label="最大日工时" prop="max_daily_hours">
        <el-input-number 
          v-model="form.max_daily_hours"
          :min="0"
          :max="24"
          placeholder="请输入最大日工作时长"
        />
      </el-form-item>

      <el-form-item label="最大周工时" prop="max_weekly_hours">
        <el-input-number
          v-model="form.max_weekly_hours"
          :min="0"
          :max="168"
          placeholder="请输入最大周工作时长"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const formRef = ref(null)

const form = reactive({
  name: '',
  position: '',
  phone: '',
  email: '',
  store: '',
  workday_pref: [],
  time_pref: [],
  max_daily_hours: 8,
  max_weekly_hours: 40
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  position: [{ required: true, message: '请选择职位', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  store: [{ required: true, message: '请输入门店编码', trigger: 'blur' }],
  workday_pref: [{ required: true, message: '请选择工作日偏好', trigger: 'change' }],
  time_pref: [{ required: true, message: '请选择时间段偏好', trigger: 'change' }],
  max_daily_hours: [{ required: true, message: '请输入最大日工作时长', trigger: 'blur' }],
  max_weekly_hours: [{ required: true, message: '请输入最大周工作时长', trigger: 'blur' }]
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid, fields) => {
    if (valid) {
      // TODO: 这里添加提交到后端的逻辑
      ElMessage.success('提交成功')
      console.log('submit form:', form)
    } else {
      console.error('表单验证失败:', fields)
    }
  })
}

// 重置表单
const resetForm = () => {
  if (!formRef.value) return
  formRef.value.resetFields()
}
</script>