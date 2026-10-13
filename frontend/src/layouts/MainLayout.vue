<template>
  <div class="layout-container">
    <!-- Barra de navegación superior -->
    <header class="navbar">
      <h1>Libre de Conflictos</h1>
      <nav>
        <router-link to="/">Inicio</router-link> |
        <router-link to="/eventos">Eventos y Conflictos</router-link>
      </nav>
    </header>

    <!-- Contenido dinámico que cambia según la ruta -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Pie de página -->
    <footer>
      <p>&copy; 2026 - Gestión de Horarios</p>
    </footer>
  </div>
</template>

<style scoped>
.layout-container {
  font-family: Arial, sans-serif;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.navbar {
  background-color: #2c3e50;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.navbar nav a {
  color: white;
  text-decoration: none;
  margin-left: 15px;
  font-weight: bold;
}
.navbar nav a.router-link-exact-active {
  color: #42b983;
}
.main-content {
  flex: 1;
  padding: 2rem;
  background-color: #f9f9f9;
}
footer {
  text-align: center;
  padding: 1rem;
  background-color: #333;
  color: white;
}
</style>