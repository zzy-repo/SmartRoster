import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/login',
    component: () => import('../components/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    component: () => import('../components/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('../views/Home.vue'),
      },
      {
        path: 'schedule/preference',
        component: () => import('../views/schedule/Preference.vue'),
      },
      {
        path: 'schedule/calendar',
        component: () => import('../views/schedule/Calendar.vue'),
      },
      {
        path: 'management/process',
        component: () => import('../views/management/Process.vue'),
      },
      {
        path: 'management/group',
        component: () => import('../views/management/Group.vue'),
      },
      {
        path: 'settings',
        component: () => import('../views/Settings.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 需要登录但未登录，重定向到登录页
    next('/login')
  }
  else if (userStore.isLoggedIn && (to.path === '/login' || to.path === '/register')) {
    // 已登录用户访问登录或注册页，重定向到首页
    next('/')
  }
  else {
    next()
  }
})

export default router
