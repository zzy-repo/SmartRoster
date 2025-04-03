/**
 * 排班算法模块
 * 负责生成最优排班方案
 */

/**
 * 生成最优排班方案
 * @param {Array} employees - 员工列表
 * @param {Array} shifts - 班次列表
 * @param {Number} scheduleId - 排班表ID
 * @returns {Object} 排班方案
 */
export async function generateOptimalSchedule(employees, shifts, scheduleId) {
  console.log('开始生成排班方案...');
  
  // 这里是一个简单的排班算法实现
  // 在实际项目中，您可以集成Python排班算法或实现更复杂的逻辑
  
  const schedule = [];
  
  // 按职位对员工进行分组
  const employeesByPosition = {};
  employees.forEach(employee => {
    if (!employeesByPosition[employee.position]) {
      employeesByPosition[employee.position] = [];
    }
    employeesByPosition[employee.position].push(employee);
  });
  
  // 为每个班次分配员工
  for (const shift of shifts) {
    const assignment = {
      shift_id: shift.id,
      schedule_id: scheduleId,
      assignments: {}
    };
    
    // 获取该职位所需的员工数量
    const requiredCount = shift.count || 1;
    
    // 获取可用于该职位的员工
    const availableEmployees = employeesByPosition[shift.position] || [];
    
    // 简单地选择前N个员工（实际中应考虑更多因素）
    const selectedEmployees = availableEmployees.slice(0, requiredCount);
    
    // 记录分配结果
    assignment.assignments[shift.position] = selectedEmployees.map(emp => ({
      employee_id: emp.id,
      name: emp.name
    }));
    
    schedule.push(assignment);
  }
  
  console.log(`排班方案生成完成，共分配 ${schedule.length} 个班次`);
  return schedule;
}