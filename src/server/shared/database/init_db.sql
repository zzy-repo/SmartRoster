-- SmartRoster 数据库初始化脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 门店表
CREATE TABLE IF NOT EXISTS stores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  address VARCHAR(200),
  phone VARCHAR(20),
  manager_id INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 技能表
CREATE TABLE IF NOT EXISTS skills (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '技能名称（收银/导购/库房）'
);

-- 员工表
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  position VARCHAR(50) NOT NULL,
  store_id INT,
  user_id INT,
  max_daily_hours INT DEFAULT 8,
  max_weekly_hours INT DEFAULT 40,
  workday_pref_start INT DEFAULT 0,
  workday_pref_end INT DEFAULT 6,
  time_pref_start TIME DEFAULT '00:00:00',
  time_pref_end TIME DEFAULT '23:59:59',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 员工技能关联表
CREATE TABLE IF NOT EXISTS employee_skills (
  employee_id INT NOT NULL,
  skill_id INT NOT NULL,
  proficiency INT DEFAULT 1 COMMENT '熟练度 1-5',
  PRIMARY KEY (employee_id, skill_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
);

-- 排班表
CREATE TABLE IF NOT EXISTS schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_by INT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 班次表
CREATE TABLE IF NOT EXISTS shifts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  day INT NOT NULL COMMENT '0-6 表示周一到周日',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- 班次职位需求表
CREATE TABLE IF NOT EXISTS shift_positions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  shift_id INT NOT NULL,
  position VARCHAR(50) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE
);

-- 班次分配表
CREATE TABLE IF NOT EXISTS shift_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT NOT NULL,
  shift_id INT NOT NULL,
  employee_id INT NOT NULL,
  position VARCHAR(50) NOT NULL,
  assigned_by INT,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  override_reason TEXT,
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 初始化基础数据
INSERT INTO skills (name) VALUES 
  ('收银'),
  ('导购'),
  ('库房')
ON DUPLICATE KEY UPDATE name = VALUES(name);