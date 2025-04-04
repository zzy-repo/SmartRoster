<template>
  <div class="login-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <h3 class="title">SmartRoster 登录</h3>
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          name="username"
          type="text"
          auto-complete="on"
          placeholder="用户名"
          @input="handleInputChange"
        />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          name="password"
          type="password"
          auto-complete="on"
          placeholder="密码"
          @keyup.enter="handleLogin"
          @input="handleInputChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          :loading="loading"
          type="primary"
          style="width:100%;"
          @click.native.prevent="handleLogin"
        >
          登录
        </el-button>
      </el-form-item>
      <div class="register-link">
        没有账号？<el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth.ts'
import { useAuthStore } from '@/stores/authStore'

const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (!entry.contentRect) return
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

const router = useRouter()

const loginForm = ref({
  username: '',
  password: ''
})

const loginFormRef = ref() // 添加表单引用

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'input'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] }
  ]
}

function handleInputChange() {
  if (loginFormRef.value) {
    loginFormRef.value.validate()
  }
}

const loading = ref(false)

function goToRegister() {
  router.push('/register')
}

async function handleLogin() {
  loading.value = true
  try {
    const response = await login(loginForm.value)
    console.log('登录响应:', response)
    if (!response?.token) {
      throw new Error('登录响应格式错误')
    }
    
    // 使用 auth store 保存用户信息
    const authStore = useAuthStore()
    authStore.setUser(response.token, response.user)
    
    // 直接跳转到主页
    router.push('/')
    ElMessage.success('登录成功')
  } catch (error: any) {
    console.error('登录失败:', error)
    ElMessage.error(error?.response?.data?.error || error?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.login-form {
  width: 350px;
  padding: 30px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0 auto 30px;
  color: #333;
  text-align: center;
}

.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}
</style>