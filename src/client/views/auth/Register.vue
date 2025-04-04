<script setup lang="ts">
import { register } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const resizeObserver = ref<ResizeObserver | null>(null)

onMounted(() => {
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (!entry.contentRect)
        return
    }
  })
})

onBeforeUnmount(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

const router = useRouter()

const registerForm = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

const registerFormRef = ref() // 添加表单引用

function handleInputChange() {
  if (registerFormRef.value) {
    registerFormRef.value.validate() // 触发表单验证
  }
}

function validatePassword(_rule: any, value: string, callback: any) {
  if (!value) {
    return callback(new Error('请确认密码'))
  }
  if (value !== registerForm.value.password) {
    return callback(new Error('两次输入密码不一致!'))
  }
  return callback()
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: ['blur', 'input'] },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: ['blur', 'input'] },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: ['blur', 'input'] },
    { validator: validatePassword, trigger: ['blur', 'input'] },
  ],
}

const loading = ref(false)

async function handleRegister() {
  if (!registerFormRef.value)
    return

  // Validate the form first
  await registerFormRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      ElMessage.error('请正确填写表单')
      return
    }

    loading.value = true
    try {
      await register(registerForm.value)
      ElMessage.success('注册成功')
      router.push('/login')
    }
    catch (error: any) {
      console.error('Registration error:', error)
      ElMessage.error(error?.message || '注册失败')
    }
    finally {
      loading.value = false
    }
  })
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <el-form
      ref="registerFormRef"
      :model="registerForm"
      :rules="registerRules"
      class="register-form"
      auto-complete="on"
      label-position="left"
    >
      <h3 class="title">
        SmartRoster 注册
      </h3>
      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          name="username"
          type="text"
          auto-complete="on"
          placeholder="用户名"
          @input="handleInputChange"
        />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          name="password"
          type="password"
          auto-complete="on"
          placeholder="密码"
          @keyup.enter="handleRegister"
        />
      </el-form-item>
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          name="confirmPassword"
          type="password"
          auto-complete="on"
          placeholder="确认密码"
          @keyup.enter="handleRegister"
          @input="() => registerFormRef.value?.validateField('confirmPassword')"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          :loading="loading"
          type="primary"
          style="width:100%;"
          @click.native.prevent="handleRegister"
        >
          注册
        </el-button>
      </el-form-item>
      <div class="login-link">
        已有账号？<el-link type="primary" @click="goToLogin">
          立即登录
        </el-link>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
}

.register-form {
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

.login-link {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: #666;
}
</style>
