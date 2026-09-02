<template>
  <el-aside width="260px" class="history-sidebar">
    <!-- 新建对话按钮 -->
    <div class="sidebar-header">
      <el-button class="new-btn" @click="$emit('create-new')">
        <span style="font-size: 16px; margin-right: 8px;">+</span> 新建 API 任务
      </el-button>
    </div>

    <!-- 历史列表 -->
    <div class="history-list">
      <div
          v-for="task in historyList"
          :key="task.id"
          :class="['history-item', { active: currentTaskId === task.id }]"
          @click="$emit('load-task', task)"
      >
        <span class="task-name">💬 {{ task.projectName }}</span>
        <el-button
            type="danger"
            link
            class="delete-btn"
            @click.stop="$emit('delete-task', task.id)"
            title="删除任务"
        >
          🗑️
        </el-button>
      </div>
    </div>
  </el-aside>
</template>

<script setup>
// 1. 接收父组件 (App.vue) 传过来的数据
defineProps({
  historyList: {
    type: Array,
    required: true
  },
  currentTaskId: {
    type: Number,
    default: null
  }
})

// 2. 声明当前组件会向外“发射”哪些事件
defineEmits(['create-new', 'load-task', 'delete-task'])
</script>

<!-- 加上 scoped，这里的样式就只在这个文件里生效，绝对不会污染外部！ -->
<style scoped>
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

.delete-btn {
  opacity: 0;
  font-size: 16px;
  padding: 0 5px;
}

.history-item:hover .delete-btn {
  opacity: 1;
}
</style>