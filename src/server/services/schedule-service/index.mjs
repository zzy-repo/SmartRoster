import express from 'express';
import { config } from '../../config/index.mjs';
import scheduleController from './controllers/schedule.controller.mjs';
import authMiddleware from '../../shared/middleware/auth.middleware.mjs';

const app = express();
const PORT = config.services.schedule.port;

// 中间件
app.use(express.json());

// 路由
app.get('/schedules', authMiddleware, scheduleController.getSchedules);
app.get('/schedules/:id', authMiddleware, scheduleController.getScheduleById);
app.post('/schedules/generate', authMiddleware, scheduleController.generateSchedule);
app.put('/schedules/:id', authMiddleware, scheduleController.updateSchedule);
app.post('/shifts/assign', authMiddleware, scheduleController.assignShift);

// 启动服务
app.listen(PORT, () => {
  console.log(`排班服务运行在端口 ${PORT}`);
});

export default app;