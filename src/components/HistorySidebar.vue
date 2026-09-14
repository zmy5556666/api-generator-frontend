<template>
  <!-- 侧边栏的宽度通过 isCollapsed 动态控制,并添加 CSS 过渡动画 -->
  <el-aside :width="isCollapsed ? '64px' : '260px'" class="history-sidebar">
    <div class="sidebar-header">
      <!-- 1.顶部:展开/收起按钮 -->
      <div class="toggle-box" :style="{ justifyContent: isCollapsed ? 'center' : 'flex-end' }">
        <el-button link @click="isCollapsed = !isCollapsed" class="collapse-btn" :title="isCollapsed ? '展开侧边栏' : '收起侧边栏'">
          <span style="font-size: 16px;">{{ isCollapsed ? '->' : '<-' }}</span>
        </el-button>
      </div>
      <!--2.新建任务按钮 -->
      <el-tooltip
          content="新建 API 任务"
          placement="right" :disabled="!isCollapsed" :show-after="200">
        <el-button class="new-btn" @click="$emit('create-new')" :style="{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '12px 0' : '12px' }">
          <span style="font-size: 16px;" :style="{ marginRight: isCollapsed ? '0' : '8px' }">+</span>
          <span v-show="!isCollapsed">新建 API 任务</span>
        </el-button>
      </el-tooltip>
      <!-- 3. 搜索框(展开时显示输入框,收起时变成一个可点击的放大镜)-->
      <div style="margin-top: 15px;">
        <el-input
            v-show="!isCollapsed"
            v-model="searchQuery"
            placeholder="搜索历史项目..."
            clearable
            class="search-input"
        />
        <el-tooltip
            content="搜索 (点击展开)"
            placement="right" :disabled="!isCollapsed" :show-after="200">
          <div v-show="isCollapsed" class="icon-only-btn" @click="isCollapsed = false">
            🔍
          </div>
        </el-tooltip>
      </div>
    </div>
    <!--4.历史列表 -->
    <div class="history-list">
      <el-tooltip
          v-for="task in filteredHistory"
          :key="task.id"
          :content="task.projectName"
          placement="right"
          :disabled="!isCollapsed"
          :show-after="200"
      >
        <div
            :class="['history-item', { active: currentTaskId === task.id, 'collapsed-item': isCollapsed}]"
            @click="$emit('load-task', task)"
        >
          <span class="task-icon">💬</span>
          <span class="task-name" v-show="!isCollapsed">{{ task.projectName }}</span>
          <el-button
              v-show="!isCollapsed"
              type="danger"
              link
              class="delete-btn"
              @click.stop="$emit('delete-task', task.id)"
              title="删除任务"
          >
            🗑️
          </el-button>
        </div>
      </el-tooltip>
      <!-- 搜索为空提示(仅在展开时显示)-->
      <div v-if="!isCollapsed && filteredHistory.length === 0" style="text-align: center; color: #565869; margin-top: 20px; font-size: 13px;">
        没有找到匹配的项目
      </div>
    </div>
  </el-aside>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  historyList: {
    type: Array,
    required: true
  },
  // 修正为大写 I
  currentTaskId: {
    type: Number,
    default: null
  }
})

defineEmits(['create-new', 'load-task', 'delete-task'])

// 【新增】:控制侧边栏折叠状态的变量
const isCollapsed = ref(false)
const searchQuery = ref('')

const filteredHistory = computed(() => {
  if (!searchQuery.value) return props.historyList
  const lowerCaseQuery = searchQuery.value.toLowerCase()
  return props.historyList.filter(task =>
      task.projectName && task.projectName.toLowerCase().includes(lowerCaseQuery)
  )
})
</script>

<style scoped>
/* 增加过渡动画,让宽度的变化丝滑如德芙 */
.history-sidebar {
  background-color: #202123;
  color: white;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  overflow: hidden; /*防止折叠时文字溢出换行 */
}
.sidebar-header {
  padding: 16px;
}
.toggle-box {
  display: flex;
  margin-bottom: 15px;
  height: 24px;
}
.collapse-btn {
  color: #8e8ea0;
  padding: 0;
}
.collapse-btn:hover {
  color: white;
}
.new-btn {
  width: 100%;
  background-color: transparent !important;
  color: white !important;
  border: 1px solid #565869 !important;
  border-radius: 6px;
  transition: all 0.2s;
  overflow: hidden;
}
.new-btn:hover {
  background-color: #343541 !important;
}
.icon-only-btn {
  width: 100%;
  padding: 10px 0;
  text-align: center;
  border-radius: 6px;
  cursor: pointer;
  color: #8e8ea0;
  transition: all 0.2s;
}
.icon-only-btn:hover {
  background-color: #343541;
  color: white;
}
.search-input :deep(.el-input__wrapper) {
  background-color: #343541;
  box-shadow: none;
  border: 1px solid #565869;
}
.search-input :deep(.el-input__inner) {
  color: #ececf1;
}
.history-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 12px;
}
/* 滚动条暗黑美化 */
.history-list::-webkit-scrollbar {
  width: 6px;
}
.history-list::-webkit-scrollbar-thumb {
  background-color: #565869;
  border-radius: 3px;
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
  white-space: nowrap;
}
/* 收起状态下的历史记录项:居中、去内边距 */
.collapsed-item {
  justify-content: center;
  padding: 12px 0;
}
.history-item:hover, .history-item.active {
  background-color: #343541;
}
.task-icon {
  font-size: 16px;
}
.task-name {
  font-size: 14px;
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.delete-btn {
  opacity: 0;
  font-size: 16px;
  padding: 0 5px;
}
.history-item:hover .delete-btn {
  opacity: 1;
}
</style>