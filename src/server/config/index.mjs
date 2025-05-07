// 系统配置文件，包含服务端口、数据库、JWT等配置信息

// 检查是否获取到MYSQL_PASSWORD环境变量
if (!process.env.MYSQL_PASSWORD) {
  throw new Error('未检测到系统环境变量 MYSQL_PASSWORD，请先设置数据库密码环境变量！')
}

export const config = {
  gateway: {
    port: 3000, // API 网关端口
  },
  services: {
    auth: {
      name: 'auth-service', // 认证服务
      port: 3001,          // 认证服务端口
    },
    store: {
      name: 'store-service', // 门店服务
      port: 3002,           // 门店服务端口
    },
    employee: {
      name: 'employee-service', // 员工服务
      port: 3003,               // 员工服务端口
    },
    schedule: {
      name: 'schedules-service', // 排班服务
      port: 3004,                // 排班服务端口
    },
  },
  database: {
    host: 'localhost', // 数据库地址
    user: 'root',      // 数据库用户名
    password: process.env.MYSQL_PASSWORD, // 数据库密码，从系统环境变量 MYSQL_PASSWORD 读取
    database: 'smartroster', // 数据库名
    port: 3306,        // 数据库端口
  },
  jwt: {
    secret: 'your-secret-key', // JWT 密钥
    expiresIn: '24h',          // JWT 有效期
  },
}
