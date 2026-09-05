<script setup lang="ts">
import type { Product } from '../data/catalog'

defineProps<{ product: Product }>()
defineEmits<{ add: [productId: string] }>()
</script>

<template>
  <article class="product-card">
    <RouterLink class="product-art" :style="{ backgroundColor: product.accent }" :to="`/product/${product.slug}`" :aria-label="`View ${product.name}`">
      <span>{{ product.category }}</span><strong>{{ product.name }}</strong>
    </RouterLink>
    <div class="product-card-copy"><div><h3>{{ product.name }}</h3><p>{{ product.description }}</p></div><strong>${{ product.price }}</strong></div>
    <button class="text-button" type="button" @click="$emit('add', product.id)">Add to cart <span aria-hidden="true">+</span></button>
  </article>
</template>
