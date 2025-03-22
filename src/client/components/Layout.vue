<script setup lang="ts">
import { ref } from 'vue';
import SideMenu from './SideMenu.vue';

const activeMenu = ref('1');

const menuItems = [
  {
    id: '1',
    label: '主页',
    children: []
  },
  {
    id: '2',
    label: '我的排班',
    children: [
      { id: '2-1', label: '意向申报' },
      { id: '2-2', label: '排班日历' }
    ]
  },
  {
    id: '3',
    label: '排班管理',
    children: [
      { id: '3-1', label: '流程管理' },
      { id: '3-2', label: '分组管理' }
    ]
  },
  {
    id: '4',
    label: '系统设置',
    children: []
  }
];
</script>

<template>
  <div class="common-layout">
    <el-container style="height: 100vh;">
      <el-header style="background-color: #409EFF; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 20px;">
        <h1 style="font-size: 24px; margin: 0;">SmartRoster</h1>
        <router-link to="/login" style="color: white; text-decoration: none;">登录</router-link>
      </el-header>
      <el-container>
        <el-aside width="200px" style="background-color: #f4f4f4; box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);">
          <!-- 使用 SideMenu 组件 -->
          <SideMenu :menuItems="menuItems" :defaultActive="activeMenu" />
        </el-aside>
        <el-main style="padding: 20px; background-color: #fafafa;">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
/* 可以在这里添加更多自定义样式 */
</style>
