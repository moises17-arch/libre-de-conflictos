/*
 * router/index.ts — Configuración del enrutador de Vue Router
 *
 * Este archivo define TODAS las rutas de la SPA y el navigation guard global
 * que protege las rutas que requieren autenticación.
 *
 * Estructura de rutas:
 *   / (MainLayout)
 *     ├── ''         → HomeView      (pública: dashboard o landing según auth)
 *     ├── eventos    → EventosView   (requiere auth)
 *     ├── calendario → CalendarioView (requiere auth, carga diferida)
 *     └── perfil     → PerfilView    (requiere auth, carga diferida)
 *   /login           → LoginView     (pública)
 *   /registro        → RegisterView  (pública)
 *   /*               → NotFoundView  (catch-all 404)
 *
 * Conexiones:
 *   → store/authStore.ts  (para leer el token en el navigation guard)
 *   → layouts/MainLayout.vue
 *   → views/* (todas las vistas)
 */

import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import HomeView from '../views/HomeView.vue';
import EventosView from '../views/EventosView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { useAuthStore } from '../store/authStore';

const routes = [
  {
    path: '/',
    component: MainLayout, // Envuelve todas las vistas hijas con navbar y footer
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView // Vista pública: muestra landing o dashboard según auth
      },
      {
        path: 'eventos',
        name: 'Eventos',
        component: EventosView,
        meta: { requiresAuth: true } // El guard redirige a /login si no hay sesión
      },
      {
        // Lazy loading: CalendarioView se descarga solo cuando el usuario navega aquí.
        // Reduce el bundle inicial de la app, ya que FullCalendar es una librería pesada.
        path: 'calendario',
        name: 'Calendario',
        component: () => import('../views/CalendarioView.vue'),
        meta: { requiresAuth: true }
      },
      {
        // Lazy loading: PerfilView raramente es la primera pantalla que se visita,
        // por lo que no tiene sentido incluirla en el bundle principal.
        path: 'perfil',
        name: 'Perfil',
        component: () => import('../views/PerfilView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    // Ruta de login: pública, sin MainLayout (tiene su propio diseño de pantalla completa)
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    // Ruta de registro: igual que login, diseño propio sin navbar
    path: '/registro',
    name: 'Registro',
    component: RegisterView
  },
  // Captura cualquier ruta no definida y muestra la página 404
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: NotFoundView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

/*
 * Navigation guard global — se ejecuta ANTES de cada cambio de ruta.
 *
 * Por qué se llama initAuth() aquí:
 *   Cuando el usuario recarga la página (F5), Vue destruye y recrea todos los stores.
 *   Pinia no persiste datos entre recargas, así que el store quedaría vacío y el usuario
 *   parecería deslogueado. initAuth() rehidrata el store desde localStorage para que
 *   la sesión sobreviva la recarga.
 */
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();

  // Rehidrata el store desde localStorage (crítico para recargas de página)
  authStore.initAuth();

  const token = localStorage.getItem('accessToken');

  // BLOQUE 1: La ruta requiere autenticación pero no hay token → ir a login
  if (to.meta.requiresAuth && !token) {
    next('/login');
    return;
  }

  // BLOQUE 2: Ya hay sesión activa y el usuario intenta volver a login/registro.
  // No tiene sentido mostrárselas, así que lo redirigimos a la vista principal.
  if (token && (to.path === '/login' || to.path === '/registro')) {
    next('/eventos');
    return;
  }

  // Sin restricciones: deja pasar la navegación normalmente
  next();
});

export default router;
