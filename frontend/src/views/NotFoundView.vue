<template>
  <div class="not-found-page">
    <div class="not-found-card">
      <h1 class="not-found-code">404</h1>
      <p class="not-found-msg">Página no encontrada</p>
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
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.not-found-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 3rem 4rem;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  text-align: center;
}
.not-found-code {
  font-size: 6rem;
  font-weight: 700;
  color: #9ca3af;
  margin: 0 0 0.5rem;
  line-height: 1;
}
.not-found-msg {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0 0 2rem;
}
.btn-home {
  background: #4f46e5;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-home:hover {
  background: #4338ca;
}
</style>
