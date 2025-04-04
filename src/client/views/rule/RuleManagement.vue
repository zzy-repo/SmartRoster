<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 排班规则类型定义
interface Rule {
  id: string
  name: string
  description: string
  type: string
  parameters: Record<string, any>
  active: boolean
}

// 状态
const rules = ref<Rule[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const currentRule = ref<Rule | null>(null)

// 表单规则
const formRules = {
  name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入规则描述', trigger: 'blur' }
  ]
}

// 规则类型选项
const ruleTypeOptions = [
  { label: '最大工作时间', value: 'max_working_hours' },
  { label: '最小休息时间', value: 'min_rest_hours' },
  { label: '连续工作天数', value: 'consecutive_working_days' },
  { label: '技能匹配', value: 'skill_matching' },
  { label: '员工偏好', value: 'employee_preference' }
]

// 加载规则列表
const loadRules = async () => {
  loading.value = true
  try {
    // 这里应该是从API获取数据
    // const response = await fetch('/api/rules')
    // rules.value = await response.json()
    
    // 模拟数据
    setTimeout(() => {
      rules.value = [
        {
          id: '1',
          name: '每日最大工作时间',
          description: '员工每天最多工作8小时',
          type: 'max_working_hours',
          parameters: { maxHours: 8 },
          active: true
        },
        {
          id: '2',
          name: '班次间最小休息时间',
          description: '员工两个班次之间至少休息12小时',
          type: 'min_rest_hours',
          parameters: { minHours: 12 },
          active: true
        },
        {
          id: '3',
          name: '最大连续工作天数',
          description: '员工最多连续工作6天',
          type: 'consecutive_working_days',
          parameters: { maxDays: 6 },
          active: true
        }
      ]
      loading.value = false
    }, 500)
  } catch (error) {
    ElMessage.error('加载规则失败')
    loading.value = false
  }
}

// 打开新增/编辑对话框
const openDialog = (rule?: Rule) => {
  if (rule) {
    currentRule.value = { ...rule }
  } else {
    currentRule.value = {
      id: '',
      name: '',
      description: '',
      type: '',
      parameters: {},
      active: true
    }
  }
  dialogVisible.value = true
}

// 保存规则
const saveRule = async () => {
  if (!currentRule.value) return
  
  // 这里应该是调用API保存数据
  // const response = await fetch('/api/rules', {
  //   method: currentRule.value.id ? 'PUT' : 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(currentRule.value)
  // })
  
  // 模拟保存成功
  setTimeout(() => {
    if (currentRule.value!.id) {
      // 更新现有规则
      const index = rules.value.findIndex(r => r.id === currentRule.value!.id)
      if (index !== -1) {
        rules.value[index] = { ...currentRule.value! }
      }
    } else {
      // 添加新规则
      const newRule = {
        ...currentRule.value!,
        id: Date.now().toString()
      }
      rules.value.push(newRule)
    }
    
    dialogVisible.value = false
    ElMessage.success('保存成功')
  }, 300)
}

// 删除规则
const deleteRule = (rule: Rule) => {
  ElMessageBox.confirm(
    '确定要删除这条规则吗？',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    // 这里应该是调用API删除数据
    // await fetch(`/api/rules/${rule.id}`, { method: 'DELETE' })
    
    // 模拟删除成功
    setTimeout(() => {
      const index = rules.value.findIndex(r => r.id === rule.id)
      if (index !== -1) {
        rules.value.splice(index, 1)
      }
      ElMessage.success('删除成功')
    }, 300)
  }).catch(() => {
    // 取消删除
  })
}

// 切换规则状态
const toggleRuleStatus = async (rule: Rule) => {
  // 这里应该是调用API更新状态
  // await fetch(`/api/rules/${rule.id}/toggle`, { method: 'PUT' })
  
  // 模拟更新成功
  setTimeout(() => {
    const index = rules.value.findIndex(r => r.id === rule.id)
    if (index !== -1) {
      rules.value[index].active = !rules.value[index].active
    }
  }, 300)
}

// 初始化
onMounted(() => {
  loadRules()
})
</script>

<template>
  <div class="rule-management">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>排班规则管理</span>
          <el-button type="primary" @click="openDialog()">添加规则</el-button>
        </div>
      </template>
      
      <el-table :data="rules" style="width: 100%">
        <el-table-column prop="name" label="规则名称" width="180" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="type" label="类型" width="150">
          <template #default="{ row }">
            <el-tag>
              {{ ruleTypeOptions.find(option => option.value === row.type)?.label || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.active"
              @change="toggleRuleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentRule?.id ? '编辑规则' : '添加规则'"
      width="50%"
    >
      <el-form
        v-if="currentRule"
        :model="currentRule"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="currentRule.name" />
        </el-form-item>
        <el-form-item label="规则类型" prop="type">
          <el-select v-model="currentRule.type" placeholder="请选择规则类型" style="width: 100%">
            <el-option
              v-for="option in ruleTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述" prop="description">
          <el-input v-model="currentRule.description" type="textarea" :rows="3" />
        </el-form-item>
        
        <!-- 根据规则类型显示不同的参数设置 -->
        <template v-if="currentRule.type === 'max_working_hours'">
          <el-form-item label="最大工时">
            <el-input-number v-model="currentRule.parameters.maxHours" :min="1" :max="24" />
            <span class="ml-2">小时</span>
          </el-form-item>
        </template>
        
        <template v-if="currentRule.type === 'min_rest_hours'">
          <el-form-item label="最小休息时间">
            <el-input-number v-model="currentRule.parameters.minHours" :min="1" :max="48" />
            <span class="ml-2">小时</span>
          </el-form-item>
        </template>
        
        <template v-if="currentRule.type === 'consecutive_working_days'">
          <el-form-item label="最大连续天数">
            <el-input-number v-model="currentRule.parameters.maxDays" :min="1" :max="14" />
            <span class="ml-2">天</span>
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveRule">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.rule-management {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ml-2 {
  margin-left: 8px;
}
</style>