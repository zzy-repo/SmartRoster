<script lang="ts" setup>
import { ElForm } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router' // 引入 useRouter

const form = ref({
  username: '',
  password: '',
})
const formRef = ref<InstanceType<typeof ElForm>>()
const router = useRouter() // 获取路由实例

const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
})

function login() {
  formRef.value?.validate((valid) => {
    if (valid) {
      // 这里可以添加登录逻辑，暂时不需要连接后端
      console.log('登录成功:', form.value.username, form.value.password)
      router.push('/') // 登录成功后跳转到根路径（Layout 页面）
    }
    else {
      console.log('表单验证失败')
      // 删除返回语句，因为 validate 回调不需要返回值
    }
  })
}
</script>

<template>
  <div class="flex justify-center items-center h-screen bg-gray-100">
    <div class="bg-white p-8 rounded shadow-md w-96">
      <h1 class="text-2xl font-bold text-center mb-6">
        登录
      </h1>
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <!-- 监听 keyup 事件，当按下回车键时调用 login 方法 -->
          <el-input v-model="form.username" placeholder="请输入用户名" @keyup.enter="login" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <!-- 监听 keyup 事件，当按下回车键时调用 login 方法 -->
          <el-input v-model="form.password" placeholder="请输入密码" type="password" @keyup.enter="login" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="login">
            登录
          </el-button>
        </el-form-item>
      </ElForm>
    </div>
  </div>
</template>
