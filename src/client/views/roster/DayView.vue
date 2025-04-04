<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import DaySchedule from '../../components/roster/DaySchedule.vue'

const route = useRoute()

// 状态
const currentDate = ref(new Date())
const selectedStoreId = ref('')
const viewType = ref<'position' | 'employee' | 'skill'>('position')

// 从路由参数获取日期和门店ID
const initFromRoute = () => {
  if (route.query.date) {
    currentDate.value = new Date(route.query.date as string)
  }
  
  if (route.query.storeId) {
    selectedStoreId.value = route.query.storeId as string
  }
}

// 初始化
initFromRoute()
</script>

<template>
  <div class="day-view">
    <div class="view-controls">
      <el-radio-group v-model="viewType" size="large">
        <el-radio-button label="position">按岗位</el-radio-button>
        <el-radio-button label="employee">按员工</el-radio-button>
        <el-radio-button label="skill">按技能</el-radio-button>
      </el-radio-group>
    </div>
    
    <DaySchedule 
      :date="currentDate" 
      :store-id="selectedStoreId" 
      :group-by="viewType"
      @assign="$emit('assign', $event)"
      @unassign="$emit('unassign', $event)"
    />
  </div>
</template>

<style scoped>
.day-view {
  width: 100%;
}

.view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
</style>