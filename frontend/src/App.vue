<template>
  <!--
    <router-view> renderiza la vista que corresponde a la URL actual.
    Cuando la ruta es '/', renderiza MainLayout (que a su vez contiene
    otro <router-view> para las vistas hijas: Home, Eventos, etc.).
    Cuando la ruta es '/login' o '/registro', renderiza esas vistas directamente.
  -->
  <router-view />

  <!--
    ToastContainer está FUERA de <router-view> de forma deliberada.
    Si estuviera dentro de MainLayout (que solo se monta en rutas autenticadas),
    los toasts no existirían en las páginas de Login y Registro.
    Al colocarlo aquí, en el componente raíz, está disponible en absolutamente
    todas las rutas de la aplicación.
  -->
  <ToastContainer />
</template>

<script setup lang="ts">
/*
 * App.vue — Componente raíz de la aplicación
 *
 * Este componente es el punto de montaje que renderiza toda la UI.
 * Contiene dos elementos:
 *   - <router-view>: muestra la vista activa según la URL actual.
 *   - <ToastContainer>: sistema global de notificaciones; vive fuera
 *     del layout principal para estar presente en todas las rutas,
 *     incluidas Login y Registro que no usan MainLayout.
 *
 * Conexiones:
 *   → components/ToastContainer.vue  (notificaciones globales)
 *   → router/index.ts               (controla qué vista muestra <router-view>)
 *   → layouts/MainLayout.vue        (layout para rutas autenticadas/públicas)
 */
import ToastContainer from './components/ToastContainer.vue';
</script>
