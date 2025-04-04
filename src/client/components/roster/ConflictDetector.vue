<script setup lang="ts">
import type { ScheduleShift } from '../../types'
import { ref } from 'vue'
import { useRosterStore } from '../../stores/rosterStore'

const props = defineProps<{
  shiftId: string
  employeeId: string
  position: string
}>()

const emit = defineEmits<{
  (e: 'conflict-detected', data: { conflicts: ConflictInfo[] }): void
  (e: 'no-conflict'): void
}>()

interface ConflictInfo {
  type: 'overlap' | 'rest_hours' | 'max_daily_hours' | 'max_weekly_hours' | 'consecutive_days'
  message: string
  severity: 'warning' | 'error'
  details?: any
}

const rosterStore = useRosterStore()
const loading = ref(false)
const conflicts = ref<ConflictInfo[]>([])

// 检测班次冲突
async function detectConflicts() {
  loading.value = true
  conflicts.value = []

  try {
    if (!rosterStore.schedule)
      return

    const currentShift = rosterStore.schedule.shifts.find(s => s.id === props.shiftId)
    if (!currentShift)
      return

    // 获取员工信息
    const employeeResponse = await rosterStore.getAvailableEmployees({
      shiftId: props.shiftId,
      position: props.position,
    })

    // 修复类型错误：先获取data数组，然后在数组上调用find方法
    const employeeList = employeeResponse.data
    const employee = employeeList.find((emp: any) => emp.id === props.employeeId)
    if (!employee)
      return

    // 检查时间重叠冲突
    checkTimeOverlap(currentShift, employee)

    // 检查休息时间不足冲突
    checkRestHours(currentShift, employee)

    // 检查每日工作时长超限
    checkDailyHours(currentShift, employee)

    // 检查每周工作时长超限
    checkWeeklyHours(currentShift, employee)

    // 检查连续工作天数超限
    checkConsecutiveDays(currentShift, employee)

    // 发出冲突检测结果
    if (conflicts.value.length > 0) {
      emit('conflict-detected', { conflicts: conflicts.value })
    }
    else {
      emit('no-conflict')
    }
  }
  catch (error) {
    console.error('检测班次冲突失败:', error)
  }
  finally {
    loading.value = false
  }
}

// 检查时间重叠冲突
function checkTimeOverlap(currentShift: ScheduleShift, _employee: any) {
  if (!rosterStore.schedule)
    return

  // 获取该员工所有已分配的班次
  const employeeShifts = rosterStore.schedule.shifts.filter((shift) => {
    return Object.values(shift.assignments).some((assignments) => {
      return assignments.some(emp => emp.id === props.employeeId)
    })
  })

  // 检查是否有时间重叠
  for (const shift of employeeShifts) {
    // 跳过当前正在检查的班次
    if (shift.id === currentShift.id)
      continue

    // 如果是同一天的班次，检查时间是否重叠
    if (shift.date === currentShift.date) {
      const currentStart = new Date(`${currentShift.date}T${currentShift.start_time}`)
      const currentEnd = new Date(`${currentShift.date}T${currentShift.end_time}`)
      const shiftStart = new Date(`${shift.date}T${shift.start_time}`)
      const shiftEnd = new Date(`${shift.date}T${shift.end_time}`)

      // 检查时间重叠
      if (
        (currentStart < shiftEnd && currentEnd > shiftStart)
        || (shiftStart < currentEnd && shiftEnd > currentStart)
      ) {
        conflicts.value.push({
          type: 'overlap',
          message: `与 ${shift.start_time}-${shift.end_time} 的班次时间重叠`,
          severity: 'error',
          details: {
            existingShift: shift,
            newShift: currentShift,
          },
        })
      }
    }
  }
}

