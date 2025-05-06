import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  console.log(`创建日志目录: ${logDir}`);
  fs.mkdirSync(logDir, { recursive: true });
}

// 生成基于时间的日志文件名
const getLogFileName = (type) => {
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${type}-${dateStr}.log`;
};

// 创建logger实例
const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, getLogFileName('error')),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(logDir, getLogFileName('combined')),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// 如果不是生产环境，同时输出到控制台
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// 记录初始化信息
logger.info('日志系统初始化完成', { 
  logDir,
  errorLogFile: getLogFileName('error'),
  combinedLogFile: getLogFileName('combined')
});

// 导出logger实例
export default logger;

// 导出便捷方法
export const logInfo = (message, meta) => logger.info(message, meta);
export const logError = (message, meta) => logger.error(message, meta);
export const logWarn = (message, meta) => logger.warn(message, meta);
export const logDebug = (message, meta) => logger.debug(message, meta); 