import express from 'express'
import { config } from '../../config/index.mjs'
import { pool } from '../../shared/database/index.mjs'

const app = express()
const PORT = config.services.forecast.port

app.use(express.json())

/**
 * @api {get} /api/forecast/historical/:storeId 获取门店历史数据
 * @apiName GetHistoricalData
 * @apiGroup Forecast
 * @apiDescription 获取指定门店在给定时间范围内的历史客流量和销售数据
 *
 * @apiParam {number} storeId 门店ID
 * @apiQuery {string} startDate 开始日期 (YYYY-MM-DD)
 * @apiQuery {string} endDate 结束日期 (YYYY-MM-DD)
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {object[]} data.records 历史数据记录
 * @apiSuccess {string} data.records.date 日期
 * @apiSuccess {number} data.records.hour 小时
 * @apiSuccess {number} data.records.customer_count 客流量
 * @apiSuccess {number} data.records.sales_amount 销售额
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 参数缺失:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "开始日期和结束日期不能为空"
 *     }
 */
app.get('/historical/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '开始日期和结束日期不能为空' })
    }

    // 这里应该从数据库获取历史数据
    // 简化示例，实际应用中需要更复杂的查询
    const [data] = await pool.query(`
      SELECT * FROM store_traffic 
      WHERE store_id = ? AND date BETWEEN ? AND ?
      ORDER BY date, hour
    `, [storeId, startDate, endDate])

    res.json({ data }) // 修改为统一格式
  }
  catch (error) {
    console.error('获取历史数据失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {post} /api/forecast/predict 生成预测数据
 * @apiName GeneratePrediction
 * @apiGroup Forecast
 * @apiDescription 根据历史数据生成指定时间范围内的客流量和销售预测
 *
 * @apiBody {number} storeId 门店ID
 * @apiBody {string} startDate 开始日期 (YYYY-MM-DD)
 * @apiBody {string} endDate 结束日期 (YYYY-MM-DD)
 * @apiBody {string} [method="average"] 预测方法
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {number} data.storeId 门店ID
 * @apiSuccess {string} data.startDate 开始日期
 * @apiSuccess {string} data.endDate 结束日期
 * @apiSuccess {string} data.method 使用的预测方法
 * @apiSuccess {object[]} data.predictions 预测结果列表
 * @apiSuccess {string} data.predictions.date 日期
 * @apiSuccess {number} data.predictions.hour 小时
 * @apiSuccess {number} data.predictions.customer_count 预测客流量
 * @apiSuccess {number} data.predictions.sales_amount 预测销售额
 * @apiSuccess {number} data.predictions.required_staff 建议所需员工数
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 参数缺失:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "缺少必要参数"
 *     }
 */
app.post('/predict', async (req, res) => {
  try {
    const { storeId, startDate, endDate, method } = req.body

    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 这里应该实现预测算法
    // 简化示例，实际应用中需要更复杂的算法

    // 获取历史数据作为预测基础
    const [historicalData] = await pool.query(`
      SELECT date, hour, customer_count, sales_amount
      FROM store_traffic 
      WHERE store_id = ? 
      AND date BETWEEN DATE_SUB(?, INTERVAL 4 WEEK) AND DATE_SUB(?, INTERVAL 1 DAY)
      ORDER BY date, hour
    `, [storeId, startDate, startDate])

    // 简单的预测算法：使用过去4周同一天同一时段的平均值
    const predictions = []

    // 生成日期范围
    const start = new Date(startDate)
    const end = new Date(endDate)
    const dateRange = []

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d))
    }

    // 为每一天的每个小时生成预测
    for (const date of dateRange) {
      const dayOfWeek = date.getDay() // 0-6, 0是周日

      for (let hour = 8; hour < 22; hour++) { // 假设营业时间是8点到22点
        // 找出历史数据中同一天同一时段的记录
        const relevantData = historicalData.filter((record) => {
          const recordDate = new Date(record.date)
          return recordDate.getDay() === dayOfWeek && record.hour === hour
        })

        // 计算平均客流量和销售额
        let avgCustomerCount = 0
        let avgSalesAmount = 0

        if (relevantData.length > 0) {
          avgCustomerCount = relevantData.reduce((sum, record) => sum + record.customer_count, 0) / relevantData.length
          avgSalesAmount = relevantData.reduce((sum, record) => sum + record.sales_amount, 0) / relevantData.length
        }

        // 添加预测结果
        predictions.push({
          date: date.toISOString().split('T')[0],
          hour,
          customer_count: Math.round(avgCustomerCount),
          sales_amount: Math.round(avgSalesAmount * 100) / 100,
          required_staff: Math.ceil(avgCustomerCount / 10), // 简单假设：每10个客人需要1名员工
        })
      }
    }

    // 保存预测结果到数据库
    // 这里应该有保存逻辑

    res.json({
      data: {
        storeId,
        startDate,
        endDate,
        method: method || 'average',
        predictions,
      },
    }) // 修改为统一格式
  }
  catch (error) {
    console.error('生成预测数据失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {get} /api/forecast/predict/:storeId 获取预测数据
 * @apiName GetPrediction
 * @apiGroup Forecast
 * @apiDescription 获取指定门店在给定时间范围内的预测数据
 *
 * @apiParam {number} storeId 门店ID
 * @apiQuery {string} startDate 开始日期 (YYYY-MM-DD)
 * @apiQuery {string} endDate 结束日期 (YYYY-MM-DD)
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {number} data.storeId 门店ID
 * @apiSuccess {string} data.startDate 开始日期
 * @apiSuccess {string} data.endDate 结束日期
 * @apiSuccess {object[]} data.predictions 预测结果列表
 * @apiSuccess {string} data.predictions.date 日期
 * @apiSuccess {number} data.predictions.hour 小时
 * @apiSuccess {number} data.predictions.customer_count 预测客流量
 * @apiSuccess {number} data.predictions.sales_amount 预测销售额
 * @apiSuccess {number} data.predictions.required_staff 建议所需员工数
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 参数缺失:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "开始日期和结束日期不能为空"
 *     }
 */
app.get('/predict/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ error: '开始日期和结束日期不能为空' })
    }

    // 从数据库获取预测数据
    // 这里应该有获取逻辑

    // 简化示例，返回模拟数据
    const predictions = []

    // 生成日期范围
    const start = new Date(startDate)
    const end = new Date(endDate)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0]

      for (let hour = 8; hour < 22; hour++) {
        const customerCount = Math.floor(Math.random() * 50) + 10 // 10-60的随机数

        predictions.push({
          date,
          hour,
          customer_count: customerCount,
          sales_amount: Math.round(customerCount * 50 * 100) / 100, // 假设每个客人平均消费50元
          required_staff: Math.ceil(customerCount / 10), // 每10个客人需要1名员工
        })
      }
    }

    res.json({
      storeId,
      startDate,
      endDate,
      predictions,
    })
  }
  catch (error) {
    console.error('获取预测数据失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * @api {post} /api/forecast/shifts/generate 生成班次需求
 * @apiName GenerateShiftRequirements
 * @apiGroup Forecast
 * @apiDescription 根据预测数据生成指定时间范围内的班次需求
 *
 * @apiBody {number} storeId 门店ID
 * @apiBody {string} startDate 开始日期 (YYYY-MM-DD)
 * @apiBody {string} endDate 结束日期 (YYYY-MM-DD)
 * @apiBody {object} [staffingRules] 排班规则配置
 *
 * @apiSuccess {object} data 响应数据
 * @apiSuccess {object[]} data.shifts 班次需求列表
 * @apiSuccess {string} data.shifts.date 日期
 * @apiSuccess {number} data.shifts.start_hour 开始时间
 * @apiSuccess {number} data.shifts.end_hour 结束时间
 * @apiSuccess {number} data.shifts.required_staff 所需员工数
 * @apiSuccess {object} data.shifts.position_requirements 各职位所需人数
 *
 * @apiError {string} error 错误信息
 *
 * @apiErrorExample {json} 参数缺失:
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "error": "缺少必要参数"
 *     }
 */
app.post('/shifts/generate', async (req, res) => {
  try {
    const { storeId, startDate, endDate, staffingRules } = req.body

    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    // 获取预测数据
    const [predictions] = await pool.query(`
      SELECT date, hour, customer_count, required_staff
      FROM traffic_predictions
      WHERE store_id = ? AND date BETWEEN ? AND ?
      ORDER BY date, hour
    `, [storeId, startDate, endDate])

    // 获取门店的职位配置
    const [positions] = await pool.query(`
      SELECT position, ratio
      FROM store_positions
      WHERE store_id = ?
    `, [storeId])

    // 生成班次需求
    const shifts = []
    const dateMap = new Map()

    // 按日期分组预测数据
    for (const prediction of predictions) {
      const date = prediction.date
      if (!dateMap.has(date)) {
        dateMap.set(date, [])
      }
      dateMap.get(date).push(prediction)
    }

    // 为每一天生成班次
    for (const [date, dayPredictions] of dateMap.entries()) {
      // 按时段合并预测数据
      const timeSlots = []
      let currentSlot = null

      for (const prediction of dayPredictions) {
        if (!currentSlot) {
          currentSlot = {
            start_hour: prediction.hour,
            end_hour: prediction.hour + 1,
            total_staff: prediction.required_staff,
          }
        }
        else if (prediction.required_staff === currentSlot.total_staff) {
          // 如果人员需求相同，扩展当前时段
          currentSlot.end_hour = prediction.hour + 1
        }
        else {
          // 如果人员需求不同，结束当前时段并开始新时段
          timeSlots.push(currentSlot)
          currentSlot = {
            start_hour: prediction.hour,
            end_hour: prediction.hour + 1,
            total_staff: prediction.required_staff,
          }
        }
      }

      if (currentSlot) {
        timeSlots.push(currentSlot)
      }

      // 根据时段生成班次
      for (const slot of timeSlots) {
        // 根据职位比例分配人员
        const requiredPositions = {}

        for (const position of positions) {
          const count = Math.ceil(slot.total_staff * position.ratio)
          requiredPositions[position.position] = count
        }

        // 创建班次
        shifts.push({
          day: new Date(date).getDay(), // 0-6, 0是周日
          date,
          start_time: `${slot.start_hour.toString().padStart(2, '0')}:00`,
          end_time: `${slot.end_hour.toString().padStart(2, '0')}:00`,
          required_positions: requiredPositions,
          store: storeId,
        })
      }
    }

    // 保存班次需求到数据库
    // 这里应该有保存逻辑

    res.json({
      storeId,
      startDate,
      endDate,
      shifts,
    })
  }
  catch (error) {
    console.error('生成班次需求失败:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`预测服务运行在端口 ${PORT}`)
})

export default app
