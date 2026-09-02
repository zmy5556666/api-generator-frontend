import { createApp } from 'vue'
import App from './App.vue'

// 引入 Element Plus 和它的样式文件
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

// 把 Element Plus 装载到 Vue 实例上
app.use(ElementPlus)
app.mount('#app')