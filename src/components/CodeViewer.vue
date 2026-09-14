<template>
  <el-main class="right-panel" v-loading="isGenerating" element-loading-text="AI 全栈架构师正在疯狂编写项目代码 (DDL, Controller, Service, Mapper)...">
    <div class="panel-title" style="display: flex; justify-content: space-between; width: 100%;">
      <span>2. AI 架构师生成结果 (多文件 VFS)</span>
      <el-button
          v-if="generatedFiles && generatedFiles.length > 0"
          type="success"
          size="small"
          @click="$emit('download')">
        📦 一键下载完整工程 (Zip)
      </el-button>
    </div>

    <el-empty v-if="!generatedFiles || generatedFiles.length === 0" description="等待 AI 生成完整的项目代码..." />

    <!-- Web IDE 核心区域 -->
    <div v-else class="ide-container">
      <!-- 左侧：文件列表 -->
      <div class="file-sidebar">
        <div class="file-sidebar-title">📁 项目文件</div>
        <div
            v-for="(file, index) in generatedFiles"
            :key="index"
            :class="['file-item', { active: activeFileIndex === index }]"
            @click="activeFileIndex = index"
            :title="file.filePath"
        >
          📄 {{ getFileName(file.filePath) }}
        </div>
      </div>

      <!-- 右侧：代码展示区 -->
      <div class="code-content" v-if="currentFile">
        <div class="file-path-breadcrumb">{{ currentFile.filePath }}</div>
        <pre><code>{{ currentFile.codeContent }}</code></pre>
      </div>
    </div>
  </el-main>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  generatedFiles: {
    type: Array,
    default: () => []
  },
  isGenerating: Boolean
})

defineEmits(['download'])

// 记录当前选中的文件索引，默认选中第一个
const activeFileIndex = ref(0)

// 计算当前正在展示的文件对象
const currentFile = computed(() => {
  if (!props.generatedFiles || props.generatedFiles.length === 0) return null
  // 如果当前索引超出了数组长度（比如切换了新任务），强制重置为 0
  if (activeFileIndex.value >= props.generatedFiles.length) {
    activeFileIndex.value = 0
  }
  return props.generatedFiles[activeFileIndex.value]
})

// 辅助方法：从完整路径中提取最后的文件名
const getFileName = (path) => {
  if (!path) return '未命名文件'
  const parts = path.split('/')
  return parts[parts.length - 1]
}
</script>

<style scoped>
.right-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}
.panel-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 10px;
}
.ide-container {
  display: flex;
  height: calc(100vh - 200px);
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  overflow: hidden;
}
.file-sidebar {
  width: 240px;
  background-color: #f5f7fa;
  border-right: 1px solid #dcdfe6;
  overflow-y: auto;
}
.file-sidebar-title {
  padding: 10px 15px;
  font-size: 13px;
  color: #909399;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}
.file-item {
  padding: 10px 15px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-bottom: 1px solid #ebeef5;
}
.file-item:hover {
  background-color: #ecf5ff;
}
.file-item.active {
  background-color: #409EFF;
  color: white;
  font-weight: bold;
}
.code-content {
  flex: 1;
  background-color: #282c34;
  color: #abb2bf;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.file-path-breadcrumb {
  background-color: #21252b;
  padding: 8px 15px;
  font-size: 12px;
  color: #9cdafe;
  border-bottom: 1px solid #181a1f;
}
.code-content pre {
  margin: 0;
  padding: 15px;
  overflow: auto;
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}
</style>