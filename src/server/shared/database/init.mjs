import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.mjs';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 初始化数据库表结构
 * 读取SQL脚本并执行
 */
async function initDatabase() {
  try {
    console.log('开始检查数据库表结构...');
    
    // 读取SQL脚本文件
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'init_db.sql'), 
      'utf8'
    );
    
    // 分割SQL语句，处理多行SQL语句
    const statements = [];
    let currentStatement = '';
    
    // 按行分割SQL脚本
    const lines = sqlScript.split('\n');
    for (const line of lines) {
      // 跳过注释行和空行
      const trimmedLine = line.trim();
      if (trimmedLine === '' || trimmedLine.startsWith('--')) {
        continue;
      }
      
      currentStatement += line + ' ';
      
      // 如果行以分号结尾，则认为是一个完整的SQL语句
      if (trimmedLine.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }
    
    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement.trim() !== '') {
        await pool.query(statement);
      }
    }
    
    console.log('数据库表结构检查完成');
    return true;
  } catch (error) {
    console.error('初始化数据库失败:', error);
    return false;
  }
}

/**
 * 设置数据库
 * 测试连接并初始化表结构
 */
async function setupDatabase() {
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

export { setupDatabase, initDatabase };