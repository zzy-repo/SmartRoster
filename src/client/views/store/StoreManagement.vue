<script setup lang="ts">
import { useStoreStore } from '@/stores/storeStore'
import { onMounted, reactive, ref } from 'vue'

// 定义门店类型
interface Store {
  id: string
  name: string
  address: string
  area: number
  phone?: string
  employeeCount?: number
}

// 获取 store 实例
const storeStore = useStoreStore()

// 状态
const stores = ref<Store[]>([])
const selectedStore = ref<Store | null>(null)
const loading = ref(true)
const showAddStoreForm = ref(false)
const showEditStoreForm = ref(false)
const confirmDelete = ref(false)

// 新门店表单数据
const newStore = reactive({
  name: '',
  address: '',
  phone: '',
  area: 0,
})

// 编辑门店表单数据
const editingStore = reactive({
  id: '',
  name: '',
  address: '',
  phone: '',
  area: 0,
})

// 加载门店数据
onMounted(async () => {
  try {
    loading.value = true
    await storeStore.fetchStores()
    stores.value = storeStore.stores
  }
  catch (error) {
    console.error('加载门店数据失败', error)
  }
  finally {
    loading.value = false
  }
})

// 添加门店
async function addStore() {
  try {
    const storeToAdd = {
      name: newStore.name,
      address: newStore.address,
      area: newStore.area,
      phone: newStore.phone,
    }
    await storeStore.createStore(storeToAdd)
    // 更新本地stores列表
    stores.value = storeStore.stores
    showAddStoreForm.value = false
    // 重置表单
    Object.assign(newStore, {
      name: '',
      address: '',
      phone: '',
      area: 0,
    })
  }
  catch (error) {
    console.error('添加门店失败', error)
  }
}

// 选择门店
function selectStore(store: Store) {
  selectedStore.value = store
}

// 准备编辑门店
function prepareEditStore() {
  if (selectedStore.value) {
    Object.assign(editingStore, {
      id: selectedStore.value.id,
      name: selectedStore.value.name,
      address: selectedStore.value.address,
      area: selectedStore.value.area,
      phone: selectedStore.value.phone,

    })
    showEditStoreForm.value = true
  }
}

// 更新门店
async function updateStore() {
  try {
    const { data } = await storeStore.updateStore(editingStore.id, {
      name: editingStore.name,
      address: editingStore.address,
      area: editingStore.area, // 使用 editingStore 中的 area
      phone: editingStore.phone,
    } as Partial<Store>) // 使用 Partial<Store> 因为 employeeCount 不在此处更新

    const index = stores.value.findIndex(s => s.id === editingStore.id)
    if (index !== -1) {
      stores.value[index] = data
      selectedStore.value = data
      showEditStoreForm.value = false
    }
  }
  catch (error) {
    console.error('更新门店失败', error)
  }
}

// 删除门店
async function deleteStore() {
  try {
    if (selectedStore.value) {
      await storeStore.deleteStore(selectedStore.value.id)
      stores.value = stores.value.filter(s => s.id !== selectedStore.value?.id)
      selectedStore.value = null
      confirmDelete.value = false
    }
  }
  catch (error) {
    console.error('删除门店失败', error)
  }
}
</script>

<template>
  <div class="store-management">
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h1>门店管理</h1>
        </div>
      </template>
      
      <div class="store-container">
        <!-- 门店列表 -->
        <el-card class="store-list">
          <template #header>
            <div class="store-list-header">
              <h2>门店列表</h2>
              <el-button type="primary" @click="showAddStoreForm = true">
                添加门店
              </el-button>
            </div>
          </template>
          
          <div class="store-list-content">
            <el-skeleton :rows="3" animated v-if="loading" />
            <el-empty v-else-if="stores.length === 0" description="暂无门店数据" />
            <el-scrollbar v-else height="600px">
              <div class="store-items">
                <el-card
                  v-for="store in stores"
                  :key="store.id"
                  class="store-item"
                  :class="{ active: selectedStore?.id === store.id }"
                  @click="selectStore(store)"
                  shadow="hover"
                >
                  <div class="store-name">
                    {{ store.name }}
                  </div>
                  <div class="store-address">
                    {{ store.address }}
                  </div>
                </el-card>
              </div>
            </el-scrollbar>
          </div>
        </el-card>

        <!-- 门店详情 -->
        <el-card class="store-detail">
          <template #header>
            <div class="store-detail-header">
              <h2>{{ selectedStore ? `${selectedStore.name} 详情` : '门店详情' }}</h2>
            </div>
          </template>
          
          <div v-if="!selectedStore" class="no-selection">
            <el-empty description="请选择一个门店查看详情" />
          </div>
          <div v-else class="store-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="门店ID">{{ selectedStore.id }}</el-descriptions-item>
              <el-descriptions-item label="门店名称">{{ selectedStore.name }}</el-descriptions-item>
              <el-descriptions-item label="门店地址">{{ selectedStore.address }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ selectedStore.phone }}</el-descriptions-item>
              <el-descriptions-item label="门店面积">{{ Math.floor(selectedStore.area) }}(m²)</el-descriptions-item>
              <el-descriptions-item label="员工数量">{{ selectedStore.employeeCount }}</el-descriptions-item>
            </el-descriptions>

            <div class="actions">
              <el-button type="primary" @click="prepareEditStore">
                编辑
              </el-button>
              <el-button type="danger" @click="confirmDelete = true">
                删除
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 添加门店表单 -->
    <el-dialog
      v-model="showAddStoreForm"
      title="添加门店"
      width="500px"
    >
      <el-form
        :model="newStore"
        label-width="100px"
        @submit.prevent="addStore"
      >
        <el-form-item label="门店名称" required>
          <el-input v-model="newStore.name" />
        </el-form-item>
        <el-form-item label="门店地址" required>
          <el-input v-model="newStore.address" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="newStore.phone" />
        </el-form-item>
        <el-form-item label="门店面积" required>
          <el-input-number v-model="newStore.area" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddStoreForm = false">取消</el-button>
          <el-button type="primary" @click="addStore">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑门店表单 -->
    <el-dialog
      v-model="showEditStoreForm"
      title="编辑门店"
      width="500px"
    >
      <el-form
        :model="editingStore"
        label-width="100px"
        @submit.prevent="updateStore"
      >
        <el-form-item label="门店名称" required>
          <el-input v-model="editingStore.name" />
        </el-form-item>
        <el-form-item label="门店地址" required>
          <el-input v-model="editingStore.address" />
        </el-form-item>
        <el-form-item label="联系电话" required>
          <el-input v-model="editingStore.phone" />
        </el-form-item>
        <el-form-item label="门店面积" required>
          <el-input-number v-model="editingStore.area" :min="0" :step="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditStoreForm = false">取消</el-button>
          <el-button type="primary" @click="updateStore">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="confirmDelete"
      title="确认删除"
      width="400px"
    >
      <p>您确定要删除门店 "{{ selectedStore?.name }}" 吗？此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDelete = false">取消</el-button>
          <el-button type="danger" @click="deleteStore">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.store-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px);
  min-height: 500px;
}

.store-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.store-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-list-header h2 {
  margin: 0;
  font-size: 18px;
}

.store-list-content {
  flex: 1;
  overflow: hidden;
  padding: 15px;
}

.store-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.store-item {
  cursor: pointer;
  transition: all 0.2s;
}

.store-item:hover {
  transform: translateY(-2px);
}

.store-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.store-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.store-address {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.store-detail {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.store-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.store-detail-header h2 {
  margin: 0;
  font-size: 18px;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
}

.store-info {
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
