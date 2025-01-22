<script setup lang="ts">
import {Plan} from '@icon-park/vue-next'
import {ref} from 'vue'

const isCollapsed = ref(false)

function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}

const items = [1, 2, 3, 4, 5]
</script>

<template>
  <aside
      :class="[{ 'w-[50px]': isCollapsed }]"
      class="m-r-2 bg-white shadow shadow-blueGray w-[210px] transition-width duration-300"
  >
    <header class="flex flex-col flex-items-center flex-justify-between p-x-3">
      <a href="#" class="flex flex-row flex-items-center no-underline">
        <Plan theme="outline" size="40" fill="#333"/>
        <p v-if="!isCollapsed" class="ml-3 text-lg text-gray-700 font-bold">SmartRoster 智能排班系统</p>
      </a>
      <button @click="toggleSidebar">
        ☰
      </button>
    </header>
    <ur class="flex flex-col flex-items-center">
      <li v-for="item in items"
          class="rounded-lg w-90% h-10 flex flex-items-center flex-justify-center hover:bg-#f1f5fa group transition-all transition-duration-300 active:scale-80">
        <a class="w-full h-full no-underline color-black group-hover:color-#0065ff flex flex-items-center flex-justify-center"
           v-if="!isCollapsed" href="#">标签{{ item }}</a>
      </li>
    </ur>
  </aside>
</template>

<style scoped>
</style>
