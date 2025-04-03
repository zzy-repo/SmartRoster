import express from 'express';
import cors from 'cors';
import routes from './routes.mjs';
import { config } from '../config/index.mjs';

const app = express();
const PORT = config.gateway.port || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', routes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: '服务器内部错误' });
});

export default app;