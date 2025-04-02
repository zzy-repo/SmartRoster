<template>
  <div class="register-container">
    <h2>用户注册</h2>
    <el-form :model="form" :rules="rules" ref="registerForm" label-width="100px" @keyup.enter="submitForm">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      
      <el-form-item label="密码" prop="password">
        <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
      </el-form-item>
      
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码"></el-input>
      </el-form-item>
      
      <el-form-item label="角色" prop="role">
        <el-radio-group v-model="form.role">
          <el-radio label="employee">员工</el-radio>
          <el-radio label="scheduler">排班管理员</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="loading">注册</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
    
    <div class="login-link">
      已有账号？<router-link to="/login">立即登录</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const registerForm = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'employee' // 默认选择员工角色
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else {
    if (form.confirmPassword !== '') {
      registerForm.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const submitForm = async () => {
  if (!registerForm.value) return
  
  await registerForm.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const success = await userStore.register(form.username, form.password, form.role)
        if (success) {
          ElMessage.success('注册成功')
          router.push('/login')
        }
      } catch (error) {
        ElMessage.error(error.message || '注册失败')
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  registerForm.value.resetFields()
}
</script>

<style scoped>
.register-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.login-link {
  margin-top: 20px;
  text-align: center;
}
</style>