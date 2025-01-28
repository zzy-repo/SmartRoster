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
      class="m-r-2 bg-white shadow shadow-blueGray w-[210px] transition-width duration-300"
  >
    <header class="m-b-3 flex flex-col items-center justify-between p-x-3">
      <a href="#" class="flex flex-row items-center no-underline">
        <Plan theme="outline" size="40" fill="#333"/>
        <p v-if="!isCollapsed" class="ml-3 text-lg text-gray-700 font-bold">SmartRoster 智能排班系统</p>
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
