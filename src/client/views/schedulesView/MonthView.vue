<template>
  <div>
    <ElCalendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div 
          class="calendar-cell" 
          @click="$emit('day-click', new Date(data.day))"
        >
          <div class="calendar-date">
            {{ new Date(data.day).getDate() }}
          </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  weeklyPositionCount: Record<string, Record<string, number>>
}>()

defineEmits<{
  (e: 'day-click', date: Date): void
}>()

const currentDate = ref(new Date())
</script>

<style scoped>
.calendar-cell {
  height: 100%;
  padding: 8px;
  cursor: pointer;
}

.calendar-date {
  position: absolute;
  top: 4px;
  right: 4px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
  z-index: 2;
}

.calendar-cell {
  min-height: 120px;
  height: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  position: relative;
}

.date-count {
  margin-top: 12px;
  gap: 4px;
  overflow-y: auto;
  flex-grow: 1;
}
</style>