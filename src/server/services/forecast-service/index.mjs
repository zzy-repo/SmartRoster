import express from 'express';
import { config } from '../../config/index.mjs';

const app = express();
const PORT = process.env.FORECAST_SERVICE_PORT || 3005;

// 中间件
app.use(express.json());

// 简单路由
app.get('/', (req, res) => {
  res.json({ message: '预测服务运行正常' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`预测服务运行在端口 ${PORT}`);
});

export default app;