import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
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
    component: () => import('@/views/EmployeePreferences.vue'),
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
    path: '/roster',
    name: 'RosterView',
    component: () => import('@/views/roster/RosterView.vue'),
    meta: { title: '排班表', requiresAuth: true },
    children: [
      {
        path: 'day',
        name: 'DayView',
        component: () => import('@/views/roster/DayView.vue'),
        meta: { title: '日视图', requiresAuth: true },
      },
      {
        path: 'week',
        name: 'WeekView',
        component: () => import('@/views/roster/WeekView.vue'),
        meta: { title: '周视图', requiresAuth: true },
      },
    ],
  },
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 全局前置守卫
router.beforeEach((to, _from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '智能排班系统'} - SmartRoster`
  
  // 检查路由是否需要鉴权
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录则重定向到登录页
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
    
    // 检查token有效性（示例逻辑，实际项目中需要根据后端实现调整）
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) {
        // token已过期
        localStorage.removeItem('token')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    } catch (e) {
      // token无效
      localStorage.removeItem('token')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

export default router
