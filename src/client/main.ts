import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import 'virtual:uno.css'
import 'animate.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.mount('#app')
