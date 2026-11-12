<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../store/authStore';

const router = useRouter();
const authStore = useAuthStore();

async function handleLogout() {
  if (!confirm('¿Seguro que quieres cerrar sesión?')) return;
  await authStore.logout();
  router.push('/login');
}
</script>

<template>
  <div class="layout-container">
    <header class="navbar">
      <RouterLink to="/" class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Libre de Conflictos</span>
      </RouterLink>
      <nav class="nav-links">
        <RouterLink to="/">Inicio</RouterLink>
        <RouterLink to="/eventos">Eventos</RouterLink>
        <RouterLink v-if="authStore.isAuthenticated" to="/calendario">Calendario</RouterLink>
        <RouterLink v-if="authStore.isAuthenticated" to="/perfil">Perfil</RouterLink>
        <button
          v-if="authStore.isAuthenticated"
          class="logout-btn"
          @click="handleLogout"
        >
          Cerrar Sesión
        </button>
      </nav>
    </header>

    <main class="main-content">
      <router-view />
    </main>

    <footer class="footer">
      © 2026 Libre de Conflictos — Gestión inteligente de agendas
    </footer>
  </div>
</template>

<style scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background: #1e2024;
  padding: 0 1.5rem;
  height: 60px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  padding: 0.5rem 0.875rem;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: color 0.2s, background 0.2s;
}

.nav-links a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.08);
}

.nav-links a.router-link-active {
  color: white;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  border-left: 2px solid white;
}

.logout-btn {
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 0.4rem 0.875rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;
  margin-left: 0.25rem;
  font-family: inherit;
}

.logout-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.main-content {
  flex: 1;
  background: #f4f5f7;
  padding: 2rem 1.5rem;
}

.footer {
  background: #1e2024;
  color: #6b7280;
  text-align: center;
  padding: 1rem;
  font-size: 0.8125rem;
}
</style>
