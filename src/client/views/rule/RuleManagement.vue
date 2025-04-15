<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

// 全局设置
const loading = ref(false)
const globalSettings = ref({
  dailyMaxHours: 8,
  weeklyMaxHours: 40
})

// 保存设置
async function saveRule() {
  // 保存全局设置
  // 这里应该是调用API保存全局设置数据
  // const response = await fetch('/api/settings', {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(globalSettings.value)
  // })

  // 模拟保存成功
  setTimeout(() => {
    ElMessage.success('设置已保存')
  }, 300)
}

// 重置设置
function resetSettings() {
  globalSettings.value = {
    dailyMaxHours: 8,
    weeklyMaxHours: 40
  }
  ElMessage.success('设置已重置')
}

// 初始化
onMounted(() => {
  // 这里可以加载全局设置
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 300)
})
</script>

<template>
  <div class="rule-management">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>排班规则管理</span>
          <div>
            <el-button type="primary" @click="saveRule">保存</el-button>
            <el-button @click="resetSettings">重置</el-button>
          </div>
        </div>
      </template>

      <!-- 全局设置 -->
        <el-form label-width="150px">
          <el-form-item label="每日最大工作时长">
            <el-input-number v-model="globalSettings.dailyMaxHours" :min="1" :max="24" />
            <span class="ml-2">小时</span>
          </el-form-item>
          
          <el-form-item label="每周最大工作时长">
            <el-input-number v-model="globalSettings.weeklyMaxHours" :min="1" :max="168" />
            <span class="ml-2">小时</span>
          </el-form-item>
        </el-form>

      <!-- 规则列表部分已移除 -->
    </el-card>

    <!-- 对话框部分已移除 -->
  </div>
</template>

<style scoped>
.rule-management {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}

.global-settings {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.global-settings h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 500;
}

/* 规则列表相关样式已移除 */
</style>
