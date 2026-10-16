<template>
  <div class="layout-container">
    <header class="navbar">
      <RouterLink to="/" class="logo">
        <span>📅</span>
        <span>Libre de Conflictos</span>
      </RouterLink>
      <nav class="nav-links">
        <RouterLink to="/">Inicio</RouterLink>
        <RouterLink to="/eventos">Eventos</RouterLink>
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
  background: linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%);
  padding: 0 2rem;
  height: 64px;
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
  font-size: 1.25rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  gap: 0.25rem;
}

.nav-links a {
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  position: relative;
  transition: color 0.2s, background 0.2s;
}

.nav-links a:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
}

.nav-links a.router-link-active {
  color: white;
  font-weight: 600;
}

.nav-links a.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0.5rem;
  right: 0.5rem;
  height: 2px;
  background: #d1d5db;
  border-radius: 2px;
}

.main-content {
  flex: 1;
  background: #f3f4f6;
  padding: 2rem 1rem;
}

.footer {
  background: #374151;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 1rem;
  font-size: 0.875rem;
}
</style>
