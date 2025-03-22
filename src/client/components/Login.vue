<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <el-form 
      class="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm"
      @submit.prevent="login"
    >
      <h1 class="text-2xl font-bold text-center mb-6 text-gray-800">系统登录</h1>
      
      <el-form-item class="mb-5">
        <el-input
          v-model="username"
          placeholder="用户名"
          class="[&>input]:pl-9"
          clearable
        >
          <template #prefix>
            <i class="i-ic-round-account-circle text-gray-400 text-lg" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item class="mb-6">
        <el-input
          v-model="password"
          type="password"
          placeholder="密码"
          show-password
          class="[&>input]:pl-9"
          clearable
        >
          <template #prefix>
            <i class="i-ic-round-lock text-gray-400 text-lg" />
          </template>
        </el-input>
      </el-form-item>

      <el-button 
        native-type="submit"
        type="primary" 
        class="w-full !text-base h-10"
      >
        立即登录
      </el-button>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const username = ref('');
const password = ref('');

const login = () => {
  // 这里可以添加登录逻辑，暂时不需要连接后端
  console.log('登录成功:', username.value, password.value);
};
</script>