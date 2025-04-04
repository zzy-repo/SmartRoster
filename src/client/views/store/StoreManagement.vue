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
  businessHours?: string
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
  businessHours: '',
})

// 编辑门店表单数据
const editingStore = reactive({
  id: '',
  name: '',
  address: '',
  phone: '',
  businessHours: '',
})

// 加载门店数据
onMounted(async () => {
  try {
    loading.value = true
    await storeStore.fetchStores()
    console.log(storeStore.stores)
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
      area: 0,
      phone: newStore.phone,
      businessHours: newStore.businessHours,
    }

    const response = await storeStore.createStore(storeToAdd)
    stores.value.push(response.data)
    showAddStoreForm.value = false

    // 重置表单
    Object.assign(newStore, {
      name: '',
      address: '',
      phone: '',
      businessHours: '',
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
      businessHours: selectedStore.value.businessHours,
    })
    showEditStoreForm.value = true
  }
}

// 更新门店
async function updateStore() {
  try {
    const response = await storeStore.updateStore(editingStore.id, {
      name: editingStore.name,
      address: editingStore.address,
      area: selectedStore.value?.area || 0,
      phone: editingStore.phone,
      businessHours: editingStore.businessHours,
    } as Store)

    const index = stores.value.findIndex(s => s.id === editingStore.id)
    if (index !== -1) {
      stores.value[index] = response.data
      selectedStore.value = response.data
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
    <h1>门店管理</h1>
    <div class="store-container">
      <!-- 门店列表 -->
      <div class="store-list">
        <div class="store-list-header">
          <h2>门店列表</h2>
          <button class="add-store-btn" @click="showAddStoreForm = true">
            添加门店
          </button>
        </div>
        <div class="store-list-content">
          <div v-if="loading" class="loading">
            加载中...
          </div>
          <div v-else-if="stores.length === 0" class="no-data">
            暂无门店数据
          </div>
          <div v-else class="store-items">
            <div
              v-for="store in stores"
              :key="store.id"
              class="store-item"
              :class="{ active: selectedStore?.id === store.id }"
              @click="selectStore(store)"
            >
              <div class="store-name">
                {{ store.name }}
              </div>
              <div class="store-address">
                {{ store.address }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 门店详情 -->
      <div class="store-detail">
        <div v-if="!selectedStore" class="no-selection">
          <p>请选择一个门店查看详情</p>
        </div>
        <div v-else class="store-info">
          <h2>{{ selectedStore.name }} 详情</h2>
          <div class="info-group">
            <label>门店ID:</label>
            <span>{{ selectedStore.id }}</span>
          </div>
          <div class="info-group">
            <label>门店名称:</label>
            <span>{{ selectedStore.name }}</span>
          </div>
          <div class="info-group">
            <label>门店地址:</label>
            <span>{{ selectedStore.address }}</span>
          </div>
          <div class="info-group">
            <label>联系电话:</label>
            <span>{{ selectedStore.phone }}</span>
          </div>
          <div class="info-group">
            <label>营业时间:</label>
            <span>{{ selectedStore.businessHours }}</span>
          </div>
          <div class="info-group">
            <label>员工数量:</label>
            <span>{{ selectedStore.employeeCount }}</span>
          </div>
          <div class="actions">
            <!-- 在模板中修改编辑按钮 -->
            <button class="edit-btn" @click="prepareEditStore">
              编辑
            </button>
            <button class="delete-btn" @click="confirmDelete = true">
              删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加门店表单 -->
    <div v-if="showAddStoreForm" class="modal">
      <div class="modal-content">
        <h2>添加门店</h2>
        <form @submit.prevent="addStore">
          <div class="form-group">
            <label for="name">门店名称</label>
            <input id="name" v-model="newStore.name" type="text" required>
          </div>
          <div class="form-group">
            <label for="address">门店地址</label>
            <input id="address" v-model="newStore.address" type="text" required>
          </div>
          <div class="form-group">
            <label for="phone">联系电话</label>
            <input id="phone" v-model="newStore.phone" type="text" required>
          </div>
          <div class="form-group">
            <label for="businessHours">营业时间</label>
            <input id="businessHours" v-model="newStore.businessHours" type="text" required>
          </div>
          <div class="form-actions">
            <button type="button" @click="showAddStoreForm = false">
              取消
            </button>
            <button type="submit">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑门店表单 -->
    <div v-if="showEditStoreForm && selectedStore" class="modal">
      <div class="modal-content">
        <h2>编辑门店</h2>
        <form @submit.prevent="updateStore">
          <div class="form-group">
            <label for="edit-name">门店名称</label>
            <input id="edit-name" v-model="editingStore.name" type="text" required>
          </div>
          <div class="form-group">
            <label for="edit-address">门店地址</label>
            <input id="edit-address" v-model="editingStore.address" type="text" required>
          </div>
          <div class="form-group">
            <label for="edit-phone">联系电话</label>
            <input id="edit-phone" v-model="editingStore.phone" type="text" required>
          </div>
          <div class="form-group">
            <label for="edit-businessHours">营业时间</label>
            <input id="edit-businessHours" v-model="editingStore.businessHours" type="text" required>
          </div>
          <div class="form-actions">
            <button type="button" @click="showEditStoreForm = false">
              取消
            </button>
            <button type="submit">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="confirmDelete && selectedStore" class="modal">
      <div class="modal-content confirm-dialog">
        <h2>确认删除</h2>
        <p>您确定要删除门店 "{{ selectedStore.name }}" 吗？此操作不可撤销。</p>
        <div class="form-actions">
          <button type="button" @click="confirmDelete = false">
            取消
          </button>
          <button type="button" class="delete-btn" @click="deleteStore">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.store-management {
  padding: 20px;
}

.store-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.store-list {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.store-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.store-list-header h2 {
  margin: 0;
  font-size: 18px;
}

.add-store-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.store-list-content {
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.loading, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.store-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.store-item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.store-item:hover {
  background-color: #f9f9f9;
}

.store-item.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.store-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.store-address {
  color: #666;
  font-size: 14px;
}

.store-detail {
  flex: 2;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 20px;
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #666;
}

.store-info h2 {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.info-group {
  margin-bottom: 15px;
  display: flex;
}

.info-group label {
  width: 100px;
  font-weight: bold;
  color: #555;
}

.actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}

.edit-btn, .delete-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #2196f3;
  color: white;
}

.delete-btn {
  background-color: #f44336;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  width: 500px;
  max-width: 90%;
}

.modal-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.form-actions button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="button"] {
  background-color: #f5f5f5;
  color: #333;
}

.form-actions button[type="submit"] {
  background-color: #4caf50;
  color: white;
}

.confirm-dialog {
  text-align: center;
}

.confirm-dialog p {
  margin-bottom: 20px;
}
</style>
