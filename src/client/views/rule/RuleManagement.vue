<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { getRuleSettings, updateRuleSettings } from '../../api/ruleApi'

// 全局设置
const loading = ref(false)
const globalSettings = ref({
  max_daily_hours: 8,
  max_weekly_hours: 40,
})

// 保存设置
async function saveRule() {
  try {
    loading.value = true
    await updateRuleSettings(globalSettings.value)
    ElMessage.success('设置已保存')
  }
  catch (error) {
    ElMessage.error('保存失败')
  }
  finally {
    loading.value = false
  }
}

// 重置设置
function resetSettings() {
  globalSettings.value = {
    max_daily_hours: 8,
    max_weekly_hours: 40,
  }
  ElMessage.success('设置已重置')
}

// 初始化
onMounted(async () => {
  try {
    loading.value = true
    const settings = await getRuleSettings()
    if (settings) {
      globalSettings.value = settings
    }
  }
  catch (error) {
    ElMessage.error('加载设置失败')
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="rule-management">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>排班规则管理</span>
          <div>
            <el-button type="primary" @click="saveRule">
              保存
            </el-button>
            <el-button @click="resetSettings">
              重置
            </el-button>
          </div>
        </div>
      </template>

      <!-- 全局设置 -->
      <el-form label-width="150px">
        <el-form-item label="每日最大工作时长">
          <el-input-number v-model="globalSettings.max_daily_hours" :min="1" :max="24" />
          <span class="ml-2">小时</span>
        </el-form-item>

        <el-form-item label="每周最大工作时长">
          <el-input-number v-model="globalSettings.max_weekly_hours" :min="1" :max="168" />
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
