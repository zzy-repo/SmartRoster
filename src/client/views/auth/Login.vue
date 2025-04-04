<template>
  <!-- 登录页面容器 -->
  <div class="login-container">
    <!-- 登录表单，使用Element Plus的表单组件 -->
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      auto-complete="on"
      label-position="left"
    >
      <h3 class="title">SmartRoster 登录</h3>
      <!-- 用户名输入框 -->
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
      <!-- 密码输入框 -->
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
      <!-- 登录按钮 -->
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
      <!-- 注册链接 -->
      <div class="register-link">
        没有账号？<el-link type="primary" @click="goToRegister">立即注册</el-link>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
// 导入Vue相关依赖
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
// 导入Element Plus消息提示组件
import { ElMessage } from 'element-plus'
// 导入API和状态管理
import { login } from '@/api/auth.ts'
import { useAuthStore } from '@/stores/authStore'

// 响应式观察器，用于监听元素尺寸变化
const resizeObserver = ref<ResizeObserver | null>(null)

// 组件挂载时初始化观察器
onMounted(() => {
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (!entry.contentRect) return
    }
  })
})

// 组件卸载前清理观察器
onBeforeUnmount(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

// 获取路由实例
const router = useRouter()

// 登录表单数据
const loginForm = ref({
  username: '',
  password: ''
})

// 表单引用，用于调用表单验证方法
const loginFormRef = ref()

// 表单验证规则
const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'input'] }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] }
  ]
}

// 输入框变化时触发表单验证
function handleInputChange() {
  if (loginFormRef.value) {
    loginFormRef.value.validate()
  }
}

// 登录按钮加载状态
const loading = ref(false)

// 跳转到注册页面
function goToRegister() {
  router.push('/register')
}

// 处理登录逻辑
async function handleLogin() {
  loading.value = true
  try {
    // 调用登录API
    const response = await login(loginForm.value)
    console.log('登录响应:', response)
    if (!response?.token) {
      throw new Error('登录响应格式错误')
    }
    
    // 使用auth store保存用户信息
    const authStore = useAuthStore()
    authStore.setUser(response.token, response.user)
    console.log('用户信息已保存:', authStore.user)
    
    // 登录成功后跳转到首页
    router.push('/')
    ElMessage.success('登录成功')
  } catch (error: any) {
    console.error('登录失败:', error)
    // 显示错误信息
    ElMessage.error(error?.response?.data?.error || error?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<!-- 页面样式 -->
<style scoped>
/* 登录容器样式 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

/* 登录表单样式 */
.login-form {
  width: 350px;
  padding: 30px;
  background: #fff;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 标题样式 */
.title {
  margin: 0 auto 30px;
  color: #333;
  text-align: center;
}

/* 注册链接样式 */
.register-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}
</style>