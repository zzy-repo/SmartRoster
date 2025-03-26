<script lang="ts" setup>
import { ElForm, ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const form = ref({
  username: '',
  password: '',
  confirmPassword: '',
})

const formRef = ref<InstanceType<typeof ElForm>>()
const router = useRouter()
const userStore = useUserStore()

const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度应在 3 到 20 个字符之间', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于 6 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== form.value.password)
          callback(new Error('两次输入的密码不一致'))
        else
          callback()
      },
      trigger: 'blur',
    },
  ],
})

async function register() {
  if (!formRef.value)
    return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const success = await userStore.register(
          form.value.username,
          form.value.password,
        )

        if (success) {
          ElMessage.success('注册成功！')
          router.push('/login')
        }
        else {
          ElMessage.error('注册失败：用户名可能已存在')
        }
      }
      catch (error) {
        console.error('注册错误:', error)
        ElMessage.error(`注册失败：${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
  })
}
</script>

<template>
  <div class="flex justify-center items-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-96">
      <h1 class="text-2xl font-bold text-center mb-6">
        注册
      </h1>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" @keyup.enter="register" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            @keyup.enter="register"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请确认密码"
            show-password
            @keyup.enter="register"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="register">
            注册
          </el-button>
        </el-form-item>
        <div class="text-center mt-4">
          <router-link to="/login" class="text-blue-500 hover:text-blue-700">
            已有账号？立即登录
          </router-link>
        </div>
      </ElForm>
    </div>
  </div>
</template>
