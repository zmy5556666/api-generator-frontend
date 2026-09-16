<template>
  <el-main class="right-panel" v-loading="isGenerating" element-loading-text="多智能体协作中, 初级架构师绘制草稿 -> Tech Lead 严格审查...">
    <div class="panel-title" style="display: flex; justify-content: space-between; width: 100%;">
      <span>2. 架构师生成结果 (多文件VFS)</span>
      <div>
        <!-- 新增：编译并运行按钮 -->
        <el-button
            v-if="generatedFiles && generatedFiles.length > 0"
            type="primary"
            size="small"
            @click="runProject"
            :loading="isRunning">
          {{ isRunning ? '沙盒运行中...' : '编译并运行 (沙盒)' }}
        </el-button>
        <el-button
            v-if="generatedFiles && generatedFiles.length > 0"
            type="success"
            size="small"
            @click="$emit('download')">
          一键下载完整工程(Zip)
        </el-button>
      </div>
    </div>
    <el-empty v-if="!generatedFiles || generatedFiles.length === 0" description="等待 AI 生成完整的项目代码..." />

    <!-- Web IDE 核心区域 -->
    <div v-else class="ide-container">
      <!-- 左侧: 文件列表 -->
      <div class="file-sidebar">
        <div class="file-sidebar-title"> 项目文件</div>
        <div
            v-for="(file, index) in generatedFiles"
            :key="index"
            :class="['file-item', { active: activeFileIndex === index }]"
            @click="activeFileIndex = index"
            :title="file.filePath"
        >
          {{ getFileName(file.filePath) }}
        </div>
      </div>

      <!-- 右侧: 工作台 (代码展示 + 终端) -->
      <div class="right-workspace">

        <!-- 上方: 代码展示区 -->
        <div class="code-content" v-if="currentFile">
          <div class="file-path-breadcrumb"> {{ currentFile.filePath }}</div>
          <pre><code>{{ currentFile.codeContent }}</code></pre>
        </div>

        <!-- 下方: 终端面板 (动态显示/隐藏) -->
        <div class="terminal-panel" v-show="showTerminal">
          <div class="terminal-header">
            <span>>>> 运行终端 (Docker Sandbox)</span>
            <el-button link size="small" @click="closeTerminal" style="color: #909399">隐藏终端</el-button>
          </div>
          <!-- Xterm 终端容器 -->
          <div ref="terminalContainer" class="terminal-container"></div>
        </div>

      </div>
    </div>
  </el-main>
</template>

<script setup>
import { ref, computed, nextTick, onBeforeUnmount } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
// 引入 Xterm 终端
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css' // 必须引入 CSS，否则黑框会错位

const props = defineProps({
  generatedFiles: Array,
  isGenerating: Boolean,
  taskId: Number // 接收 App.vue 传来的任务 ID
})
const emit = defineEmits(['download'])

// 文件树相关状态
const activeFileIndex = ref(0)
const currentFile = computed(() => {
  if (!props.generatedFiles || props.generatedFiles.length === 0) return null
  if (activeFileIndex.value >= props.generatedFiles.length) {
    activeFileIndex.value = 0
  }
  return props.generatedFiles[activeFileIndex.value]
})

const getFileName = (path) => {
  if (!path) return '未命名文件'
  const parts = path.split('/')
  return parts[parts.length - 1]
}

// 终端与沙盒相关状态
const isRunning = ref(false)
const showTerminal = ref(false)
const terminalContainer = ref(null)
let term = null
let fitAddon = null
let ws = null

// 触发后端编译运行
const runProject = async () => {
  if (!props.taskId) {
    ElMessage.warning('无效的任务 ID，请先生成代码')
    return
  }

  isRunning.value = true
  showTerminal.value = true

  // 等待 Vue 将终端的 DOM 渲染出来后，再初始化 xterm
  await nextTick()
  initTerminal()

  try {
    // 调用刚才写好的触发沙盒接口
    await axios.post(`http://localhost:8080/api/projects/${props.taskId}/run`)
    ElMessage.success('沙盒指令已发送，准备编译...')
  } catch (error) {
    ElMessage.error('沙盒启动失败，请检查后端')
    isRunning.value = false
  }
}

// 初始化终端和 WebSocket
const initTerminal = () => {
  // 1. 如果之前已经有终端或 WebSocket，先销毁清理
  if (term) term.dispose()
  if (ws) ws.close()

  // 2. 初始化极客风终端
  term = new Terminal({
    cursorBlink: true,
    theme: {
      background: '#1e1e1e', // 经典 VS Code 黑色
      foreground: '#10b981'  // 极客绿
    }
  })

  // 3. 挂载到 DOM 并让终端尺寸自适应
  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(terminalContainer.value)
  fitAddon.fit()

  term.write('>>> 准备连接沙盒日志流...\r\n')

  // 4. 连接后端 WebSocket (注意端口是你后端的 8080)
  ws = new WebSocket(`ws://localhost:8080/ws/build-log/${props.taskId}`)

  ws.onopen = () => {
    term.write('>>> WebSocket 连接成功！等待 Docker 启动...\r\n')
  }

  ws.onmessage = (event) => {
    // Xterm 遵循严格的换行符标准，需要把 \n 替换为 \r\n
    const msg = event.data.replace(/\r?\n/g, '\r\n')
    term.write(msg)

    // 如果日志中包含结束标识，可以自动把按钮 Loading 状态解除
    if (msg.includes('容器执行完毕')) {
      isRunning.value = false
    }
  }

  ws.onerror = () => {
    term.write('\x1b[31m\r\n>>> [Error] 无法连接到日志服务器，请检查后端 WebSocket 配置\x1b[0m\r\n')
    isRunning.value = false
  }

  ws.onclose = () => {
    term.write('\r\n>>> WebSocket 连接已断开\r\n')
    isRunning.value = false
  }
}

// 关闭终端面板
const closeTerminal = () => {
  showTerminal.value = false
}

// 页面组件卸载时，防止内存泄漏
onBeforeUnmount(() => {
  if (ws) ws.close()
  if (term) term.dispose()
})
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
  height: calc(100vh - 120px);
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
.right-workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #282c34;
}
.code-content {
  flex: 1;
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
  color: #abb2bf;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}

/* ======== 新增：终端面板样式 ======== */
.terminal-panel {
  height: 35%; /* 终端占据下方大约三分之一的空间 */
  min-height: 200px;
  background-color: #1e1e1e;
  border-top: 1px solid #444;
  display: flex;
  flex-direction: column;
}
.terminal-header {
  padding: 5px 15px;
  background-color: #2d2d2d;
  color: #ccc;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.terminal-container {
  flex: 1;
  padding: 10px;
  overflow: hidden; /* 让 xterm 自己处理滚动条 */
}
</style>