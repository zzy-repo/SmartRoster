-- SmartRoster 数据库初始化脚本
-- 本脚本包含系统所需的所有表结构和基础数据

-- 用户表 - 存储系统用户信息
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID，自增主键',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名，唯一标识',
  password VARCHAR(100) NOT NULL COMMENT '加密后的密码',
  role VARCHAR(20) NOT NULL COMMENT '用户角色(admin/manager/staff)',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
);

-- 门店表 - 存储门店信息
CREATE TABLE IF NOT EXISTS stores (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '门店ID，自增主键',
  name VARCHAR(50) NOT NULL COMMENT '门店名称',
  address VARCHAR(200) COMMENT '门店地址',
  phone VARCHAR(20) COMMENT '联系电话',
  area DECIMAL(10,2) COMMENT '工作场所面积(平方米)',
  manager_id INT COMMENT '店长ID，关联users表',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL COMMENT '关联用户表，设置店长'
);

-- 技能表 - 存储员工技能类型
CREATE TABLE IF NOT EXISTS skills (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '技能ID，自增主键',
  name VARCHAR(50) NOT NULL COMMENT '技能名称（收银/导购/库房）'
);

-- 员工表 - 存储员工详细信息和工作偏好
CREATE TABLE IF NOT EXISTS employees (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '员工ID，自增主键',
  name VARCHAR(50) NOT NULL COMMENT '员工姓名',
  phone VARCHAR(20) COMMENT '联系电话',
  email VARCHAR(100) COMMENT '电子邮箱',
  position VARCHAR(50) NOT NULL COMMENT '职位名称',
  store_id INT COMMENT '所属门店ID，关联stores表',
  user_id INT COMMENT '关联用户ID，关联users表',
  max_daily_hours INT DEFAULT 8 COMMENT '每日最大工作时长(小时)',
  max_weekly_hours INT DEFAULT 40 COMMENT '每周最大工作时长(小时)',
  workday_pref_start INT DEFAULT 0 COMMENT '偏好工作日开始(0=周一)',
  workday_pref_end INT DEFAULT 6 COMMENT '偏好工作日结束(6=周日)',
  time_pref_start TIME DEFAULT '00:00:00' COMMENT '偏好工作时间段开始',
  time_pref_end TIME DEFAULT '23:59:59' COMMENT '偏好工作时间段结束',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE SET NULL COMMENT '关联门店表',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL COMMENT '关联用户表'
);

-- 员工技能关联表 - 记录员工掌握的技能
CREATE TABLE IF NOT EXISTS employee_skills (
  employee_id INT NOT NULL COMMENT '员工ID，关联employees表',
  skill_id INT NOT NULL COMMENT '技能ID，关联skills表',
  proficiency INT DEFAULT 1 COMMENT '熟练度 1-5(1=初级,5=专家)',
  PRIMARY KEY (employee_id, skill_id) COMMENT '复合主键',
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE COMMENT '关联员工表，级联删除',
  FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE COMMENT '关联技能表，级联删除'
);

-- 排班表 - 存储排班计划
CREATE TABLE IF NOT EXISTS schedules (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '排班ID，自增主键',
  store_id INT NOT NULL COMMENT '门店ID，关联stores表',
  start_date DATE NOT NULL COMMENT '排班开始日期',
  end_date DATE NOT NULL COMMENT '排班结束日期',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' COMMENT '状态(draft/published/archived)',
  created_by INT COMMENT '创建人ID，关联users表',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE COMMENT '关联门店表，级联删除',
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL COMMENT '关联用户表'
);

-- 班次表 - 定义班次模板
CREATE TABLE IF NOT EXISTS shifts (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '班次ID，自增主键',
  store_id INT NOT NULL COMMENT '门店ID，关联stores表',
  day INT NOT NULL COMMENT '0-6 表示周一到周日',
  start_time TIME NOT NULL COMMENT '班次开始时间',
  end_time TIME NOT NULL COMMENT '班次结束时间',
  status VARCHAR(20) DEFAULT 'open' COMMENT '状态(open/closed)',
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE COMMENT '关联门店表，级联删除'
);

-- 班次职位需求表 - 定义每个班次需要的职位和人数
CREATE TABLE IF NOT EXISTS shift_positions (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '需求ID，自增主键',
  shift_id INT NOT NULL COMMENT '班次ID，关联shifts表',
  position VARCHAR(50) NOT NULL COMMENT '职位名称',
  count INT NOT NULL DEFAULT 1 COMMENT '需求人数',
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE COMMENT '关联班次表，级联删除'
);

-- 班次分配表 - 记录员工班次分配情况
CREATE TABLE IF NOT EXISTS shift_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '分配ID，自增主键',
  schedule_id INT NOT NULL COMMENT '排班ID，关联schedules表',
  shift_id INT NOT NULL COMMENT '班次ID，关联shifts表',
  employee_id INT NOT NULL COMMENT '员工ID，关联employees表',
  position VARCHAR(50) NOT NULL COMMENT '分配的职位',
  assigned_by INT COMMENT '分配人ID，关联users表',
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  override_reason TEXT COMMENT '特殊分配原因',
  FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE COMMENT '关联排班表，级联删除',
  FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE CASCADE COMMENT '关联班次表，级联删除',
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE COMMENT '关联员工表，级联删除',
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL COMMENT '关联用户表'
);

-- 初始化基础数据 - 预置系统必需的技能类型
INSERT INTO skills (name) VALUES 
  ('收银') COMMENT '收银员技能',
  ('导购') COMMENT '商品导购技能',
  ('库房') COMMENT '库存管理技能'
ON DUPLICATE KEY UPDATE name = VALUES(name);