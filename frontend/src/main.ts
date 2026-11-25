/*
 * main.ts — Punto de entrada de la aplicación Vue 3
 *
 * Este archivo es el primero que ejecuta el navegador al cargar la SPA.
 * Su responsabilidad es:
 *   1. Crear la instancia raíz de Vue.
 *   2. Registrar Pinia (gestor de estado global) ANTES que el router,
 *      porque los navigation guards del router ya usan stores (authStore).
 *   3. Registrar Vue Router para habilitar la navegación entre vistas.
 *   4. Montar la aplicación en el elemento #app del index.html.
 *
 * Conexiones:
 *   → App.vue        (componente raíz que se monta)
 *   → router/index.ts (definición de rutas y guards)
 *   → style.css      (estilos globales de la app)
 */

import { createApp } from 'vue'    // Crea la instancia principal de Vue 3
import { createPinia } from 'pinia' // Factory del gestor de estado global Pinia
import App from './App.vue'
import router from './router'
import './style.css'

// Crea la instancia de Vue con App.vue como componente raíz
const app = createApp(App)

// Crea la instancia de Pinia (contenedor de todos los stores)
const pinia = createPinia()

// IMPORTANTE: Pinia debe registrarse ANTES del router.
// Los navigation guards en router/index.ts llaman a useAuthStore(),
// y un store solo puede usarse después de que Pinia esté instalado en la app.
app.use(pinia)

// Registra el router para que <router-view> y <RouterLink> funcionen
app.use(router)

// Inyecta la app Vue en el <div id="app"> del archivo public/index.html
app.mount('#app')
