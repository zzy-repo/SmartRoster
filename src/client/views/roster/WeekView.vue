<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import WeekSchedule from '../../components/roster/WeekSchedule.vue'

const route = useRoute()

// 状态
const weekStart = ref(new Date())
const selectedStoreId = ref('')
const viewType = ref<'position' | 'employee' | 'skill'>('position')

// 计算当前周的开始日期
function calculateWeekStart(date: Date) {
  const result = new Date(date)
  const day = result.getDay() || 7
  if (day !== 1) {
    result.setHours(-24 * (day - 1))
  }
  return result
}

// 从路由参数获取日期和门店ID
function initFromRoute() {
  if (route.query.date) {
    const date = new Date(route.query.date as string)
    weekStart.value = calculateWeekStart(date)
  }
  else {
    weekStart.value = calculateWeekStart(new Date())
  }

  if (route.query.storeId) {
    selectedStoreId.value = route.query.storeId as string
  }
}

// 初始化
initFromRoute()
</script>

<template>
  <div class="week-view">
    <div class="view-controls">
      <el-radio-group v-model="viewType" size="large">
        <el-radio-button label="position">
          按岗位
        </el-radio-button>
        <el-radio-button label="employee">
          按员工
        </el-radio-button>
        <el-radio-button label="skill">
          按技能
        </el-radio-button>
      </el-radio-group>
    </div>

    <WeekSchedule
      :week-start="weekStart"
      :store-id="selectedStoreId"
      :group-by="viewType"
      @assign="$emit('assign', $event)"
      @unassign="$emit('unassign', $event)"
    />
  </div>
</template>

<style scoped>
.week-view {
  width: 100%;
}

.view-controls {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}
</style>
