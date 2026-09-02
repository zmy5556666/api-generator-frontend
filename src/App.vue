<template>
  <div class="app-wrapper">
    <el-container class="app-container">

      <!-- 1. 左侧：历史记录侧边栏 -->
      <HistorySidebar
          :history-list="historyList"
          :current-task-id="currentTaskId"
          @create-new="createNewTask"
          @load-task="loadTaskDetails"
          @delete-task="deleteTask"
      />

      <!-- 右侧：工作台主区域 -->
      <el-container class="main-workspace">
        <el-header class="header">
          <h2>🚀 AI-Native API 自动生成工作台</h2>
        </el-header>

        <el-container class="main-content">
          <!-- 2. 中间：需求输入区 -->
          <PrdInput
              v-model:project-name="projectName"
              v-model:prd-text="prdText"
              :is-generating="isGenerating"
              @generate="startGeneration"
              @rename-project="handleRename"
          />

          <!-- 3. 右侧：代码展示区 -->
          <CodeViewer
              :generated-code="generatedCode"
              :is-generating="isGenerating"
              @download="downloadSourceCode"
          />
        </el-container>
      </el-container>

    </el-container>
  </div>
</template>

<script setup>
import PrdInput from './components/PrdInput.vue'
import CodeViewer from './components/CodeViewer.vue'
import HistorySidebar from './components/HistorySidebar.vue'
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// 后端接口基础地址
const baseURL = 'http://localhost:8080/api/projects'

// 状态数据
const historyList = ref([])
const currentTaskId = ref(null)
const projectName = ref('')
const prdText = ref('')
const generatedCode = ref('')
const isGenerating = ref(false)

// 【新增】页面一加载，就去后端拉取历史记录
onMounted(() => {
  fetchHistory()
})

// ================== 方法区 ==================

// 获取历史记录列表
const fetchHistory = async () => {
  try {
    const res = await axios.get(`${baseURL}/history`)
    historyList.value = res.data
  } catch (error) {
    ElMessage.error('获取历史记录失败，请检查后端是否启动')
  }
}

// 新建任务（清空画布）
const createNewTask = () => {
  currentTaskId.value = null
  projectName.value = ''
  prdText.value = ''
  generatedCode.value = ''
}

// 点击侧边栏历史，加载详情
const loadTaskDetails = async (task) => {
  currentTaskId.value = task.id
  projectName.value = task.projectName
  prdText.value = task.originalPrd
  generatedCode.value = ''

  try {
    const res = await axios.get(`${baseURL}/${task.id}/design`)
    generatedCode.value = res.data.generatedControllerCode
  } catch (error) {
    ElMessage.warning('该任务尚未完成代码生成，或记录已丢失')
  }
}

// 删除指定任务
const deleteTask = async (id) => {
  try {
    // 弹窗警告保护
    await ElMessageBox.confirm('确认彻底删除该任务及其所有相关代码吗？', '危险操作', {
      confirmButtonText: '删！',
      cancelButtonText: '手滑了',
      type: 'warning',
    })

    // 调用后端级联删除接口
    await axios.delete(`${baseURL}/${id}`)
    ElMessage.success('🗑️ 删除成功')

    // 如果你恰好删除了当前正在查看的任务，就把右边清空
    if (currentTaskId.value === id) {
      createNewTask()
    }

    // 重新拉取最新列表
    fetchHistory()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败，请检查后端日志')
    }
  }
}

// 核心连招：一键生成 API (保留了你修复好的版本)
const startGeneration = async () => {
  if (!projectName.value || !prdText.value) {
    ElMessage.warning('请先填写项目名称和需求！')
    return
  }

  //如果是在查看历史记录时点击生成，强制清空当前 ID，当作全新任务来走一遍流程
  currentTaskId.value = null

  isGenerating.value = true
  generatedCode.value = ''

  try {
    const createRes = await axios.post(`${baseURL}/create`, null, { params: { projectName: projectName.value } })
    currentTaskId.value = createRes.data.id

    await axios.post(`${baseURL}/analyze`, {
      taskId: currentTaskId.value,
      prdText: prdText.value
    })

    const designRes = await axios.post(`${baseURL}/${currentTaskId.value}/design`)
    generatedCode.value = designRes.data.generatedControllerCode

    ElMessage.success('🎉 API 代码生成成功！')

    // 【新增】生成完毕后，顺便刷新一下左侧的历史列表！
    fetchHistory()
  } catch (error) {
    console.error(error)
    ElMessage.error('生成过程中发生错误。')
  } finally {
    isGenerating.value = false
  }
}

// 下载源码逻辑
const downloadSourceCode = () => {
  if (!currentTaskId.value) return
  window.open(`${baseURL}/${currentTaskId.value}/download`, '_blank')
}

// 处理重命名逻辑
const handleRename = async () => {
  // 如果是新建状态（还没生成过），或者名字为空，就不发请求
  if (!currentTaskId.value || !projectName.value) return;

  try {
    await axios.put(`${baseURL}/${currentTaskId.value}/name`, null, {
      params: { newName: projectName.value }
    })
    // 静默刷新左侧的历史记录列表
    fetchHistory()
  } catch (error) {
    ElMessage.error('重命名同步失败')
  }
}
</script>

<style>
/* 全局样式保留，其余的都被抽进子组件了！ */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-wrapper {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.app-container {
  height: 100%;
  display: flex;
}

.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  background-color: white;
  color: #202123;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  z-index: 10;
}

.header h2 {
  font-size: 18px;
  margin: 0;
}

.main-content {
  flex: 1;
  padding: 20px;
  gap: 20px;
}
</style>