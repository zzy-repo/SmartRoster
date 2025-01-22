<script setup lang="ts">
import {Plan, Home, Me, Setting, MouseOne} from '@icon-park/vue-next'
import {ref} from 'vue'

const isCollapsed = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

const items = [
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
    <header class="m-b-3 flex flex-col flex-items-center flex-justify-between p-x-3">
      <a href="#" class="flex flex-row flex-items-center no-underline">
        <Plan theme="outline" size="40" fill="#333"/>
        <p v-if="!isCollapsed" class="ml-3 text-lg text-gray-700 font-bold">SmartRoster 智能排班系统</p>
      </a>
      <button @click="toggleSidebar">
        ☰
      </button>
    </header>
    <ur class="flex flex-col flex-items-center">
      <li v-for="(item,index) in items" :key="index"
          class="rounded-lg w-90% h-10 flex flex-items-center flex-justify-center hover:bg-#f1f5fa group transition-all transition-duration-300 active:scale-80">
        <a class="w-full h-full no-underline   flex flex-items-center flex-justify-center"
           href="#">
          <component class="flex flex-items-center" :is="item.icon" theme="outline" size="30" fill="#333"
                     strokeLinecap="square"/>
          <p v-if="!isCollapsed"
             class="font-300 w-60% flex flex-justify-center color-#333 group-hover:color-#0065ff">
            {{ item.name }}
          </p>
        </a>
      </li>
    </ur>
  </aside>
</template>

<style scoped>
</style>
