<template>
  <el-aside width="40%" class="left-panel">
    <div class="panel-title">1. 输入产品需求 (PRD)</div>

    <div style="margin-bottom: 20px;">
      <!-- 注意这里把 v-model 拆成了 :model-value 和 @input，这是组件间传递数据的标准写法 -->
      <el-input
          :model-value="projectName"
          @input="$emit('update:projectName', $event)"
          @change="$emit('rename-project')"
          placeholder="给你的项目起个名字 (如：电商订单系统)"
          size="large"
      />
    </div>

    <div style="margin-bottom: 20px;">
      <el-input
          :model-value="prdText"
          @input="$emit('update:prdText', $event)"
          type="textarea"
          :rows="12"
          placeholder="请用自然语言描述你的业务需求..."
      />
    </div>

    <el-button type="primary" size="large" style="width: 100%" @click="$emit('generate')" :loading="isGenerating">
      {{ isGenerating ? 'AI 正在疯狂思考中...' : '召唤 AI 架构师，一键生成 API' }}
    </el-button>
  </el-aside>
</template>

<script setup>
defineProps({
  projectName: String,
  prdText: String,
  isGenerating: Boolean
})

defineEmits(['update:projectName', 'update:prdText', 'generate', 'rename-project'])
</script>

<style scoped>
.left-panel {
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
</style>