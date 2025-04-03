<script lang="ts" setup>
import { ElForm, ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 修改导入路径，因为当前文件在 auth 子目录中
import { useUserStore } from '../../stores/user'

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
  if (!formRef.value)
    return

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

<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="auth-title">
        登录
      </h1>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
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
          <el-button type="primary" class="full-width-btn" @click="login">
            登录
          </el-button>
        </el-form-item>
        <div class="auth-link">
          <router-link to="/register">
            没有账号？立即注册
          </router-link>
        </div>
      </ElForm>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}

.auth-card {
  width: 500px;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  background-color: white;
}

.auth-title {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 30px;
  color: #409EFF;
}

.full-width-btn {
  width: 100%;
}

.auth-link {
  margin-top: 20px;
  text-align: center;
}

.auth-link a {
  color: #409EFF;
  text-decoration: none;
}

.auth-link a:hover {
  color: #66b1ff;
}
</style>
