import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../components/Layout.vue'),
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

  {
    path: '/profile',
    component: () => import('../views/Profile.vue'),
  },
  {
    path: '/login',
    component: () => import('../components/Login.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;