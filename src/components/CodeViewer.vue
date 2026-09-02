<template>
  <el-main class="right-panel" v-loading="isGenerating" element-loading-text="多智能体协作中 (提取需求 -> 架构设计)...">
    <div class="panel-title" style="display: flex; justify-content: space-between; width: 100%;">
      <span>2. AI 架构师生成结果</span>
      <el-button v-if="generatedCode" type="success" size="small" @click="$emit('download')">
        📦 一键下载源码
      </el-button>
    </div>

    <el-empty v-if="!generatedCode" description="等待 AI 生成架构代码..." />

    <div v-else class="code-container">
      <pre><code>{{ generatedCode }}</code></pre>
    </div>
  </el-main>
</template>

<script setup>
defineProps({
  generatedCode: String,
  isGenerating: Boolean
})

defineEmits(['download'])
</script>

<style scoped>
.right-panel {
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