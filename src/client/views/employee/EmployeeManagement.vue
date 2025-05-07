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

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  position: [
    { required: true, message: '请选择职位', trigger: 'change' }
  ],
  store_id: [
    { required: true, message: '请选择所属门店', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入电子邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

// 表单引用
const addFormRef = ref()
const editFormRef = ref()

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
    // 表单验证
    await addFormRef.value.validate()
    
    // 准备API所需的员工数据格式
    const store = stores.value.find(s => s.id === newEmployee.store_id)
    if (!store) {
      ElMessage.error('未找到所选门店信息')
      return
    }

    const employeeData = {
      name: newEmployee.name,
      position: newEmployee.position,
      phone: newEmployee.phone,
      email: newEmployee.email,
      store_id: newEmployee.store_id,
      store_name: store.name, // 添加store_name字段
      max_daily_hours: newEmployee.max_daily_hours,
      max_weekly_hours: newEmployee.max_weekly_hours,
      workday_pref_start: newEmployee.workday_pref_start,
      workday_pref_end: newEmployee.workday_pref_end,
      time_pref_start: newEmployee.time_pref_start,
      time_pref_end: newEmployee.time_pref_end,
    }

    // 调用API创建员工
    const response = await employeeStore.createEmployee(employeeData)

    // 添加到本地列表
    const employeeToAdd: Employee = {
      id: response.data.id,
      name: newEmployee.name,
      position: newEmployee.position,
      store_id: newEmployee.store_id,
      store_name: store.name,
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
    addFormRef.value.resetFields()
  }
  catch (error: any) {
    console.error('添加员工失败', error)
    if (error.response?.data?.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('添加员工失败，请检查表单信息是否正确')
    }
  }
}

// 更新员工
async function updateEmployee() {
  try {
    // 表单验证
    await editFormRef.value.validate()

    // 准备API所需的员工数据格式
    const store = stores.value.find(s => s.id === editingEmployee.store_id)
    if (!store) {
      ElMessage.error('未找到所选门店信息')
      return
    }

    const employeeData = {
      name: editingEmployee.name,
      position: editingEmployee.position,
      phone: editingEmployee.phone,
      email: editingEmployee.email,
      store_id: editingEmployee.store_id,
      store_name: store.name, // 添加store_name字段
    }

    // 调用API更新员工
    await employeeStore.updateEmployee(editingEmployee.id, employeeData)

    // 更新本地列表
    const index = employees.value.findIndex(e => e.id === editingEmployee.id)
    if (index !== -1) {
      const updatedEmployee = {
        ...employees.value[index],
        name: editingEmployee.name,
        position: editingEmployee.position,
        store_id: editingEmployee.store_id,
        store_name: store.name,
        phone: editingEmployee.phone,
        email: editingEmployee.email,
      }

      employees.value[index] = updatedEmployee
      selectedEmployee.value = updatedEmployee
      showEditEmployeeForm.value = false
      ElMessage.success('员工更新成功')
    }
  }
  catch (error: any) {
    console.error('更新员工失败', error)
    if (error.response?.data?.error) {
      ElMessage.error(error.response.data.error)
    } else {
      ElMessage.error('更新员工失败，请检查表单信息是否正确')
    }
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
    <el-card class="main-card">
      <template #header>
        <div class="card-header">
          <h1>员工管理</h1>
        </div>
      </template>
      
      <div class="employee-container">
        <!-- 员工列表 -->
        <el-card class="employee-list">
          <template #header>
            <div class="employee-list-header">
              <h2>员工列表</h2>
              <el-button type="primary" @click="showAddEmployeeForm = true">
                添加员工
              </el-button>
            </div>
          </template>
          
          <div class="employee-list-content">
            <el-skeleton :rows="3" animated v-if="loading" />
            <el-empty v-else-if="employees.length === 0" description="暂无员工数据" />
            <el-scrollbar v-else height="600px">
              <div class="employee-items">
                <el-card
                  v-for="employee in employees"
                  :key="employee.id"
                  class="employee-item"
                  :class="{ active: selectedEmployee?.id === employee.id }"
                  @click="selectEmployee(employee)"
                  shadow="hover"
                >
                  <div class="employee-name">
                    {{ employee.name }}
                  </div>
                  <div class="employee-position">
                    {{ employee.position }}
                  </div>
                </el-card>
              </div>
            </el-scrollbar>
          </div>
        </el-card>

        <!-- 员工详情 -->
        <el-card class="employee-detail">
          <template #header>
            <div class="employee-detail-header">
              <h2>{{ selectedEmployee ? `${selectedEmployee.name} 详情` : '员工详情' }}</h2>
            </div>
          </template>
          
          <div v-if="!selectedEmployee" class="no-selection">
            <el-empty description="请选择一个员工查看详情" />
          </div>
          <div v-else class="employee-info">
            <el-descriptions :column="1" border>
              <el-descriptions-item label="员工ID">{{ selectedEmployee.id }}</el-descriptions-item>
              <el-descriptions-item label="姓名">{{ selectedEmployee.name }}</el-descriptions-item>
              <el-descriptions-item label="职位">{{ selectedEmployee.position }}</el-descriptions-item>
              <el-descriptions-item label="所属门店">{{ selectedEmployee.store_name }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ selectedEmployee.phone }}</el-descriptions-item>
            </el-descriptions>

            <div class="actions">
              <el-button type="primary" @click="prepareEditEmployee()">
                编辑
              </el-button>
              <el-button type="danger" @click="confirmDelete = true">
                删除
              </el-button>
              <el-button type="success" @click="$router.push(`/employees/${selectedEmployee.id}/preferences`)">
                偏好设置
              </el-button>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 添加员工表单 -->
    <el-dialog
      v-model="showAddEmployeeForm"
      title="添加员工"
      width="500px"
    >
      <el-form
        ref="addFormRef"
        :model="newEmployee"
        :rules="rules"
        label-width="100px"
        @submit.prevent="addEmployee"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="newEmployee.name" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-select v-model="newEmployee.position" style="width: 100%">
            <el-option label="店长" value="店长" />
            <el-option label="副店长" value="副店长" />
            <el-option label="收银员" value="收银员" />
            <el-option label="理货员" value="理货员" />
            <el-option label="促销员" value="促销员" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属门店" prop="store_id">
          <el-select v-model="newEmployee.store_id" style="width: 100%">
            <el-option
              v-for="store in stores"
              :key="store.id"
              :label="store.name"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="newEmployee.phone" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="newEmployee.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddEmployeeForm = false">取消</el-button>
          <el-button type="primary" @click="addEmployee">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑员工表单 -->
    <el-dialog
      v-model="showEditEmployeeForm"
      title="编辑员工"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editingEmployee"
        :rules="rules"
        label-width="100px"
        @submit.prevent="updateEmployee"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="editingEmployee.name" />
        </el-form-item>
        <el-form-item label="职位" prop="position">
          <el-select v-model="editingEmployee.position" style="width: 100%">
            <el-option label="店长" value="店长" />
            <el-option label="副店长" value="副店长" />
            <el-option label="收银员" value="收银员" />
            <el-option label="理货员" value="理货员" />
            <el-option label="促销员" value="促销员" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属门店" prop="store_id">
          <el-select v-model="editingEmployee.store_id" style="width: 100%">
            <el-option
              v-for="store in stores"
              :key="store.id"
              :label="store.name"
              :value="store.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editingEmployee.phone" />
        </el-form-item>
        <el-form-item label="电子邮箱" prop="email">
          <el-input v-model="editingEmployee.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showEditEmployeeForm = false">取消</el-button>
          <el-button type="primary" @click="updateEmployee">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 删除确认对话框 -->
    <el-dialog
      v-model="confirmDelete"
      title="确认删除"
      width="400px"
    >
      <p>您确定要删除员工 "{{ selectedEmployee?.name }}" 吗？此操作不可撤销。</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="confirmDelete = false">取消</el-button>
          <el-button type="danger" @click="deleteEmployee">确认删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.employee-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-container {
  display: flex;
  gap: 20px;
  height: calc(100vh - 200px); /* 调整整体容器高度 */
  min-height: 500px; /* 设置最小高度 */
}

.employee-list {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.employee-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-list-header h2 {
  margin: 0;
  font-size: 18px;
}

.employee-list-content {
  flex: 1;
  overflow: hidden;
  padding: 15px;
}

.employee-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
}

.employee-item {
  cursor: pointer;
  transition: all 0.2s;
}

.employee-item:hover {
  transform: translateY(-2px);
}

.employee-item.active {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.employee-name {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 5px;
}

.employee-position {
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.employee-detail {
  flex: 2;
  display: flex;
  flex-direction: column;
}

.employee-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.employee-detail-header h2 {
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

.employee-info {
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
