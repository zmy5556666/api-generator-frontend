<template>
  <div class="app-wrapper">
    <el-container class="app-container">

      <!-- ================= 左侧：历史记录侧边栏 ================= -->
      <el-aside width="260px" class="history-sidebar">
        <!-- 新建对话按钮 -->
        <div class="sidebar-header">
          <el-button class="new-btn" @click="createNewTask">
            <span style="font-size: 16px; margin-right: 8px;">+</span> 新建 API 任务
          </el-button>
        </div>

        <!-- 历史列表 -->
        <div class="history-list">
          <div
              v-for="task in historyList"
              :key="task.id"
              :class="['history-item', { active: currentTaskId === task.id }]"
              @click="loadTaskDetails(task)"
          >
            <span class="task-name">💬 {{ task.projectName }}</span>
            <el-button
                type="danger"
                link
                class="delete-btn"
                @click.stop="deleteTask(task.id)"
                title="删除任务"
            >
              🗑️
            </el-button>
          </div>
        </div>
      </el-aside>

      <!-- ================= 右侧：工作台主区域 ================= -->
      <el-container class="main-workspace">
        <el-header class="header">
          <h2>🚀 AI-Native API 自动生成工作台</h2>
        </el-header>

        <el-container class="main-content">
          <!-- 左区：输入需求 -->
          <el-aside width="40%" class="left-panel">
            <div class="panel-title">1. 输入产品需求 (PRD)</div>

            <div style="margin-bottom: 20px;">
              <el-input v-model="projectName" placeholder="给你的项目起个名字 (如：电商订单系统)" size="large" />
            </div>

            <div style="margin-bottom: 20px;">
              <el-input
                  v-model="prdText"
                  type="textarea"
                  :rows="12"
                  placeholder="请用自然语言描述你的业务需求..."
              />
            </div>

            <el-button type="primary" size="large" style="width: 100%" @click="startGeneration" :loading="isGenerating">
              {{ isGenerating ? 'AI 正在疯狂思考中...' : '召唤 AI 架构师，一键生成 API' }}
            </el-button>
          </el-aside>

          <!-- 右区：结果展示 -->
          <el-main class="right-panel" v-loading="isGenerating" element-loading-text="多智能体协作中 (提取需求 -> 架构设计)...">
            <div class="panel-title" style="display: flex; justify-content: space-between; width: 100%;">
              <span>2. AI 架构师生成结果</span>
              <el-button v-if="generatedCode" type="success" size="small" @click="downloadSourceCode">
                📦 一键下载源码
              </el-button>
            </div>

            <el-empty v-if="!generatedCode" description="等待 AI 生成架构代码..." />

            <div v-else class="code-container">
              <pre><code>{{ generatedCode }}</code></pre>
            </div>
          </el-main>
        </el-container>
      </el-container>

    </el-container>
  </div>
</template>

<script setup>
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
  prdText.value = '（读取历史记录模式下，直接查看右侧生成的源码）'
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
</script>

<style>
/* ====== 全局初始化 ====== */
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

/* ====== 左侧边栏 (ChatGPT 风格) ====== */
.history-sidebar {
  background-color: #202123;
  color: white;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 16px;
}

.new-btn {
  width: 100%;
  background-color: transparent !important;
  color: white !important;
  border: 1px solid #565869 !important;
  border-radius: 6px;
  justify-content: flex-start;
  padding: 12px;
  transition: all 0.3s;
}

.new-btn:hover {
  background-color: #343541 !important;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}

.history-item {
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
  color: #ececf1;
}

.history-item:hover, .history-item.active {
  background-color: #343541;
}

.task-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* 垃圾桶默认隐藏，鼠标移上去才显示 */
.delete-btn {
  opacity: 0;
  font-size: 16px;
  padding: 0 5px;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

/* ====== 右侧主工作区 ====== */
.main-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* 防止子元素撑破 Flex 布局 */
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

.left-panel, .right-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}

.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 10px;
  display: inline-block;
}

.code-container {
  background-color: #282c34;
  color: #abb2bf;
  padding: 15px;
  border-radius: 8px;
  overflow-y: auto;
  height: calc(100vh - 200px);
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>