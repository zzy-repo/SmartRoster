<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { getRuleSettings, updateRuleSettings } from '../../api/ruleApi'

// 全局设置
const loading = ref(false)
const globalSettings = ref({
  // 基本工时限制
  max_daily_hours: 8,
  max_weekly_hours: 40,
  // 模拟退火算法参数
  initial_temp: 100.0,
  min_temp: 0.1,
  cooling_rate: 0.95,
  iter_per_temp: 100,
  iterations: 50,
  // 成本参数
  understaff_penalty: 100,
  workday_violation: 10,
  time_pref_violation: 5,
  daily_hours_violation: 20,
  weekly_hours_violation: 50
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
    initial_temp: 100.0,
    min_temp: 0.1,
    cooling_rate: 0.95,
    iter_per_temp: 100,
    iterations: 50,
    understaff_penalty: 100,
    workday_violation: 10,
    time_pref_violation: 5,
    daily_hours_violation: 20,
    weekly_hours_violation: 50
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
          <span class="main-title">排班规则管理</span>
          <div>
            <el-button type="primary" @click="saveRule">保存</el-button>
            <el-button @click="resetSettings">重置</el-button>
          </div>
        </div>
      </template>

      <!-- 核心工时限制 -->
      <div class="section-title">核心工时限制</div>
      <el-form label-width="140px" class="section-form">
        <el-row :gutter="32">
          <el-col :span="8">
            <el-form-item label="每日最大工作时长">
              <el-input-number v-model="globalSettings.max_daily_hours" :min="1" :max="24" />
              <span class="ml-2">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每周最大工作时长">
              <el-input-number v-model="globalSettings.max_weekly_hours" :min="1" :max="168" />
              <span class="ml-2">小时</span>
            </el-form-item>
          </el-col>
          <el-col :span="8"></el-col>
        </el-row>
      </el-form>

      <!-- 模拟退火算法参数 -->
      <div class="section-title">模拟退火算法参数</div>
      <el-form label-width="140px" class="section-form">
        <el-row :gutter="32">
          <el-col :span="8">
            <el-form-item label="初始温度">
              <el-input-number v-model="globalSettings.initial_temp" :min="0.1" :max="1000" :step="0.1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="最小温度">
              <el-input-number v-model="globalSettings.min_temp" :min="0.01" :max="1" :step="0.01" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="冷却率">
              <el-input-number v-model="globalSettings.cooling_rate" :min="0.1" :max="0.99" :step="0.01" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每温度迭代次数">
              <el-input-number v-model="globalSettings.iter_per_temp" :min="10" :max="1000" :step="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="总迭代次数">
              <el-input-number v-model="globalSettings.iterations" :min="10" :max="1000" :step="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8"></el-col>
        </el-row>
      </el-form>

      <!-- 成本参数 -->
      <div class="section-title">成本参数</div>
      <el-form label-width="140px" class="section-form">
        <el-row :gutter="32">
          <el-col :span="8">
            <el-form-item label="人员不足惩罚">
              <el-input-number v-model="globalSettings.understaff_penalty" :min="1" :max="1000" :step="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作日违反惩罚">
              <el-input-number v-model="globalSettings.workday_violation" :min="1" :max="1000" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时间偏好违反惩罚">
              <el-input-number v-model="globalSettings.time_pref_violation" :min="1" :max="1000" :step="1" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每日工时违反惩罚">
              <el-input-number v-model="globalSettings.daily_hours_violation" :min="1" :max="1000" :step="5" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="每周工时违反惩罚">
              <el-input-number v-model="globalSettings.weekly_hours_violation" :min="1" :max="1000" :step="5" />
            </el-form-item>
          </el-col>
          <el-col :span="8"></el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.rule-management {
  width: 100%;
  padding: 24px 0;
  background: #f7f9fa;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.main-title {
  font-size: 22px;
  font-weight: bold;
  color: #3578e5;
}
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #3578e5;
  border-left: 4px solid #3578e5;
  padding-left: 12px;
  margin: 32px 0 18px 0;
  letter-spacing: 1px;
}
.section-form {
  margin-bottom: 12px;
}
.ml-2 {
  margin-left: 8px;
}
.el-form-item {
  margin-bottom: 18px;
}
</style>
