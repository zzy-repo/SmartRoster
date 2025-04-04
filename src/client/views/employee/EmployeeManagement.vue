<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

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
  hireDate: string
  skills: string[]
}

// 定义门店类型
interface Store {
  id: string
  name: string
}

// 状态
const employees = ref<Employee[]>([])
const selectedEmployee = ref<Employee | null>(null)
const loading = ref(true)
const showAddEmployeeForm = ref(false)
const showEditEmployeeForm = ref(false)
const confirmDelete = ref(false)
const stores = ref<Store[]>([])

// 可用技能列表
const availableSkills = [
  '收银',
  '理货',
  '促销',
  '客服',
  '库存管理',
  '食品加工',
  '生鲜处理',
  '团队管理',
]

// 新员工表单数据
const newEmployee = reactive({
  name: '',
  gender: '男',
  age: 25,
  position: '',
  storeId: '',
  phone: '',
  hireDate: '',
  skills: [] as string[],
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
  hireDate: '',
  skills: [] as string[],
})

// 加载员工和门店数据
onMounted(async () => {
  try {
    // 这里应该调用API获取员工和门店数据
    // 模拟数据
    setTimeout(() => {
      stores.value = [
        { id: '1', name: '中关村店' },
        { id: '2', name: '望京店' },
        { id: '3', name: '五道口店' },
      ]

      employees.value = [
        {
          id: '1',
          name: '张三',
          gender: '男',
          age: 32,
          position: '店长',
          storeId: '1',
          storeName: '中关村店',
          phone: '13812345678',
          hireDate: '2020-01-15',
          skills: ['收银', '团队管理', '库存管理'],
        },
        {
          id: '2',
          name: '李四',
          gender: '女',
          age: 28,
          position: '收银员',
          storeId: '1',
          storeName: '中关村店',
          phone: '13987654321',
          hireDate: '2021-03-10',
          skills: ['收银', '客服'],
        },
        {
          id: '3',
          name: '王五',
          gender: '男',
          age: 25,
          position: '理货员',
          storeId: '2',
          storeName: '望京店',
          phone: '13567891234',
          hireDate: '2022-05-20',
          skills: ['理货', '库存管理'],
        },
      ]
      loading.value = false
    }, 1000)
  }
  catch (error) {
    console.error('加载数据失败', error)
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
    // 这里应该调用API添加员工
    // 模拟添加
    const newId = String(employees.value.length + 1)
    const storeName = stores.value.find(s => s.id === newEmployee.storeId)?.name || ''

    const employeeToAdd: Employee = {
      id: newId,
      name: newEmployee.name,
      gender: newEmployee.gender,
      age: newEmployee.age,
      position: newEmployee.position,
      storeId: newEmployee.storeId,
      storeName,
      phone: newEmployee.phone,
      hireDate: newEmployee.hireDate,
      skills: [...newEmployee.skills],
    }

    employees.value.push(employeeToAdd)
    showAddEmployeeForm.value = false

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
  }
}

// 准备编辑员工
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

// 更新员工
async function updateEmployee() {
  try {
    // 这里应该调用API更新员工
    // 模拟更新
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
        hireDate: editingEmployee.hireDate,
        skills: [...editingEmployee.skills],
      }

      employees.value[index] = updatedEmployee
      selectedEmployee.value = updatedEmployee
      showEditEmployeeForm.value = false
    }
  }
  catch (error) {
    console.error('更新员工失败', error)
  }
}

// 删除员工
async function deleteEmployee() {
  try {
    // 这里应该调用API删除员工
    // 模拟删除
    if (selectedEmployee.value) {
      employees.value = employees.value.filter(e => e.id !== selectedEmployee.value?.id)
      selectedEmployee.value = null
      confirmDelete.value = false
    }
  }
  catch (error) {
    console.error('删除员工失败', error)
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
          <div class="info-group">
            <label>技能:</label>
            <div class="skills-list">
              <span v-for="skill in selectedEmployee.skills" :key="skill" class="skill-tag">{{ skill }}</span>
            </div>
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
            <label for="hireDate">入职日期</label>
            <input id="hireDate" v-model="newEmployee.hireDate" type="date" required>
          </div>
          <div class="form-group">
            <label>技能</label>
            <div class="skills-checkboxes">
              <label v-for="skill in availableSkills" :key="skill">
                <input v-model="newEmployee.skills" type="checkbox" :value="skill">
                {{ skill }}
              </label>
            </div>
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
            <label for="edit-hireDate">入职日期</label>
            <input id="edit-hireDate" v-model="editingEmployee.hireDate" type="date" required>
          </div>
          <div class="form-group">
            <label>技能</label>
            <div class="skills-checkboxes">
              <label v-for="skill in availableSkills" :key="skill">
                <input v-model="editingEmployee.skills" type="checkbox" :value="skill">
                {{ skill }}
              </label>
            </div>
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
