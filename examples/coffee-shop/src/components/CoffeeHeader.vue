<script setup lang="ts">
import { useCoffeeCart } from '../composables/useCoffeeCart'

defineEmits<{ openCart: [] }>()
const { itemCount } = useCoffeeCart()
</script>

<template>
  <header class="site-header">
    <RouterLink class="brand" to="/">
      <span class="brand-mark" aria-hidden="true">MR</span>
      <span><strong>The Morning Ritual</strong><small>Specialty coffee, precisely made.</small></span>
    </RouterLink>
    <nav class="main-nav" aria-label="Main navigation">
      <RouterLink to="/" exact-active-class="router-link-active">Shop</RouterLink>
      <RouterLink to="/product/the-alchemist">The Alchemist</RouterLink>
      <RouterLink to="/orders">Orders</RouterLink>
      <button class="cart-button" type="button" aria-label="Open shopping cart" @click="$emit('openCart')">Cart <span>{{ itemCount }}</span></button>
    </nav>
  </header>
</template>
