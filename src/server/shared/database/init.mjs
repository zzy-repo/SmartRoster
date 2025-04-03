import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化数据库
 * 检查并创建缺失的表格
 */
export async function initDatabase() {
  try {
    console.log('开始检查数据库表结构...');
    
    // 读取SQL脚本文件
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'init_db.sql'), 
      'utf8'
    );
    
    // 分割SQL语句
    const statements = sqlScript
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // 执行每个SQL语句
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('数据库表结构检查完成');
    return true;
  } catch (error) {
    console.error('初始化数据库失败:', error);
    return false;
  }
}

/**
 * 检查数据库连接并初始化表结构
 */
export async function setupDatabase() {
  try {
    // 测试数据库连接
    const connection = await pool.getConnection();
    console.log('数据库连接成功');
    connection.release();
    
    // 初始化数据库表结构
    await initDatabase();
    
    return true;
  } catch (error) {
    console.error('数据库设置失败:', error);
    return false;
  }
}