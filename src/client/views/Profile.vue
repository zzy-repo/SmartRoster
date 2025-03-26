<script setup lang="ts">
import { ref } from 'vue';

const userInfo = ref({
  name: '张三',
  department: '内科',
  position: '主治医师',
  email: 'zhangsan@example.com',
  phone: '13800138000'
});
</script>

<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h2>个人信息</h2>
        </div>
      </template>
      
      <el-form label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="userInfo.name" disabled />
        </el-form-item>
        <el-form-item label="科室">
          <el-input v-model="userInfo.department" disabled />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="userInfo.position" disabled />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userInfo.email" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="userInfo.phone" />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>