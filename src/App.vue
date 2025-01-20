<script setup lang="ts">
import NavBar from "./components/NavBar.vue";
import SideBar from "./components/SideBar.vue";
import MainContent from "./components/MainContent.vue";
import Footer from "./components/Footer.vue";
</script>

<template>
  <div class="flex flex-col w-full  min-h-screen">
    <NavBar></NavBar>
    <div class="grow flex flex-row">
      <SideBar></SideBar>
      <div class="grow flex flex-col">
        <MainContent></MainContent>
        <Footer></Footer>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
