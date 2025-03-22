<script setup lang="ts">
import { ref } from 'vue';
import SideMenu from './components/SideMenu.vue';

const activeMenu = ref('1');

const menuItems = [
  {
    id: '1',
    label: '菜单1',
    children: [
      { id: '1-1', label: '子菜单1-1' },
      { id: '1-2', label: '子菜单1-2' }
    ]
  },
  {
    id: '2',
    label: '菜单2',
    children: [
      { id: '2-1', label: '子菜单2-1' },
      { id: '2-2', label: '子菜单2-2' }
    ]
  }
];
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header>Header</el-header>
      <el-container>
        <el-aside width="200px">
          <!-- 使用 SideMenu 组件 -->
          <SideMenu :menuItems="menuItems" :defaultActive="activeMenu" />
        </el-aside>
        <el-main>Main</el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
/* 可以在这里添加更多自定义样式 */
</style>
