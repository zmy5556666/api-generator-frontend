<template>
  <div class="app-container">
    <el-header class="header">
      <h2>🚀 AI-Native API 自动生成工作台</h2>
    </el-header>

    <el-container class="main-content">
      <!-- 左侧：输入区域 -->
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
              placeholder="请用自然语言描述你的业务需求，例如：\n我需要一个用户管理模块，包含用户的注册、登录。另外还需要一个购物车模块，用户可以把商品加入购物车，并在购物车里结算下单..."
          />
        </div>

        <el-button type="primary" size="large" style="width: 100%" @click="startGeneration" :loading="isGenerating">
          {{ isGenerating ? 'AI 正在疯狂思考中...' : '召唤 AI 架构师，一键生成 API' }}
        </el-button>
      </el-aside>

      <!-- 右侧：结果展示区域 -->
      <el-main class="right-panel" v-loading="isGenerating" element-loading-text="多智能体协作中 (提取需求 -> 架构设计)...">
        <div class="panel-title" style="display: flex; justify-content: space-between; width: 100%;">
          <span>2. AI 架构师生成结果</span>
          <el-button v-if="generatedCode" type="success" size="small" @click="downloadSourceCode">
            📦 一键下载源码
          </el-button>
        </div>

        <!-- 默认空状态 -->
        <el-empty v-if="!generatedCode" description="等待 AI 生成架构代码..." />

        <!-- 代码展示区 -->
        <div v-else class="code-container">
          <pre><code>{{ generatedCode }}</code></pre>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 响应式状态数据
const projectName = ref('')
const prdText = ref('')
const isGenerating = ref(false)
const generatedCode = ref('')
const currentTaskId = ref(null)

// 后端接口基础地址
const baseURL = 'http://localhost:8080/api/projects'

// 核心连招：一键生成 API
const startGeneration = async () => {
  if (!projectName.value || !prdText.value) {
    ElMessage.warning('请先填写项目名称和需求！')
    return
  }

  isGenerating.value = true
  generatedCode.value = ''

  try {
    // 1. 创建任务 (这里的参数传递方式取决于你后端的写法，通常可以用 params)
    const createRes = await axios.post(`${baseURL}/create`, null, {
      params: { projectName: projectName.value }
    })
    currentTaskId.value = createRes.data.id

    // 2. 唤醒一号智能体：分析需求
    // 【已修正】：直接传递 JSON 对象给后端的 @RequestBody
    await axios.post(`${baseURL}/analyze`, {
      taskId: currentTaskId.value,
      prdText: prdText.value
    })

    // 3. 唤醒二号智能体：设计并生成代码
    const designRes = await axios.post(`${baseURL}/${currentTaskId.value}/design`)

    // 4. 将后端返回的 Controller 代码展示在页面上
    generatedCode.value = designRes.data.generatedControllerCode
    ElMessage.success('🎉 API 代码生成成功！')

  } catch (error) {
    console.error(error)
    ElMessage.error('生成过程中发生错误，请检查后端控制台日志。')
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
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.app-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  background-color: #24292f;
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 2px solid #409EFF;
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