// 检查休息时间不足冲突
function checkRestHours(currentShift: ScheduleShift, _employee: any) {
  if (!rosterStore.schedule)
    return

  // 获取该员工所有已分配的班次
  const employeeShifts = rosterStore.schedule.shifts.filter((shift) => {
    return Object.values(shift.assignments).some((assignments) => {
      return assignments.some(emp => emp.id === props.employeeId)
    })
  })

  // 最小休息时间（小时）
  const minRestHours = 11 // 假设最小休息时间为11小时

  // 检查是否有休息时间不足
  for (const shift of employeeShifts) {
    // 跳过当前正在检查的班次
    if (shift.id === currentShift.id)
      continue

    // 计算两个班次之间的休息时间
    const currentShiftDate = new Date(currentShift.date)
    const otherShiftDate = new Date(shift.date)
    const dateDiff = Math.abs(currentShiftDate.getTime() - otherShiftDate.getTime())
    const dayDiff = dateDiff / (1000 * 60 * 60 * 24)

    // 如果是相邻的两天或同一天
    if (dayDiff <= 1) {
      let currentStart, currentEnd, shiftStart, shiftEnd

      // 设置日期时间
      if (currentShift.date === shift.date) {
        // 同一天
        currentStart = new Date(`${currentShift.date}T${currentShift.start_time}`)
        currentEnd = new Date(`${currentShift.date}T${currentShift.end_time}`)
        shiftStart = new Date(`${shift.date}T${shift.start_time}`)
        shiftEnd = new Date(`${shift.date}T${shift.end_time}`)
      }
      else if (currentShiftDate > otherShiftDate) {
        // 当前班次在后一天
        shiftEnd = new Date(`${shift.date}T${shift.end_time}`)
        currentStart = new Date(`${currentShift.date}T${currentShift.start_time}`)

        // 计算休息时间（小时）
        const restHours = (currentStart.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60)

        if (restHours < minRestHours) {
          conflicts.value.push({
            type: 'rest_hours',
            message: `与前一天班次的休息时间不足 ${minRestHours} 小时（当前: ${restHours.toFixed(1)} 小时）`,
            severity: 'warning',
            details: {
              restHours,
              minRequired: minRestHours,
              previousShift: shift,
            },
          })
        }
      }
      else {
        // 当前班次在前一天
        currentEnd = new Date(`${currentShift.date}T${currentShift.end_time}`)
        shiftStart = new Date(`${shift.date}T${shift.start_time}`)

        // 计算休息时间（小时）
        const restHours = (shiftStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60)

        if (restHours < minRestHours) {
          conflicts.value.push({
            type: 'rest_hours',
            message: `与后一天班次的休息时间不足 ${minRestHours} 小时（当前: ${restHours.toFixed(1)} 小时）`,
            severity: 'warning',
            details: {
              restHours,
              minRequired: minRestHours,
              nextShift: shift,
            },
          })
        }
      }
    }
  }
}

// 检查每日工作时长超限
function checkDailyHours(currentShift: ScheduleShift, employee: any) {
  if (!rosterStore.schedule || !employee.preferences)
    return

  // 获取员工每日最大工作时长
  const maxDailyHours = employee.preferences.max_daily_hours || 8

  // 计算当前班次的工作时长
  const currentStart = new Date(`2000-01-01T${currentShift.start_time}`)
  const currentEnd = new Date(`2000-01-01T${currentShift.end_time}`)
  const currentHours = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60)

  // 获取同一天该员工所有已分配的班次
  const sameDayShifts = rosterStore.schedule.shifts.filter((shift) => {
    return shift.date === currentShift.date
      && shift.id !== currentShift.id
      && Object.values(shift.assignments).some((assignments) => {
        return assignments.some(emp => emp.id === props.employeeId)
      })
  })

  // 计算同一天的总工作时长
  let totalHours = currentHours
  for (const shift of sameDayShifts) {
    const shiftStart = new Date(`2000-01-01T${shift.start_time}`)
    const shiftEnd = new Date(`2000-01-01T${shift.end_time}`)
    totalHours += (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
  }

  // 检查是否超过每日最大工作时长
  if (totalHours > maxDailyHours) {
    conflicts.value.push({
      type: 'max_daily_hours',
      message: `超过每日最大工作时长 ${maxDailyHours} 小时（当前: ${totalHours.toFixed(1)} 小时）`,
      severity: 'warning',
      details: {
        totalHours,
        maxAllowed: maxDailyHours,
        date: currentShift.date,
      },
    })
  }
}

