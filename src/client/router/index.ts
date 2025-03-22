import { createRouter, createWebHistory } from 'vue-router';
import Layout from '../components/Layout.vue';

const routes = [
  {
    path: '/',
    component: Layout,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;