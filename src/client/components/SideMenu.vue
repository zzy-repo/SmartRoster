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
      <el-sub-menu :index="item.id">
        <template #title>
          <span>{{ item.label }}</span>
        </template>
        <template v-for="child in item.children" :key="child.id">
          <el-menu-item :index="child.id">{{ child.label }}</el-menu-item>
        </template>
      </el-sub-menu>
    </template>
  </el-menu>
</template>

<style scoped>
/* You can add more custom styles here */
</style>