<script setup lang="ts">
import { ElCalendar } from 'element-plus'
import { computed } from 'vue'

// 接收父组件传递的属性
const props = defineProps<{
  date: Date
  scheduleData: Array<any>
}>()

// 定义事件
const emit = defineEmits<{
  'update:date': [date: Date]
  'update:view': [view: 'year' | 'month' | 'day']
}>()

// 按日统计排班人数
const weeklyPositionCount = computed(() => {
  const counts: Record<string, Record<string, number>> = {}
  props.scheduleData.forEach((item) => {
    const dateStr = item.date.toISOString().slice(0, 10)
    if (!counts[dateStr]) {
      counts[dateStr] = {}
    }
    counts[dateStr][item.content.position] = (counts[dateStr][item.content.position] || 0) + 1
  })
  return counts
})

/**
 * 处理日期点击事件，切换到日视图
 * @param date 选中的日期
 */
function handleDateClick(date: Date) {
  emit('update:view', 'day')
  emit('update:date', date)
}
</script>

<template>
  <ElCalendar v-model="date">
    <template #date-cell="{ data }">
      <div class="calendar-cell" @click="() => handleDateClick(new Date(data.day))">
        <div class="date-count">
          <el-tag
            v-for="(count, position) in weeklyPositionCount[new Date(data.day).toISOString().slice(0, 10)] || {}"
            :key="position"
            size="small"
            class="position-tag"
            :style="{ marginRight: '4px', marginBottom: '4px' }"
          >
            {{ position }}: {{ count }}
          </el-tag>
        </div>
      </div>
    </template>
  </ElCalendar>
</template>

<style scoped>
.calendar-cell {
  --cell-padding: 12px;

  min-height: 140px;
  padding: var(--cell-padding);
  background: white;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  transition: all 0.3s;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 16px rgba(64,158,255,0.15);
    border-color: var(--primary-color);
  }
}

.date-count {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: var(--text-light);
}

.position-tag {
  background: rgba(64,158,255,0.1);
  border-color: rgba(64,158,255,0.2);
  color: var(--primary-color);
  margin: 4px;
  flex-shrink: 0;
  white-space: normal;
  line-height: 1.5;
  min-width: 60px;
  text-align: center;
  border-radius: 14px;
}
</style>