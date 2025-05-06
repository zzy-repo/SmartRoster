<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../stores/employeeStore'
import { useStoreStore } from '../stores/storeStore'

const router = useRouter()
const storeStore = useStoreStore()
const employeeStore = useEmployeeStore()

const loading = ref(false)

// 加载数据
async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      storeStore.fetchStores(),
      employeeStore.fetchEmployees(),
    ])
  }
  catch (error) {
    console.error('加载数据失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 跳转到排班表页面
function goToRoster() {
  router.push('/scheduleManagement')
}

// 跳转到员工管理页面
function goToEmployees() {
  router.push('/employees')
}

// 跳转到门店管理页面
function goToStores() {
  router.push('/stores')
}

// 跳转到排班规则页面
function goToRules() {
  router.push('/rules')
}

// 跳转到业务预测页面
function goToForecast() {
  router.push('/forecast')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div v-loading="loading" class="home-container">
    <el-row :gutter="20">
      <el-col :span="24">
        <div class="welcome-section">
          <h1>欢迎使用智能排班系统</h1>
          <p>基于员工偏好和业务需求，自动生成最优排班方案</p>
          <el-button type="primary" size="large" @click="goToRoster">
            开始排班
          </el-button>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-section">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>门店数量</span>
            </div>
          </template>
          <div class="stat-value">
            {{ storeStore.storeCount }}
          </div>
          <el-button text @click="goToStores">
            管理门店
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>员工数量</span>
            </div>
          </template>
          <div class="stat-value">
            {{ employeeStore.employeeCount }}
          </div>
          <el-button text @click="goToEmployees">
            管理员工
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>排班功能</span>
            </div>
          </template>
          <div class="feature-list">
            <el-button text @click="goToRules">
              排班规则
            </el-button>
            <el-button text @click="goToRoster">
              排班表
            </el-button>
            <el-button text @click="goToForecast">
              业务预测
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="features-section">
      <el-col :span="24">
        <h2>系统功能</h2>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="feature-card">
          <h3>智能排班</h3>
          <p>根据员工偏好、技能匹配度和业务需求，自动生成最优排班方案</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="feature-card">
          <h3>多维度视图</h3>
          <p>支持按日、按周查看排班表，可按技能、岗位和员工分组查看</p>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="12" :md="8">
        <el-card shadow="hover" class="feature-card">
          <h3>灵活调整</h3>
          <p>支持手动调整排班，重新分配班次，满足特殊业务需求</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.home-container {
  padding: 20px;
}

.welcome-section {
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 30px;
  background-color: #ecf5ff;
  border-radius: 8px;
}

.welcome-section h1 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #303133;
}

.welcome-section p {
  font-size: 16px;
  color: #606266;
  margin-bottom: 24px;
}

.stats-section {
  margin-bottom: 30px;
}

.stat-card {
  height: 100%;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  color: #409EFF;
  text-align: center;
  padding: 20px 0;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}

.features-section h2 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #303133;
}

.feature-card {
  height: 100%;
  margin-bottom: 20px;
}

.feature-card h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #303133;
}

.feature-card p {
  color: #606266;
  line-height: 1.6;
}
</style>
