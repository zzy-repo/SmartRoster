import { logInfo, logError, logWarn, logDebug } from './logger.mjs';

// 示例：记录不同级别的日志
logInfo('这是一条信息日志', { userId: 123, action: 'login' });
logError('这是一条错误日志', { error: new Error('测试错误'), userId: 123 });
logWarn('这是一条警告日志', { warning: '磁盘空间不足' });
logDebug('这是一条调试日志', { debugInfo: '变量值: 42' }); 