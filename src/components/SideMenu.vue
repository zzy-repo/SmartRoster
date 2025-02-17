<script setup lang="ts">
import type {Component} from "vue";

interface MenuItems {
  name: string
  link: string
  icon: Component
  Children?: MenuItems[]
}

const props = defineProps<{
  menuData: MenuItems[]
  isCollapsed: boolean
}>()

const { menuData, isCollapsed } = props
</script>

<template>
  <ul class="flex flex-col items-center">
    <li class="w-90% h-8">菜单</li>
    <li
      v-for="(item, index) in menuData" :key="index"
      class="rounded-md w-90% h-8 flex items-center justify-center hover:bg-#f1f5fa group transition-all transition-duration-300 active:scale-80"
    >
      <a
        class="w-full h-full no-underline flex items-center justify-start"
        :href="item.link"
      >
        <component
          :is="item.icon" class="flex items-center m-r-[3px]" theme="outline" size="20" fill="#333"
          stroke-linecap="square"
        />
        <p
          v-if="!isCollapsed"
          class="text-sm flex justify-center color-#333 group-hover:color-#0065ff"
        >
          {{ item.name }}
        </p>
      </a>
    </li>
  </ul>
</template>

<style scoped>

</style>
