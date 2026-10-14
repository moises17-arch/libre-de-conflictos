import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../layouts/MainLayout.vue';
import HomeView from '../views/HomeView.vue';
import EventosView from '../views/EventosView.vue';

const routes = [
  {
    path: '/',
    component: MainLayout, // El diseño general con la barra de navegación
    children: [
      {
        path: '',
        name: 'Home',
        component: HomeView // Pantalla de inicio
      },
      {
        path: 'eventos',
        name: 'Eventos',
        component: EventosView // Pantalla de eventos y conflictos
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;