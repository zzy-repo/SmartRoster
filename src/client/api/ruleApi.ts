import { get, put } from './http'

/**
 * 获取排班规则设置
 */
export async function getRuleSettings(): Promise<{
  max_daily_hours: number
  max_weekly_hours: number
  initial_temp: number
  min_temp: number
  cooling_rate: number
  iter_per_temp: number
  iterations: number
  understaff_penalty: number
  workday_violation: number
  time_pref_violation: number
  daily_hours_violation: number
  weekly_hours_violation: number
}> {
  const response = await get('/schedule/rules')
  return response.data.rules[0]
}

/**
 * 更新排班规则设置
 * @param settings 规则设置对象
 */
export async function updateRuleSettings(settings: {
  max_daily_hours: number
  max_weekly_hours: number
  initial_temp: number
  min_temp: number
  cooling_rate: number
  iter_per_temp: number
  iterations: number
  understaff_penalty: number
  workday_violation: number
  time_pref_violation: number
  daily_hours_violation: number
  weekly_hours_violation: number
}) {
  return await put('/schedule/rules', settings)
}
