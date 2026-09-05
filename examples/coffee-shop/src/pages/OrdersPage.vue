<script setup lang="ts">
import { getOrderHistory, getOrderLines } from '../data/orders'
import { useCoffeeCart } from '../composables/useCoffeeCart'

const orderHistory = getOrderHistory()
const { reorderOrder } = useCoffeeCart()
</script>

<template>
  <section class="page orders-page"><p class="eyebrow">Your ritual</p><h1>Order history</h1><p class="lede">Your regulars, ready when you are. “Reorder coffee” adds only coffee from an order, never equipment or accessories.</p><div class="orders-list"><article v-for="order in orderHistory" :key="order.id" class="order-card"><div class="order-heading"><div><span class="order-id">{{ order.id }}</span><h2>{{ order.placedAt }}</h2></div><span class="status">{{ order.status }}</span></div><ul class="order-lines"><li v-for="line in getOrderLines(order)" :key="line.productId"><span>{{ line.quantity }} × {{ line.name }}</span><strong>${{ line.price * line.quantity }}</strong></li></ul><div class="order-footer"><span>Total <strong>${{ order.total }}</strong></span><button class="text-button" type="button" @click="reorderOrder(order.id)">Reorder coffee</button></div></article></div></section>
</template>
