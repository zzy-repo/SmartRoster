<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

// 业务预测数据类型定义
interface ForecastData {
  id: string
  date: string
  storeId: string
  storeName: string
  hourlyData: {
    hour: number
    customerCount: number
    salesAmount: number
  }[]
}

// 状态
const forecastData = ref<ForecastData[]>([])
const loading = ref(false)
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedStore = ref('')

// 模拟门店数据
const stores = [
  { id: '1', name: '北京中关村店' },
  { id: '2', name: '上海南京路店' },
  { id: '3', name: '广州天河店' },
]

// 加载预测数据
const loadForecastData = async () => {
  if (!selectedStore.value) {
    ElMessage.warning('请选择门店')
    return
  }
  
  loading.value = true
  try {
    // 这里应该是从API获取数据
    // const response = await fetch(`/api/forecast?date=${selectedDate.value}&storeId=${selectedStore.value}`)
    // forecastData.value = await response.json()
    
    // 模拟数据
    setTimeout(() => {
      const store = stores.find(s => s.id === selectedStore.value)
      
      // 生成24小时的模拟数据
      const hourlyData = Array.from({ length: 24 }, (_, i) => {
        // 模拟客流量和销售额的高峰期
        const isPeakHour = (i >= 11 && i <= 13) || (i >= 17 && i <= 19)
        const baseCustomers = isPeakHour ? 50 : 20
        const baseSales = isPeakHour ? 5000 : 2000
        
        return {
          hour: i,
          customerCount: Math.floor(baseCustomers + Math.random() * baseCustomers),
          salesAmount: Math.floor(baseSales + Math.random() * baseSales)
        }
      })
      
      forecastData.value = [{
        id: '1',
        date: selectedDate.value,
        storeId: selectedStore.value,
        storeName: store?.name || '',
        hourlyData
      }]
      
      loading.value = false
    }, 500)
  } catch (error) {
    ElMessage.error('加载预测数据失败')
    loading.value = false
  }
}

// 初始化
onMounted(() => {
  if (stores.length > 0) {
    selectedStore.value = stores[0].id
    loadForecastData()
  }
})
</script>

<template>
  <div class="business-forecast">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>业务预测</span>
          <div class="filter-container">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="loadForecastData"
            />
            <el-select
              v-model="selectedStore"
              placeholder="选择门店"
              @change="loadForecastData"
            >
              <el-option
                v-for="store in stores"
                :key="store.id"
                :label="store.name"
                :value="store.id"
              />
            </el-select>
            <el-button type="primary" @click="loadForecastData">查询</el-button>
          </div>
        </div>
      </template>
      
      <div v-if="forecastData.length > 0" class="forecast-content">
        <h3>{{ forecastData[0].storeName }} - {{ forecastData[0].date }} 预测数据</h3>
        
        <!-- 客流量图表 -->
        <div class="chart-container">
          <h4>预计客流量</h4>
          <div class="chart">
            <div 
              v-for="item in forecastData[0].hourlyData" 
              :key="item.hour"
              class="chart-bar"
            >
              <div 
                class="bar customer-bar" 
                :style="{ height: `${item.customerCount}px` }"
              >
                <span class="bar-value">{{ item.customerCount }}</span>
              </div>
              <div class="bar-label">{{ item.hour }}:00</div>
            </div>
          </div>
        </div>
        
        <!-- 销售额图表 -->
        <div class="chart-container">
          <h4>预计销售额</h4>
          <div class="chart">
            <div 
              v-for="item in forecastData[0].hourlyData" 
              :key="item.hour"
              class="chart-bar"
            >
              <div 
                class="bar sales-bar" 
                :style="{ height: `${item.salesAmount / 100}px` }"
              >
                <span class="bar-value">{{ item.salesAmount }}</span>
              </div>
              <div class="bar-label">{{ item.hour }}:00</div>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无预测数据" />
    </el-card>
  </div>
</template>

<style scoped>
.business-forecast {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  display: flex;
  gap: 10px;
}

.forecast-content {
  margin-top: 20px;
}

.chart-container {
  margin-top: 30px;
  margin-bottom: 40px;
}

.chart {
  display: flex;
  align-items: flex-end;
  height: 300px;
  overflow-x: auto;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 10px;
  min-width: 40px;
}

.bar {
  width: 30px;
  position: relative;
  display: flex;
  justify-content: center;
}

.customer-bar {
  background-color: #409EFF;
}

.sales-bar {
  background-color: #67C23A;
}

.bar-value {
  position: absolute;
  top: -20px;
  font-size: 12px;
  color: #606266;
}

.bar-label {
  margin-top: 5px;
  font-size: 12px;
  color: #909399;
}
</style>