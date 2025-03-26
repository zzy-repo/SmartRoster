<script setup lang="ts">
import { ref } from 'vue'
import SideMenu from './SideMenu.vue'

const activeMenu = ref('1')

const menuItems = [
  {
    id: '1',
    label: '主页',
    path: '/',
    children: [],
  },
  {
    id: '2',
    label: '我的排班',
    path: '/schedule',
    children: [
      { id: '2-1', label: '意向申报', path: '/schedule/preference' },
      { id: '2-2', label: '排班日历', path: '/schedule/calendar' },
    ],
  },
  {
    id: '3',
    label: '排班管理',
    path: '/management',
    children: [
      { id: '3-1', label: '流程管理', path: '/management/process' },
      { id: '3-2', label: '分组管理', path: '/management/group' },
    ],
  },
  {
    id: '4',
    label: '系统设置',
    path: '/settings',
    children: [],
  },
]
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
          <router-link to="/login" style="color: white; text-decoration: none;">
            登录
          </router-link>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background-color: #f4f4f4; box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);">
          <!-- 使用 SideMenu 组件 -->
          <SideMenu :menu-items="menuItems" :default-active="activeMenu" />
        </el-aside>
        <el-main style="padding: 20px; background-color: #fafafa;">
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
