<script setup lang="ts">
import { Github } from '@icon-park/vue-next'
// defineProps<{
//   toggleSidebar: () => void
// }>()
</script>

<template>
  <nav class="h-10 p-x-5 flex flex-items-center flex-justify-between bg-[#fafafa]">
    <div class="right">
      <!--      <button @click="toggleSidebar"> -->
      <!--        ☰ -->
      <!--      </button> -->
    </div>
    <div class="left flex">
      <a
        class="transition-all duration-250 hover:scale-110"
        href="https://github.com/zzy-repo/SmartRoster"
        target="_blank"
      >
        <Github theme="outline" size="27" fill="#333" />
      </a>
      <div class="userInfo ml-2 flex flex-items-center">
        <img
          class="rounded-full w-[27px] h-[27px] b-1 b-solid b-gray-300 transition-all duration-250 hover:scale-110"
          src="https://gitee.com/zzy2401/picbed/raw/master/images/小熊猫-白底.jpg"
          alt="头像"
        >
        <p>zzy</p>
      </div>
    </div>
  </nav>
</template>

<style scoped>

</style>
