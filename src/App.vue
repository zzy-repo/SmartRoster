<script setup lang="ts">
import {Plan, Github} from '@icon-park/vue-next'
</script>

<template>
  <div class="flex flex-col w-full  min-h-screen">
    <nav class="h-15 b-b-2 b-b-gray-3 b-b-solid p-x-3 flex flex-items-center flex-justify-between">
      <a href="#" class="flex flex-row flex-items-center no-underline">
        <Plan theme="outline" size="40" fill="#333"/>
        <p class="ml-2 text-xl text-gray-800 font-bold">智能排班系统</p>
      </a>
      <a class="no-underline transition-all duration-250 hover:scale-110" href="https://github.com/zzy-repo/SmartRoster"
         target="_blank">
        <Github theme="outline" size="30" fill="#333"/>
      </a>
    </nav>
    <div class="grow flex flex-row">
      <aside class="w-30 b-r-2 b-r-gray-3 b-r-solid">
        这是侧边栏
      </aside>
      <div class="grow flex flex-col">
        <main class="grow b-b-2 b-b-gray-3 b-b-solid">
          这是主模块
        </main>
        <footer class="h-15">
          这是底部
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
