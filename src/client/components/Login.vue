<template>
  <div class="flex justify-center items-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-96">
      <h1 class="text-2xl font-bold text-center mb-6">
        登录
      </h1>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" @keyup.enter="login" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="login"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="login">
            登录
          </el-button>
        </el-form-item>
        <div class="text-center mt-4">
          <router-link to="/register" class="text-blue-500 hover:text-blue-700">
            没有账号？立即注册
          </router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElForm, ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const form = ref({
  username: '',
  password: '',
})

const formRef = ref<InstanceType<typeof ElForm>>()
const router = useRouter()
const userStore = useUserStore()

const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
})

async function login() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      const success = await userStore.login(form.value.username, form.value.password)
      if (success) {
        ElMessage.success('登录成功！')
        router.push('/')
      }
      else {
        ElMessage.error('登录失败，请检查用户名和密码')
      }
    }
  })
}
</script>
