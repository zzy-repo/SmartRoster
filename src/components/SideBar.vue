<script setup lang="ts">
import {Home, Me, MouseOne, Plan, Setting} from '@icon-park/vue-next'
import {ref} from 'vue'
import SideMenu from "./SideMenu.vue";

const isCollapsed = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

const menuData = [
  {
    name: '首页',
    icon: Home,
    link: '#',
    children: [],
  },
  {
    name: '我的排班',
    icon: Me,
    link: '#',
    children: [],
  },
  {
    name: '排班管理',
    icon: MouseOne,
    link: '#',
    children: [],
  },
  {
    name: '系统设置',
    icon: Setting,
    link: '#',
    children: [],
  },
]
</script>

<template>
  <aside
      :class="[{ 'w-[80px]': isCollapsed }]"
      class="bg-white w-[260px] transition-width duration-300"
  >
    <header class="p-3 w-full">
      <a href="#" class="flex flex-row items-center justify-between no-underline">
        <div class="flex flex-row items-center">
          <Plan theme="outline" size="25" fill="#333"/>
          <p v-if="!isCollapsed" class="m-x-1 text-sm text-gray-700 font-bold">SmartRoster</p>
        </div>
        <button @click="toggleSidebar">
          ☰
        </button>
      </a>
    </header>
    <SideMenu :menuData="menuData" :isCollapsed="isCollapsed"/>
  </aside>
</template>

<style scoped>
</style>
