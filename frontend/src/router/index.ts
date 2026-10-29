import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import HomeView from '../views/HomeView.vue';
import EventosView from '../views/EventosView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView
      },
      {
        path: 'eventos',
        name: 'Eventos',
        component: EventosView,
        meta: { requiresAuth: true }
      },
      {
        path: 'calendario',
        name: 'Calendario',
        component: () => import('../views/CalendarioView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'perfil',
        name: 'Perfil',
        component: () => import('../views/PerfilView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/registro',
    name: 'Registro',
    component: RegisterView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('accessToken');

  if (to.meta.requiresAuth && !token) {
    next('/login');
    return;
  }

  if (token && (to.path === '/login' || to.path === '/registro')) {
    next('/eventos');
    return;
  }

  next();
});

export default router;
