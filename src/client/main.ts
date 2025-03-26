import ElementPlus from 'element-plus'
import { createApp } from 'vue'
import App from './App.vue'
import pinia from './stores'
import router from './router'
import './style.css'
import 'virtual:uno.css'
import 'animate.css'
import 'element-plus/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.use(pinia)
app.mount('#app')
