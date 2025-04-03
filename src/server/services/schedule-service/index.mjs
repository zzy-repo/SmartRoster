import express from 'express';
import { spawn } from 'child_process';
import { pool } from '../../shared/database/index.mjs';
import { config } from '../../config/index.mjs';

const app = express();
const PORT = config.services.schedule.port;

app.use(express.json());

// 调用Python排班算法
function callPythonAlgorithm(endpoint, data) {
  return new Promise((resolve, reject) => {
    // 创建Python进程
    const pythonProcess = spawn('python3', [
      `${process.cwd()}/roster/run_api.py`,
      endpoint,
      JSON.stringify(data)
    ]);
    
    let result = '';
    let error = '';
    
    // 收集标准输出
    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });
    
    // 收集错误输出
    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    // 进程结束
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python进程退出，错误码: ${code}, 错误: ${error}`));
      } else {
        try {
          resolve(JSON.parse(result));
        } catch (e) {
          reject(new Error(`解析Python输出失败: ${e.message}, 输出: ${result}`));
        }
      }
    });
  });
}

// 获取员工数据
async function getEmployees(storeId) {
  const [employees] = await pool.query(`
    SELECT e.*, 
           GROUP_CONCAT(s.name) as skills
    FROM employees e
    LEFT JOIN employee_skills es ON e.id = es.employee_id
    LEFT JOIN skills s ON es.skill_id = s.id
    WHERE e.store_id = ?
    GROUP BY e.id
  `, [storeId]);
  
  // 转换为算法需要的格式
  return employees.map(emp => ({
    name: emp.name,
    position: emp.position,
    store: emp.store_id,
    workday_pref: [emp.workday_pref_start, emp.workday_pref_end],
    time_pref: [
      emp.time_pref_start.substring(0, 5), 
      emp.time_pref_end.substring(0, 5)
    ],
    max_daily_hours: emp.max_daily_hours,
    max_weekly_hours: emp.max_weekly_hours,
    skills: emp.skills ? emp.skills.split(',') : []
  }));
}

// 生成排班表
app.post('/generate', async (req, res) => {
  try {
    const { storeId, startDate, endDate, saConfig, costParams } = req.body;
    
    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 获取员工数据
    const employees = await getEmployees(storeId);
    
    // 获取班次需求数据
    // 这里应该从数据库获取或根据预测生成班次需求
    // 简化示例，实际应用中需要更复杂的逻辑
    const shifts = []; // 这里应该填充实际的班次数据
    
    // 调用Python算法
    const algorithmData = {
      employees,
      shifts,
      sa_config: saConfig || {
        initial_temp: 50.0,
        min_temp: 0.5,
        cooling_rate: 0.9,
        iter_per_temp: 10,
        iterations: 100
      },
      cost_params: costParams || {
        understaff_penalty: 100,
        workday_violation: 10,
        time_pref_violation: 5,
        daily_hours_violation: 20,
        weekly_hours_violation: 50
      }
    };
    
    const result = await callPythonAlgorithm('generate', algorithmData);
    
    // 保存排班结果到数据库
    // 这里应该有保存逻辑
    
    res.json(result);
  } catch (error) {
    console.error('生成排班表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 优化排班表
app.post('/optimize', async (req, res) => {
  try {
    const { scheduleId, saConfig, costParams } = req.body;
    
    if (!scheduleId) {
      return res.status(400).json({ error: '缺少排班表ID' });
    }
    
    // 从数据库获取现有排班表
    // 这里应该有获取逻辑
    const schedule = []; // 从数据库获取的排班表
    const employees = []; // 从数据库获取的员工数据
    
    // 调用Python算法
    const algorithmData = {
      employees,
      schedule,
      sa_config: saConfig || {
        initial_temp: 50.0,
        min_temp: 0.5,
        cooling_rate: 0.9,
        iter_per_temp: 10,
        iterations: 100
      },
      cost_params: costParams || {
        understaff_penalty: 100,
        workday_violation: 10,
        time_pref_violation: 5,
        daily_hours_violation: 20,
        weekly_hours_violation: 50
      }
    };
    
    const result = await callPythonAlgorithm('optimize', algorithmData);
    
    // 更新数据库中的排班表
    // 这里应该有更新逻辑
    
    res.json(result);
  } catch (error) {
    console.error('优化排班表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 手动分配班次
app.post('/assign', async (req, res) => {
  try {
    const { scheduleId, shiftId, employeeId } = req.body;
    
    if (!scheduleId || !shiftId || !employeeId) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 更新数据库中的排班分配
    // 这里应该有更新逻辑
    
    // 验证分配是否合理
    // 这里应该调用Python算法验证
    
    res.json({ message: '班次分配成功' });
  } catch (error) {
    console.error('分配班次失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取排班表
app.get('/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, view } = req.query;
    
    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 从数据库获取排班表
    // 这里应该有获取逻辑
    
    res.json({ schedule: [] }); // 返回实际的排班表数据
  } catch (error) {
    console.error('获取排班表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`排班服务运行在端口 ${PORT}`);
});

export default app;