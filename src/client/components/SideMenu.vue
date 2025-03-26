<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps<{
  menuItems: Array<{
    id: string;
    label: string;
    path: string;
    children?: Array<{
      id: string;
      label: string;
      path: string;
    }>;
  }>;
  defaultActive: string;
}>();

const activeMenu = ref(props.defaultActive);

const handleSelect = (index: string) => {
  const item = props.menuItems.find(item => item.id === index) 
    || props.menuItems.flatMap(item => item.children || []).find(child => child.id === index);
  
  if (item?.path) {
    router.push(item.path);
  }
};
</script>

<template>
  <el-menu
    :default-active="activeMenu"
    class="bg-gray-100 text-gray-700"
    mode="vertical"
    @select="handleSelect"
  >
    <template v-for="item in menuItems" :key="item.id">
      <el-sub-menu v-if="item.children?.length" :index="item.id">
        <template #title>
          <span>{{ item.label }}</span>
        </template>
        <el-menu-item v-for="child in item.children" :key="child.id" :index="child.id">
          {{ child.label }}
        </el-menu-item>
      </el-sub-menu>
      
      <el-menu-item v-else :index="item.id">
        <span>{{ item.label }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<style scoped>
/* You can add more custom styles here */
</style>