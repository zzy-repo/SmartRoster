<script setup lang="ts">
import type { PropType } from 'vue'
import { ElTag } from 'element-plus'

const shift = defineProps({
  shift: {
    type: Object as PropType<{
      shiftId: number
      position: string
      employee: string
      time: string
      overrideReason?: string
    }>,
    required: true,
  },
})

function handleDragStart(e: DragEvent) {
  e.dataTransfer?.setData('shift', JSON.stringify(shift))
}
</script>

<template>
  <div
    class="shift-item"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="$emit('drag-end', shift)"
  >
    <ElTag type="info">
      {{ shift.shift.position }}
    </ElTag>
    <div class="employee">
      {{ shift.shift.employee || '未分配' }}
    </div>
    <div class="time">
      {{ shift.shift.time }}
    </div>
    <div v-if="shift.shift.overrideReason" class="remark">
      <el-icon><Warning /></el-icon>
      {{ shift.shift.overrideReason }}
    </div>
  </div>
</template>

<style scoped>
.shift-item {
  padding: 8px;
  margin: 4px 0;
  background: #f8f9fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  cursor: move;
}

.employee {
  font-weight: 500;
  margin: 4px 0;
}

.time {
  color: #606266;
  font-size: 0.9em;
}

.remark {
  color: #e6a23c;
  font-size: 0.8em;
  display: flex;
  align-items: center;
  margin-top: 4px;
}
</style>
