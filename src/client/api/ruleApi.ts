import { get, put } from './http'

/**
 * 获取排班规则设置
 */
export async function getRuleSettings(): Promise<{ max_daily_hours: number, max_weekly_hours: number }> {
  const response = await get('/schedules/rules')
  return {
    max_daily_hours: response.data.rules[0].max_daily_hours,
    max_weekly_hours: response.data.rules[0].max_weekly_hours,
  }
}

/**
 * 更新排班规则设置
 * @param settings 规则设置对象
 */
export async function updateRuleSettings(settings: any) {
  return await put('/schedules/rules', settings)
}
