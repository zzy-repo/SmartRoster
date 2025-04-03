import express from 'express';
import { config } from '../../config/index.mjs';
import authController from './controllers/auth.controller.mjs';

const app = express();
const PORT = config.services.auth.port;

// 中间件
app.use(express.json());

// 路由
app.post('/login', authController.login);
app.post('/register', authController.register);
app.post('/verify', authController.verifyToken);

// 启动服务
app.listen(PORT, () => {
  console.log(`认证服务运行在端口 ${PORT}`);
});

export default app;