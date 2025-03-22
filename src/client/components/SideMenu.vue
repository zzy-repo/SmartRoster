<script setup lang="ts">
import { ref } from 'vue';

// Removed the import of defineProps

// Define props to receive menu data and default active item
const props = defineProps<{
  menuItems: Array<{
    id: string;
    label: string;
    children?: Array<{ id: string; label: string }>;
  }>;
  defaultActive: string;
}>();

const activeMenu = ref(props.defaultActive);
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    class="bg-gray-100 text-gray-700"
    mode="vertical"
  >
    <template v-for="item in menuItems" :key="item.id">
      <!-- 有子菜单时渲染 el-sub-menu -->
      <el-sub-menu v-if="item.children?.length" :index="item.id">
        <template #title>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.id" :index="child.id">
          {{ child.label }}
        </el-menu-item>
      </el-sub-menu>
      
      <!-- 没有子菜单时直接渲染可点击的菜单项 -->
      <el-menu-item v-else :index="item.id">
        <span>{{ item.label }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style scoped>
/* You can add more custom styles here */
</style>