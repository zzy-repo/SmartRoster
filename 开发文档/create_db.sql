-- 创建数据库（使用utf8mb4字符集支持中文）
CREATE DATABASE IF NOT EXISTS SmartRoster 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE SmartRoster;

-- ----------------------------
-- 1. 门店表 (stores)
-- ----------------------------
CREATE TABLE IF NOT EXISTS stores (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '门店名称',
  address TEXT COMMENT '详细地址',
  area FLOAT COMMENT '工作场所面积（平方米）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------
-- 2. 员工表 (employees)
-- ----------------------------
CREATE TABLE IF NOT EXISTS employees (
  id BIGINT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT '员工姓名',
  position ENUM('门店经理', '副经理', '小组长', '店员') NOT NULL COMMENT '职位',
  phone VARCHAR(20) COMMENT '联系电话',
  email VARCHAR(255) COMMENT '电子邮箱',
  store_id BIGINT NOT NULL COMMENT '所属门店ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 3. 员工偏好表 (employee_preferences)
-- ----------------------------
CREATE TABLE IF NOT EXISTS employee_preferences (
  employee_id BIGINT PRIMARY KEY COMMENT '员工ID',
  workdays_start TINYINT COMMENT '工作日起始（1=周一,7=周日）',
  workdays_end TINYINT COMMENT '工作日结束',
  shift_time_start TIME COMMENT '偏好工作时间段开始',
  shift_time_end TIME COMMENT '偏好工作时间段结束',
  max_hours_per_day FLOAT COMMENT '每日最大工作时长',
  max_hours_per_week FLOAT COMMENT '每周最大工作时长',
  CONSTRAINT chk_workdays_range CHECK (workdays_start BETWEEN 1 AND 7 AND workdays_end BETWEEN 1 AND 7),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 4. 技能表 (skills)
-- ----------------------------
CREATE TABLE IF NOT EXISTS skills (
  id BIGINT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE COMMENT '技能名称'
) ENGINE=InnoDB;

-- ----------------------------
-- 5. 员工技能关联表 (employee_skills)
-- ----------------------------
CREATE TABLE IF NOT EXISTS employee_skills (
  employee_id BIGINT NOT NULL,
  skill_id BIGINT NOT NULL,
  PRIMARY KEY (employee_id, skill_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 6. 排班规则表 (shift_rules)
-- ----------------------------
CREATE TABLE IF NOT EXISTS shift_rules (
  id BIGINT PRIMARY KEY,
  store_id BIGINT NOT NULL COMMENT '适用门店ID',
  name VARCHAR(255) NOT NULL COMMENT '规则名称',
  shift_type VARCHAR(50) NOT NULL COMMENT '班次类型',
  min_employees INT NOT NULL COMMENT '最少所需人数',
  effective_start DATE NOT NULL COMMENT '生效开始日期',
  effective_end DATE NOT NULL COMMENT '生效结束日期',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 7. 销售预测表 (sales_forecasts)
-- ----------------------------
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id BIGINT PRIMARY KEY,
  store_id BIGINT NOT NULL COMMENT '门店ID',
  forecast_date DATE NOT NULL COMMENT '预测日期',
  predicted_sales DECIMAL(10,2) NOT NULL COMMENT '预测营业额',
  confidence_level FLOAT COMMENT '置信度',
  CONSTRAINT chk_confidence CHECK (confidence_level BETWEEN 0.0 AND 1.0),
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 8. 班次表 (shifts)
-- ----------------------------
CREATE TABLE IF NOT EXISTS shifts (
  id BIGINT PRIMARY KEY,
  store_id BIGINT NOT NULL COMMENT '所属门店ID',
  start_time DATETIME NOT NULL COMMENT '班次开始时间',
  end_time DATETIME NOT NULL COMMENT '班次结束时间',
  required_position ENUM('门店经理', '副经理', '小组长', '店员') NOT NULL COMMENT '需求职位',
  required_skill_id BIGINT NOT NULL COMMENT '需求技能ID',
  status ENUM('assigned', 'open') DEFAULT 'open' COMMENT '班次状态',
  forecast_id BIGINT COMMENT '关联预测ID',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (required_skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY (forecast_id) REFERENCES sales_forecasts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------
-- 9. 班次分配表 (shift_assignments)
-- ----------------------------
CREATE TABLE IF NOT EXISTS shift_assignments (
  id BIGINT PRIMARY KEY,
  shift_id BIGINT NOT NULL COMMENT '班次ID',
  employee_id BIGINT COMMENT '分配员工ID',
  assigned_by BIGINT NOT NULL COMMENT '操作者ID',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  override_reason TEXT COMMENT '手动分配原因',
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB;