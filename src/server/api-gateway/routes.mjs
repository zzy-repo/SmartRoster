import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/index.mjs';

const router = express.Router();

// 认证服务路由
router.use('/auth', createProxyMiddleware({
  target: `http://localhost:${config.services.auth.port}`,
  pathRewrite: { '^/api/auth': '' }
}));

// 门店服务路由
router.use('/stores', createProxyMiddleware({
  target: `http://localhost:${config.services.store.port}`,
  pathRewrite: { '^/api/stores': '' }
}));

// 员工服务路由
router.use('/employees', createProxyMiddleware({
  target: `http://localhost:${config.services.employee.port}`,
  pathRewrite: { '^/api/employees': '' }
}));

// 排班服务路由
router.use('/schedules', createProxyMiddleware({
  target: `http://localhost:${config.services.schedule.port}`,
  pathRewrite: { '^/api/schedules': '' }
}));

// 预测服务路由
router.use('/forecasts', createProxyMiddleware({
  target: `http://localhost:${config.services.forecast.port}`,
  pathRewrite: { '^/api/forecasts': '' }
}));

export default router;