<script setup lang="ts">
import {ref} from 'vue';
import {Plan} from "@icon-park/vue-next";

const isCollapsed = ref(false);

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value;
};
</script>

<template>
  <aside
      :class="['w-[200px] transition-width duration-300', { 'w-[50px]': isCollapsed }]"
      class="b-r-2 b-r-gray-3 b-r-solid"
  >
    <header class="flex flex-col flex-items-center flex-justify-between p-x-3">
      <a href="#" class="flex flex-row flex-items-center no-underline">
        <Plan theme="outline" size="40" fill="#333"/>
        <p v-if="!isCollapsed" class="ml-3 text-lg text-gray-700 font-bold">SmartRoster 智能排班系统</p>
      </a>
      <button @click="toggleSidebar">☰</button>
    </header>
    <ur>
      <li><a v-if="!isCollapsed" href="#">选项1</a></li>
      <li><a v-if="!isCollapsed" href="#">选项2</a></li>
      <li><a v-if="!isCollapsed" href="#">选项3</a></li>
      <li><a v-if="!isCollapsed" href="#">选项4</a></li>
      <li><a v-if="!isCollapsed" href="#">选项5</a></li>
    </ur>
  </aside>
</template>

<style scoped>
</style>