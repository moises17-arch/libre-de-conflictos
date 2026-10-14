import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // <-- Importamos el router que acabamos de crear
import './style.css';

const app = createApp(App);

app.use(router); // <-- Lo registramos en la app

app.mount('#app');