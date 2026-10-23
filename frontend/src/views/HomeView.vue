<template>
  <div>
    <!-- Hero Section -->
    <section class="hero">
      <span class="badge">Sistema Inteligente de Calendarios</span>
      <h1 class="hero-title">Gestiona tu agenda sin conflictos</h1>
      <p class="hero-desc">
        Detecta solapamientos de horario en tiempo real, organiza tus eventos y mantén el control
        total de tu agenda personal.
      </p>
      <RouterLink to="/eventos" class="cta-button">Comenzar Ahora →</RouterLink>
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="features-title">¿Por qué Libre de Conflictos?</h2>
      <div class="features-grid">
        <div class="feature-card">
          <span class="feature-icon">📅</span>
          <h3 class="feature-card-title">Crea Eventos</h3>
          <p class="feature-card-desc">
            Registra tus compromisos con fecha, hora y zona horaria. Mantén todo organizado en un
            solo lugar.
          </p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🔍</span>
          <h3 class="feature-card-title">Detecta Conflictos</h3>
          <p class="feature-card-desc">
            El sistema verifica automáticamente si dos eventos se solapan en el tiempo y te avisa
            al instante.
          </p>
        </div>
        <div class="feature-card">
          <span class="feature-icon">✅</span>
          <h3 class="feature-card-title">Sin solapamientos</h3>
          <p class="feature-card-desc">
            Organiza tu agenda con la certeza de que ningún evento interfiere con otro. Productividad
            sin caos.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero */
.hero {
  background: linear-gradient(135deg, #111111 0%, #2b2a2c 100%);
  color: white;
  text-align: center;
  padding: 5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.badge {
  background: rgba(53, 53, 54, 0.2);
  border: 1px solid rgba(22, 20, 23, 0.5);
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-size: 0.875rem;
  color: #e4e0e9;
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: white;
}

.hero-desc {
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  margin: 0 auto 2.5rem;
}

.cta-button {
  background: linear-gradient(135deg, #2c2b2e, #302f30);
  color: white;
  padding: 0.875rem 2.5rem;
  border-radius: 50px;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(80, 77, 82, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(41, 39, 42, 0.6);
}

/* Features */
.features {
  background: #f8f7ff;
  padding: 4rem 2rem;
}

.features-title {
  text-align: center;
  color: #29292a;
  font-size: 2rem;
  margin-bottom: 3rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  max-width: 960px;
  margin: 0 auto;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(29, 27, 31, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  display: block;
}

.feature-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #444448;
  margin-bottom: 0.75rem;
}

.feature-card-desc {
  color: #363637;
  line-height: 1.6;
}

/* Responsive */
@media (max-width: 640px) {
  .hero-title {
    font-size: 2rem;
  }
}
</style>
