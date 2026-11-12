<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <p class="not-found-code">404</p>
      <p class="not-found-title">Página no encontrada</p>
      <p class="not-found-desc">La página que buscas no existe o fue movida.</p>
      <button class="btn-home" @click="router.push('/')">Volver al inicio</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  background: #f4f5f7;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}
.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
.not-found-code {
  font-size: 7rem;
  font-weight: 700;
  color: #d1d5db;
  line-height: 1;
  letter-spacing: -4px;
}
.not-found-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}
.not-found-desc {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}
.btn-home {
  background: #111827;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
  font-family: inherit;
}
.btn-home:hover {
  background: #1f2937;
}
</style>
