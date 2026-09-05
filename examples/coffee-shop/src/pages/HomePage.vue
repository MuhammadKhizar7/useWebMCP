<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import ProductCard from '../components/ProductCard.vue'
import { searchCatalog } from '../data/catalog'
import { useCoffeeCart } from '../composables/useCoffeeCart'

const query = shallowRef('')
const { addToCart } = useCoffeeCart()
const products = computed(() => searchCatalog(query.value))
</script>

<template>
  <section class="page home-page">
    <div class="hero-copy"><p class="eyebrow">A slower kind of morning</p><h1>Coffee with a <em>point of view.</em></h1><p class="lede">Small-batch beans, thoughtful equipment, and rituals worth repeating.</p></div>
    <div class="shop-toolbar"><div><p class="eyebrow">The collection</p><h2>Find your next ritual.</h2></div><label class="search-field"><span>Search the shop</span><input v-model="query" type="search" placeholder="Try espresso or walnut" aria-label="Search coffee shop catalog"></label></div>
    <div v-if="products.length" class="product-grid"><ProductCard v-for="product in products" :key="product.id" :product="product" @add="addToCart"></ProductCard></div>
    <div v-else class="empty-state"><strong>No matches yet.</strong><p>Try a roast, method, or one of our signature pieces.</p></div>
  </section>
</template>
