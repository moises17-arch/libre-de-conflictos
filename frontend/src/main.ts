import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Importa createPinia
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia() // 2. Crea la instancia de Pinia

app.use(pinia)   // 3. Regístrala PRIMERO
app.use(router)  // Luego el router

app.mount('#app')