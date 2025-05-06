<script setup lang="ts">
import type { Employee } from '../../types/index'
import { ElMessage } from 'element-plus'
import { onMounted, reactive, ref } from 'vue'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useStoreStore } from '../../stores/storeStore'

// 定义门店类型
interface Store {
  id: string
  name: string
}

// 获取store实例
const employeeStore = useEmployeeStore()
const storeStore = useStoreStore()

// 状态
const employees = ref<Employee[]>([])
const selectedEmployee = ref<Employee | null>(null)
const loading = ref(true)
const showAddEmployeeForm = ref(false)
const showEditEmployeeForm = ref(false)
const confirmDelete = ref(false)
const stores = ref<Store[]>([])

// 新员工表单数据
const newEmployee = reactive({
  name: '',
  position: '',
  phone: '',
  email: '',
  store_id: null,
  user_id: null,
  max_daily_hours: 8,
  max_weekly_hours: 40,
  workday_pref_start: 0,
  workday_pref_end: 6,
  time_pref_start: '08:00:00',
  time_pref_end: '20:00:00',
  created_at: '',
  updated_at: '',
})

// 编辑员工表单数据
const editingEmployee = reactive({
  id: '',
  name: '',
  position: '',
  phone: '',
  email: '',
  store_id: null,
  user_id: null,
  max_daily_hours: 8,
  max_weekly_hours: 40,
  workday_pref_start: 0,
  workday_pref_end: 6,
  time_pref_start: '08:00:00',
  time_pref_end: '20:00:00',
  created_at: '',
  updated_at: '',
})

// 加载员工和门店数据
onMounted(async () => {
  try {
    loading.value = true
    // 使用真实API调用获取数据
    await Promise.all([
      storeStore.fetchStores(),
      employeeStore.fetchEmployees(),
    ])

    // 从store中获取数据
    stores.value = storeStore.stores

    // 将employeeStore中的数据格式转换为当前组件需要的格式
    employees.value = employeeStore.employees.map((emp) => {
      // 创建符合本地Employee接口的对象
      const employee: Employee = { ...emp }

      // 查找门店名称
      const store = stores.value.find(s => s.id === employee.store_id)
      console.log('store_id', employee.store_id)

      if (store) {
        employee.store_name = store.name
      }

      return employee
    })
  }
  catch (error) {
    console.error('加载数据失败', error)
    ElMessage.error('加载员工和门店数据失败')
  }
  finally {
    loading.value = false
  }
})

// 选择员工
function selectEmployee(employee: Employee) {
  selectedEmployee.value = employee
}

// 添加员工
async function addEmployee() {
  try {
    // 准备API所需的员工数据格式
    const employeeData = {
      name: newEmployee.name,
      position: newEmployee.position,
      phone: newEmployee.phone,
      email: newEmployee.email,
      store_id: newEmployee.store_id,
      max_daily_hours: newEmployee.max_daily_hours,
      max_weekly_hours: newEmployee.max_weekly_hours,
      workday_pref_start: newEmployee.workday_pref_start,
      workday_pref_end: newEmployee.workday_pref_end,
      time_pref_start: newEmployee.time_pref_start,
      time_pref_end: newEmployee.time_pref_end,
    }
    console.log('employeeData', employeeData)

    // 调用API创建员工
    const response = await employeeStore.createEmployee(employeeData)

    console.log('response', response)

    // 添加到本地列表
    const store_name = stores.value.find(s => s.id === newEmployee.store_id)?.name || ''
    const employeeToAdd: Employee = {
      id: response.data.id,
      name: newEmployee.name,
      position: newEmployee.position,
      store_id: newEmployee.store_id,
      store_name,
      phone: newEmployee.phone,
      email: newEmployee.email,
      max_daily_hours: newEmployee.max_daily_hours,
      max_weekly_hours: newEmployee.max_weekly_hours,
      workday_pref_start: newEmployee.workday_pref_start,
      workday_pref_end: newEmployee.workday_pref_end,
      time_pref_start: newEmployee.time_pref_start,
      time_pref_end: newEmployee.time_pref_end,
    }

    employees.value.push(employeeToAdd)
    showAddEmployeeForm.value = false
    ElMessage.success('员工添加成功')

    // 重置表单
    Object.assign(newEmployee, {
      name: '',
      position: '',
      phone: '',
      email: '',
      store_id: null,
      user_id: null,
      max_daily_hours: 8,
      max_weekly_hours: 40,
      workday_pref_start: 0,
      workday_pref_end: 6,
      time_pref_start: '08:00:00',
      time_pref_end: '20:00:00',
    })
  }
  catch (error) {
    console.error('添加员工失败', error)
    ElMessage.error('添加员工失败')
  }
}

