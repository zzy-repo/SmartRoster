import express from 'express';
import { config } from '../../config/index.mjs';
import { setupDatabase } from '../../shared/database/init.mjs';

const app = express();
const PORT = process.env.EMPLOYEE_SERVICE_PORT || 3003;

// 中间件
app.use(express.json());

// 初始化数据库
setupDatabase()
  .then(success => {
    if (success) {
      console.log('数据库初始化成功');
    } else {
      console.error('数据库初始化失败，服务可能无法正常工作');
    }
  })
  .catch(err => {
    console.error('数据库初始化过程中发生错误:', err);
  });

// 简单路由
app.get('/', (req, res) => {
  res.json({ message: '员工服务运行正常' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`员工服务运行在端口 ${PORT}`);
});

export default app;