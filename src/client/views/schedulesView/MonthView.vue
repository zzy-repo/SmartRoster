<template>
  <div>
    <ElCalendar v-model="currentDate">
      <template #date-cell="{ data }">
        <div 
          class="calendar-cell" 
          @click="$emit('day-click', new Date(data.day))"
        >
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

.date-count {
  display: flex;
  flex-wrap: wrap;
}
</style>