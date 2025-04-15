<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useEmployeeStore } from '../../stores/employeeStore'
import { useStoreStore } from '../../stores/storeStore'
import { ElMessage } from 'element-plus'

// 定义员工类型
interface Employee {
  id: string
  name: string
  gender: string
  age: number
  position: string
  storeId: string
  storeName: string
  phone: string
  email: string
  hireDate: string
  skills: string[]
}

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
  gender: '男',
  age: 25,
  position: '',
  storeId: '',
  phone: '',
  email: '',
  hireDate: '',
  skills: [],
})

// 编辑员工表单数据
const editingEmployee = reactive({
  id: '',
  name: '',
  gender: '',
  age: 0,
  position: '',
  storeId: '',
  phone: '',
  email: '',
  hireDate: '',
  skills: [],
})

// 加载员工和门店数据
onMounted(async () => {
  try {
    loading.value = true
    // 使用真实API调用获取数据
    await Promise.all([
      storeStore.fetchStores(),
      employeeStore.fetchEmployees()
    ])
    
    // 从store中获取数据
    stores.value = storeStore.stores
    
    // 将employeeStore中的数据格式转换为当前组件需要的格式
    employees.value = employeeStore.employees.map(emp => {
      // 创建符合本地Employee接口的对象
      const employee: Employee = {
        id: emp.id,
        name: emp.name,
        gender: '男', // 默认值，因为API返回的数据可能没有这个字段
        age: 25, // 默认值
        position: emp.position,
        storeId: emp.store || '', // 使用store字段作为storeId
        storeName: '', // 稍后会根据storeId查找
        phone: emp.phone || '',
        email: emp.email || '',
        hireDate: emp.createdAt?.split('T')[0] || '', // 使用创建日期作为入职日期
        skills: [] // 初始化skills为空数组
      }
      
      // 查找门店名称
      const store = stores.value.find(s => s.id === employee.storeId)
      if (store) {
        employee.storeName = store.name
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
      email: `${newEmployee.name}@example.com`, // 添加必要的email字段
      store: newEmployee.storeId, // 使用storeId作为store
      preferences: {
        workday_pref: [9, 17] as [number, number], // 修复类型为元组
        time_pref: ['09:00', '17:00'] as [string, string], // 修复类型为元组
        max_daily_hours: 8, // 默认每日最大工作时间
        max_weekly_hours: 40, // 默认每周最大工作时间
      }
    }

    // 调用API创建员工
    const response = await employeeStore.createEmployee(employeeData)
    
    // 添加到本地列表
    const storeName = stores.value.find(s => s.id === newEmployee.storeId)?.name || ''
    const employeeToAdd: Employee = {
      id: response.data.id, // 修复：正确访问返回数据中的id
      name: newEmployee.name,
      gender: newEmployee.gender,
      age: newEmployee.age,
      position: newEmployee.position,
      storeId: newEmployee.storeId,
      storeName,
      phone: newEmployee.phone,
      email: newEmployee.email,
      hireDate: newEmployee.hireDate,
      skills: [], // 添加skills属性，初始化为空数组

    }

    employees.value.push(employeeToAdd)
    showAddEmployeeForm.value = false
    ElMessage.success('员工添加成功')

    // 重置表单
    Object.assign(newEmployee, {
      name: '',
      gender: '男',
      age: 25,
      position: '',
      storeId: '',
      phone: '',
      hireDate: '',
      skills: [],
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
      store: editingEmployee.storeId, // 使用storeId作为store
    }

    // 调用API更新员工
    await employeeStore.updateEmployee(editingEmployee.id, employeeData)
    
    // 更新本地列表
    const index = employees.value.findIndex(e => e.id === editingEmployee.id)
    if (index !== -1) {
      const storeName = stores.value.find(s => s.id === editingEmployee.storeId)?.name || ''

      const updatedEmployee = {
        ...employees.value[index],
        name: editingEmployee.name,
        gender: editingEmployee.gender,
        age: editingEmployee.age,
        position: editingEmployee.position,
        storeId: editingEmployee.storeId,
        storeName,
        phone: editingEmployee.phone,
        email: editingEmployee.email,
        hireDate: editingEmployee.hireDate,
        skills: [...(employees.value[index].skills || [])], // 保留原有skills或初始化为空数组

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
      gender: selectedEmployee.value.gender,
      age: selectedEmployee.value.age,
      position: selectedEmployee.value.position,
      storeId: selectedEmployee.value.storeId,
      phone: selectedEmployee.value.phone,
      hireDate: selectedEmployee.value.hireDate,
      skills: [...selectedEmployee.value.skills],
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
            <label>性别:</label>
            <span>{{ selectedEmployee.gender }}</span>
          </div>
          <div class="info-group">
            <label>年龄:</label>
            <span>{{ selectedEmployee.age }}</span>
          </div>
          <div class="info-group">
            <label>职位:</label>
            <span>{{ selectedEmployee.position }}</span>
          </div>
          <div class="info-group">
            <label>所属门店:</label>
            <span>{{ selectedEmployee.storeName }}</span>
          </div>
          <div class="info-group">
            <label>联系电话:</label>
            <span>{{ selectedEmployee.phone }}</span>
          </div>
          <div class="info-group">
            <label>入职日期:</label>
            <span>{{ selectedEmployee.hireDate }}</span>
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
            <label for="gender">性别</label>
            <select id="gender" v-model="newEmployee.gender" required>
              <option value="男">
                男
              </option>
              <option value="女">
                女
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="age">年龄</label>
            <input id="age" v-model="newEmployee.age" type="number" required min="18" max="65">
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
            <select id="store" v-model="newEmployee.storeId" required>
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
          <div class="form-group">
            <label for="hireDate">入职日期</label>
            <input id="hireDate" v-model="newEmployee.hireDate" type="date" required>
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
            <label for="edit-gender">性别</label>
            <select id="edit-gender" v-model="editingEmployee.gender" required>
              <option value="男">
                男
              </option>
              <option value="女">
                女
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="edit-age">年龄</label>
            <input id="edit-age" v-model="editingEmployee.age" type="number" required min="18" max="65">
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
            <select id="edit-store" v-model="editingEmployee.storeId" required>
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
          <div class="form-group">
            <label for="edit-hireDate">入职日期</label>
            <input id="edit-hireDate" v-model="editingEmployee.hireDate" type="date" required>
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

.skills-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.skill-tag {
  background-color: #e3f2fd;
  color: #2196f3;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
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

.skills-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.skills-checkboxes label {
  display: flex;
  align-items: center;
  font-weight: normal;
}

.skills-checkboxes input {
  margin-right: 5px;
  width: auto;
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
