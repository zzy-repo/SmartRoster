<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import SideMenu from './SideMenu.vue'

const router = useRouter()
const userStore = useUserStore()

// 根据用户角色计算菜单项
const menuItems = computed(() => {
  const baseMenuItems = [
    {
      id: '1',
      label: '主页',
      path: '/',
      children: [],
    }
  ]
  
  // 员工可见菜单
  if (userStore.userInfo?.role === 'employee') {
    baseMenuItems.push({
      id: '2',
      label: '我的排班',
      path: '/schedule',
      children: [
        { id: '2-1', label: '意向申报', path: '/schedule/preference' },
        { id: '2-2', label: '排班日历', path: '/schedule/calendar' },
      ],
    })
  }
  
  // 排班管理员可见菜单
  if (userStore.userInfo?.role === 'scheduler') {
    baseMenuItems.push({
      id: '3',
      label: '排班管理',
      path: '/management',
      children: [
        { id: '3-1', label: '流程管理', path: '/management/process' },
        { id: '3-2', label: '分组管理', path: '/management/group' },
      ],
    })
  }
  
  // 所有角色都可见的系统设置
  baseMenuItems.push({
    id: '4',
    label: '系统设置',
    path: '/settings',
    children: [],
  })
  
  return baseMenuItems
})

// 添加退出登录方法
function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="common-layout">
    <el-container style="height: 100vh;">
      <el-header style="background-color: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
        <h1 style="font-size: 24px; margin: 0;">
          SmartRoster
        </h1>
        <div class="header-right">
          <router-link to="/profile" style="color: white; text-decoration: none; margin-right: 20px;">
            个人信息
          </router-link>
          <a style="color: white; text-decoration: none; cursor: pointer;" @click="logout">退出登录</a>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <SideMenu :menu-items="menuItems" />
        </el-aside>
        <el-main>
          <!-- 确保这里有 router-view 来显示子路由内容 -->
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.header-right {
  display: flex;
  align-items: center;
}
</style>
