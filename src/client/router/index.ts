import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 定义路由
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/stores',
    name: 'StoreManagement',
    component: () => import('@/views/store/StoreManagement.vue'),
    meta: { title: '门店管理' }
  },
  {
    path: '/employees',
    name: 'EmployeeManagement',
    component: () => import('@/views/employee/EmployeeManagement.vue'),
    meta: { title: '员工管理' }
  },
  {
    path: '/rules',
    name: 'RuleManagement',
    component: () => import('@/views/rule/RuleManagement.vue'),
    meta: { title: '排班规则' }
  },
  {
    path: '/forecast',
    name: 'BusinessForecast',
    component: () => import('@/views/forecast/BusinessForecast.vue'),
    meta: { title: '业务预测' }
  },
  {
    path: '/roster',
    name: 'RosterView',
    component: () => import('@/views/roster/RosterView.vue'),
    meta: { title: '排班表' },
    children: [
      {
        path: 'day',
        name: 'DayView',
        component: () => import('@/views/roster/DayView.vue'),
        meta: { title: '日视图' }
      },
      {
        path: 'week',
        name: 'WeekView',
        component: () => import('@/views/roster/WeekView.vue'),
        meta: { title: '周视图' }
      }
    ]
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 全局前置守卫
router.beforeEach((to, _, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || '智能排班系统'} - SmartRoster`
  next()
})

export default router