// 更新员工
async function updateEmployee() {
  try {
    // 准备API所需的员工数据格式
    const employeeData = {
      name: editingEmployee.name,
      position: editingEmployee.position,
      phone: editingEmployee.phone,
      store_id: editingEmployee.store_id,
    }

    // 调用API更新员工
    await employeeStore.updateEmployee(editingEmployee.id, employeeData)

    // 更新本地列表
    const index = employees.value.findIndex(e => e.id === editingEmployee.id)
    if (index !== -1) {
      const store_name = stores.value.find(s => s.id === editingEmployee.store_id)?.name || ''

      const updatedEmployee = {
        ...employees.value[index],
        name: editingEmployee.name,
        position: editingEmployee.position,
        store_id: editingEmployee.store_id,
        store_name,
        phone: editingEmployee.phone,
        email: editingEmployee.email,
        user_id: editingEmployee.user_id,
        max_daily_hours: editingEmployee.max_daily_hours,
        max_weekly_hours: editingEmployee.max_weekly_hours,
        workday_pref_start: editingEmployee.workday_pref_start,
        workday_pref_end: editingEmployee.workday_pref_end,
        time_pref_start: editingEmployee.time_pref_start,
        time_pref_end: editingEmployee.time_pref_end,
      }

      employees.value[index] = updatedEmployee
      selectedEmployee.value = updatedEmployee
      showEditEmployeeForm.value = false
      ElMessage.success('员工更新成功')
    }
  }
  catch (error) {
    console.error('更新员工失败', error)
    ElMessage.error('更新员工失败')
  }
}

// 删除员工
async function deleteEmployee() {
  try {
    if (selectedEmployee.value) {
      // 调用API删除员工
      await employeeStore.deleteEmployee(selectedEmployee.value.id)

      // 更新本地列表
      employees.value = employees.value.filter(e => e.id !== selectedEmployee.value?.id)
      selectedEmployee.value = null
      confirmDelete.value = false
      ElMessage.success('员工删除成功')
    }
  }
  catch (error) {
    console.error('删除员工失败', error)
    ElMessage.error('删除员工失败')
  }
}

// 准备编辑员工 - 添加缺失的函数
function prepareEditEmployee() {
  if (selectedEmployee.value) {
    Object.assign(editingEmployee, {
      id: selectedEmployee.value.id,
      name: selectedEmployee.value.name,
      position: selectedEmployee.value.position,
      store_id: selectedEmployee.value.store_id,
      phone: selectedEmployee.value.phone,
      email: selectedEmployee.value.email,
    })
    showEditEmployeeForm.value = true
  }
}
</script>

