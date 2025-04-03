import { pool } from '../../../shared/database/index.mjs';
import { generateOptimalSchedule } from '../algorithms/scheduler.mjs';

// 获取排班表列表
async function getSchedules(req, res) {
  try {
    const { storeId, startDate, endDate } = req.query;
    
    let query = 'SELECT * FROM schedules WHERE 1=1';
    const params = [];
    
    if (storeId) {
      query += ' AND store_id = ?';
      params.push(storeId);
    }
    
    if (startDate) {
      query += ' AND start_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND end_date <= ?';
      params.push(endDate);
    }
    
    const [schedules] = await pool.execute(query, params);
    res.json(schedules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 获取单个排班表
async function getScheduleById(req, res) {
  try {
    const { id } = req.params;
    
    // 获取排班表基本信息
    const [schedules] = await pool.execute(
      'SELECT * FROM schedules WHERE id = ?',
      [id]
    );
    
    if (schedules.length === 0) {
      return res.status(404).json({ message: '排班表不存在' });
    }
    
    const schedule = schedules[0];
    
    // 获取排班表详情（班次分配）
    const [assignments] = await pool.execute(
      `SELECT sa.*, s.day, s.start_time, s.end_time, e.name as employee_name, e.position 
       FROM shift_assignments sa
       JOIN shifts s ON sa.shift_id = s.id
       LEFT JOIN employees e ON sa.employee_id = e.id
       WHERE sa.schedule_id = ?`,
      [id]
    );
    
    schedule.assignments = assignments;
    
    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 生成排班表
async function generateSchedule(req, res) {
  try {
    const { storeId, startDate, endDate } = req.body;
    
    // 验证输入
    if (!storeId || !startDate || !endDate) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 创建排班表记录
    const [result] = await pool.execute(
      'INSERT INTO schedules (store_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
      [storeId, startDate, endDate, 'draft']
    );
    
    const scheduleId = result.insertId;
    
    // 获取门店员工
    const [employees] = await pool.execute(
      'SELECT * FROM employees WHERE store_id = ?',
      [storeId]
    );
    
    // 获取班次需求
    const [shifts] = await pool.execute(
      `SELECT s.*, sp.position, sp.count 
       FROM shifts s
       JOIN shift_positions sp ON s.id = sp.shift_id
       WHERE s.store_id = ?`,
      [storeId]
    );
    
    // 调用排班算法生成排班表
    const schedule = await generateOptimalSchedule(employees, shifts, scheduleId);
    
    res.status(201).json({ 
      id: scheduleId,
      message: '排班表生成成功',
      schedule
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 更新排班表
async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.execute(
      'UPDATE schedules SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({ message: '排班表更新成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

// 分配班次
async function assignShift(req, res) {
  try {
    const { scheduleId, shiftId, employeeId, position, overrideReason } = req.body;
    const assignedBy = req.user.id; // 从JWT获取
    
    // 检查是否已有分配
    const [existingAssignments] = await pool.execute(
      'SELECT * FROM shift_assignments WHERE schedule_id = ? AND shift_id = ? AND position = ?',
      [scheduleId, shiftId, position]
    );
    
    if (existingAssignments.length > 0) {
      // 更新现有分配
      await pool.execute(
        `UPDATE shift_assignments 
         SET employee_id = ?, assigned_by = ?, assigned_at = NOW(), override_reason = ?
         WHERE schedule_id = ? AND shift_id = ? AND position = ?`,
        [employeeId, assignedBy, overrideReason, scheduleId, shiftId, position]
      );
    } else {
      // 创建新分配
      await pool.execute(
        `INSERT INTO shift_assignments 
         (schedule_id, shift_id, employee_id, position, assigned_by, override_reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [scheduleId, shiftId, employeeId, position, assignedBy, overrideReason]
      );
    }
    
    // 更新班次状态
    await pool.execute(
      'UPDATE shifts SET status = ? WHERE id = ?',
      ['assigned', shiftId]
    );
    
    res.json({ message: '班次分配成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}

export default { 
  getSchedules, 
  getScheduleById, 
  generateSchedule, 
  updateSchedule, 
  assignShift 
};