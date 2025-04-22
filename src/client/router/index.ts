import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/scheduleView',
    name: 'Schedules',
    component: () => import('@/views/schedulesView/SchedulesView.vue'),
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册' },
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: true },
  },
  {
    path: '/stores',
    name: 'StoreManagement',
    component: () => import('@/views/store/StoreManagement.vue'),
    meta: { title: '门店管理', requiresAuth: true },
  },
  {
    path: '/employees',
    name: 'EmployeeManagement',
    component: () => import('@/views/employee/EmployeeManagement.vue'),
    meta: { title: '员工管理', requiresAuth: true },
  },
  {
    path: '/employees/:id/preferences',
    component: () => import('@/views/employee/EmployeePreferences.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/rules',
    name: 'RuleManagement',
    component: () => import('@/views/rule/RuleManagement.vue'),
    meta: { title: '排班规则', requiresAuth: true },
  },
  {
    path: '/forecast',
    name: 'BusinessForecast',
    component: () => import('@/views/forecast/BusinessForecast.vue'),
    meta: { title: '业务预测', requiresAuth: true },
  },
  {
    path: '/scheduleManagement',
    name: 'ScheduleManagement',
    component: () => import('@/views/schedulesManagement/ScheduleManagement.vue'),
    meta: { title: '排班管理', requiresAuth: true },
  },
  {
    path: '/scheduleManagement/shifts/:scheduleId/:storeId',
    name: 'ShiftManagement',
    component: () => import('@/views/schedulesManagement/ShiftManagement.vue'),
    meta: { title: '班次管理', requiresAuth: true },
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  }
  else if (to.meta.requiresAdmin && authStore.user?.role !== 'admin') {
    next({ name: 'Home' })
  }
  else {
    next()
  }
})

router.afterEach((to) => {
  if (to.meta.requiresAdmin) {
    const authStore = useAuthStore()
    if (authStore.user?.role !== 'admin') {
      router.push('/')
    }
  }
})

export default router
