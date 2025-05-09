<script setup lang="ts">
import { useAuthStore } from '@/stores/authStore'
import { ElMessage } from 'element-plus'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const activeIndex = ref(route.path)

watch(() => route.path, (newPath) => {
  activeIndex.value = newPath
})

function handleSelect(key: string) {
  router.push(key)
}

async function handleLogout() {
  try {
    await authStore.clearUser()
    ElMessage.success('退出登录')
    router.push('/login')
  }
  catch (error) {
    ElMessage.error('退出登录失败')
  }
}
</script>

<template>
  <div class="app-container">
    <el-container>
      <el-header v-if="$route.path !== '/login' && $route.path !== '/register'" height="60px">
        <div class="header-content">
          <div class="logo">
            <h1>SmartRoster</h1>
          </div>
          <el-menu
            :default-active="activeIndex"
            class="main-menu"
            mode="horizontal"
            router
            @select="handleSelect"
          >
            <el-menu-item index="/">
              首页
            </el-menu-item>
            <el-menu-item index="/stores">
              门店管理
            </el-menu-item>
            <el-menu-item index="/employees">
              员工管理
            </el-menu-item>
            <el-menu-item index="/rules">
              排班规则
            </el-menu-item>
            <el-menu-item index="/scheduleManagement">
              排班管理
            </el-menu-item>
            <el-menu-item index="/scheduleView">
              排班展示
            </el-menu-item>
            <el-menu-item index="/logout" @click="handleLogout">
              退出登录
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>

      <el-main>
        <router-view />
      </el-main>

      <el-footer height="50px">
        <div class="footer-content">
          <p>© {{ new Date().getFullYear() }} SmartRoster - 智能排班系统</p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<style scoped>
.app-container {
  height: 100vh;
  width: 100%;
}

.el-container {
  height: 100%;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #ebeef5;
  padding: 0;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo {
  margin-right: 40px;
}

.logo h1 {
  margin: 0;
  font-size: 24px;
  color: #409EFF;
}

.main-menu {
  flex: 1;
}

.el-main {
  padding: 20px;
  background-color: #f5f7fa;
}

.el-footer {
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-content {
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