<template>
  <div class="employee-management">
    <h1>员工管理</h1>
    <div class="employee-container">
      <!-- 员工列表 -->
      <div class="employee-list">
        <div class="employee-list-header">
          <h2>员工列表</h2>
          <button class="add-employee-btn" @click="showAddEmployeeForm = true">
            添加员工
          </button>
        </div>
        <div class="employee-list-content">
          <div v-if="loading" class="loading">
            加载中...
          </div>
          <div v-else-if="employees.length === 0" class="no-data">
            暂无员工数据
          </div>
          <div v-else class="employee-items">
            <div
              v-for="employee in employees"
              :key="employee.id"
              class="employee-item"
              :class="{ active: selectedEmployee?.id === employee.id }"
              @click="selectEmployee(employee)"
            >
              <div class="employee-name">
                {{ employee.name }}
              </div>
              <div class="employee-position">
                {{ employee.position }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 员工详情 -->
      <div class="employee-detail">
        <div v-if="!selectedEmployee" class="no-selection">
          <p>请选择一个员工查看详情</p>
        </div>
        <div v-else class="employee-info">
          <h2>{{ selectedEmployee.name }} 详情</h2>
          <div class="info-group">
            <label>员工ID:</label>
            <span>{{ selectedEmployee.id }}</span>
          </div>
          <div class="info-group">
            <label>姓名:</label>
            <span>{{ selectedEmployee.name }}</span>
          </div>
          <div class="info-group">
            <label>职位:</label>
            <span>{{ selectedEmployee.position }}</span>
          </div>
          <div class="info-group">
            <label>所属门店:</label>
            <span>{{ selectedEmployee.store_name }}</span>
          </div>
          <div class="info-group">
            <label>联系电话:</label>
            <span>{{ selectedEmployee.phone }}</span>
          </div>

          <div class="actions">
            <button class="edit-btn" @click="prepareEditEmployee()">
              编辑
            </button>
            <button class="delete-btn" @click="confirmDelete = true">
              删除
            </button>
            <button class="pref-btn" @click="$router.push(`/employees/${selectedEmployee.id}/preferences`)">
              偏好设置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加员工表单 -->
    <div v-if="showAddEmployeeForm" class="modal">
      <div class="modal-content">
        <h2>添加员工</h2>
        <form @submit.prevent="addEmployee">
          <div class="form-group">
            <label for="name">姓名</label>
            <input id="name" v-model="newEmployee.name" type="text" required>
          </div>
          <div class="form-group">
            <label for="position">职位</label>
            <select id="position" v-model="newEmployee.position" required>
              <option value="店长">
                店长
              </option>
              <option value="副店长">
                副店长
              </option>
              <option value="收银员">
                收银员
              </option>
              <option value="理货员">
                理货员
              </option>
              <option value="促销员">
                促销员
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="store">所属门店</label>
            <select id="store" v-model="newEmployee.store_id" required>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="phone">联系电话</label>
            <input id="phone" v-model="newEmployee.phone" type="tel" required>
          </div>
          <div class="form-group">
            <label for="email">电子邮箱</label>
            <input id="email" v-model="newEmployee.email" type="email" required>
          </div>

          <div class="form-actions">
            <button type="button" @click="showAddEmployeeForm = false">
              取消
            </button>
            <button type="submit">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑员工表单 -->
    <div v-if="showEditEmployeeForm && selectedEmployee" class="modal">
      <div class="modal-content">
        <h2>编辑员工</h2>
        <form @submit.prevent="updateEmployee">
          <div class="form-group">
            <label for="edit-name">姓名</label>
            <input id="edit-name" v-model="editingEmployee.name" type="text" required>
          </div>
          <div class="form-group">
            <label for="edit-position">职位</label>
            <select id="edit-position" v-model="editingEmployee.position" required>
              <option value="店长">
                店长
              </option>
              <option value="副店长">
                副店长
              </option>
              <option value="收银员">
                收银员
              </option>
              <option value="理货员">
                理货员
              </option>
              <option value="促销员">
                促销员
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-store">所属门店</label>
            <select id="edit-store" v-model="editingEmployee.store_id" required>
              <option v-for="store in stores" :key="store.id" :value="store.id">
                {{ store.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-phone">联系电话</label>
            <input id="edit-phone" v-model="editingEmployee.phone" type="tel" required>
          </div>
          <div class="form-group">
            <label for="edit-email">电子邮箱</label>
            <input id="edit-email" v-model="editingEmployee.email" type="email" required>
          </div>

          <div class="form-actions">
            <button type="button" @click="showEditEmployeeForm = false">
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
    <div v-if="confirmDelete && selectedEmployee" class="modal">
      <div class="modal-content confirm-dialog">
        <h2>确认删除</h2>
        <p>您确定要删除员工 "{{ selectedEmployee.name }}" 吗？此操作不可撤销。</p>
        <div class="form-actions">
          <button type="button" @click="confirmDelete = false">
            取消
          </button>
          <button type="button" class="delete-btn" @click="deleteEmployee">
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.employee-management {
  padding: 20px;
}

.employee-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
}

.employee-list {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.employee-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.employee-list-header h2 {
  margin: 0;
  font-size: 18px;
}

.add-employee-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.employee-list-content {
  padding: 15px;
  max-height: 600px;
  overflow-y: auto;
}

.loading, .no-data {
  text-align: center;
  padding: 20px;
  color: #666;
}

.employee-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.employee-item {
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.employee-item:hover {
  background-color: #f9f9f9;
}

.employee-item.active {
  border-color: #2196f3;
  background-color: #e3f2fd;
}

.employee-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.employee-position {
  color: #666;
  font-size: 14px;
}

.employee-detail {
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

.employee-info h2 {
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
  max-height: 90vh;
  overflow-y: auto;
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

.form-group input, .form-group select {
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
