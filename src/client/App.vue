<script setup lang="ts">
import MainContent from './components/MainContent.vue'
import NavBar from './components/NavBar.vue'
import SideBar from './components/SideBar.vue'
</script>

<template>
  <div class="flex w-full min-h-screen bg-[#f0f2f5]">
    <SideBar />
    <div class="grow flex flex-row">
      <div class="grow flex flex-col">
        <NavBar />
        <MainContent />
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
