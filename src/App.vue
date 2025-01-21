<script setup lang="ts">
import NavBar from "./components/NavBar.vue";
import SideBar from "./components/SideBar.vue";
import MainContent from "./components/MainContent.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <div class="flex w-full min-h-screen bg-[#f0f2f5]">
    <SideBar></SideBar>
    <div class="grow flex flex-row">
      <div class="grow flex flex-col">
        <NavBar></NavBar>
        <MainContent></MainContent>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
