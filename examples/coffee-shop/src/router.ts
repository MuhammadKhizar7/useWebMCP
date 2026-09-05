import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import ProductPage from './pages/ProductPage.vue'
import OrdersPage from './pages/OrdersPage.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomePage },
    { path: '/product/:slug', component: ProductPage },
    { path: '/orders', component: OrdersPage },
  ],
})
