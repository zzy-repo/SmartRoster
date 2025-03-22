import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../components/Layout.vue';
import Login from '../components/Login.vue'; // 引入登录组件

const routes = [
  {
    path: '/',
    component: Layout,
  },
  {
    path: '/login',
    component: Login, // 添加登录路由
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;