// 检查每周工作时长超限
function checkWeeklyHours(currentShift: ScheduleShift, employee: any) {
  if (!rosterStore.schedule || !employee.preferences)
    return

  // 获取员工每周最大工作时长
  const maxWeeklyHours = employee.preferences.max_weekly_hours || 40

  // 计算当前班次的工作时长
  const currentStart = new Date(`2000-01-01T${currentShift.start_time}`)
  const currentEnd = new Date(`2000-01-01T${currentShift.end_time}`)
  const currentHours = (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60)

  // 获取当前班次所在周的开始日期和结束日期
  const currentDate = new Date(currentShift.date)
  const dayOfWeek = currentDate.getDay() || 7 // 将周日的0转换为7
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - (dayOfWeek - 1))
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  // 格式化日期为YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // 获取同一周该员工所有已分配的班次
  const sameWeekShifts = rosterStore.schedule.shifts.filter((shift) => {
    const shiftDate = new Date(shift.date)
    return shiftDate >= weekStart
      && shiftDate <= weekEnd
      && shift.id !== currentShift.id
      && Object.values(shift.assignments).some((assignments) => {
        return assignments.some(emp => emp.id === props.employeeId)
      })
  })

  // 计算同一周的总工作时长
  let totalHours = currentHours
  for (const shift of sameWeekShifts) {
    const shiftStart = new Date(`2000-01-01T${shift.start_time}`)
    const shiftEnd = new Date(`2000-01-01T${shift.end_time}`)
    totalHours += (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)
  }

  // 检查是否超过每周最大工作时长
  if (totalHours > maxWeeklyHours) {
    conflicts.value.push({
      type: 'max_weekly_hours',
      message: `超过每周最大工作时长 ${maxWeeklyHours} 小时（当前: ${totalHours.toFixed(1)} 小时）`,
      severity: 'warning',
      details: {
        totalHours,
        maxAllowed: maxWeeklyHours,
        weekStart: formatDate(weekStart),
        weekEnd: formatDate(weekEnd),
      },
    })
  }
}

// 检查连续工作天数超限
function checkConsecutiveDays(currentShift: ScheduleShift, _employee: any) {
  if (!rosterStore.schedule)
    return

  // 最大连续工作天数
  const maxConsecutiveDays = 6 // 假设最大连续工作天数为6天

  // 获取该员工所有已分配的班次
  const employeeShifts = rosterStore.schedule.shifts.filter((shift) => {
    return Object.values(shift.assignments).some((assignments) => {
      return assignments.some(emp => emp.id === props.employeeId)
    })
  })

  // 添加当前班次
  const allShifts = [...employeeShifts, currentShift]

  // 获取所有工作日期
  const workDates = new Set<string>()
  allShifts.forEach(shift => workDates.add(shift.date))

  // 将日期转换为Date对象并排序
  const sortedDates = Array.from(workDates).map(date => new Date(date)).sort((a, b) => a.getTime() - b.getTime())

  // 检查连续工作天数
  let consecutiveDays = 1
  let maxConsecutive = 1

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1]
    const currDate = sortedDates[i]

    // 计算两个日期之间的差距（天）
    const diffTime = currDate.getTime() - prevDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    if (diffDays === 1) {
      // 连续的日期
      consecutiveDays++
      maxConsecutive = Math.max(maxConsecutive, consecutiveDays)
    }
    else {
      // 不连续，重置计数
      consecutiveDays = 1
    }
  }

  // 检查是否超过最大连续工作天数
  if (maxConsecutive > maxConsecutiveDays) {
    conflicts.value.push({
      type: 'consecutive_days',
      message: `超过最大连续工作天数 ${maxConsecutiveDays} 天（当前: ${maxConsecutive} 天）`,
      severity: 'warning',
      details: {
        consecutiveDays: maxConsecutive,
        maxAllowed: maxConsecutiveDays,
      },
    })
  }
}

// 暴露方法
defineExpose({
  detectConflicts,
})
</script>

<template>
  <div v-loading="loading" />
</template>
