import { get } from './http'

export const forecastApi = {
  // 获取预测数据
  getForecast: (params: { storeId: string, date: string }) => {
    return get<{
      data: {
        storeId: string
        date: string
        predictions: {
          hour: number
          customerCount: number
          salesAmount: number
        }[]
      }
    }>(`/forecast/predict/${params.storeId}`, { date: params.date })
  },
}
