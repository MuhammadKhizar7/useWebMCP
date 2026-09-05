<script setup lang="ts">
import { shallowRef } from 'vue'
import CoffeeHeader from './components/CoffeeHeader.vue'
import CartDrawer from './components/CartDrawer.vue'
import ToastMessage from './components/ToastMessage.vue'
import { useCoffeeCart } from './composables/useCoffeeCart'
import { useCoffeeTools } from './composables/useCoffeeTools'

const { supported } = useCoffeeTools()
const cartOpen = shallowRef(false)
const { toast } = useCoffeeCart()
</script>

<template>
  <div class="app-shell" :inert="cartOpen">
    <CoffeeHeader @open-cart="cartOpen = true" />

    <aside v-if="!supported" class="support-note" aria-live="polite">
      <span class="support-dot" aria-hidden="true" />
      WebMCP is optional here. The shop works normally in this browser.
    </aside>

    <main>
      <RouterView />
    </main>
    <CartDrawer :open="cartOpen" @close="cartOpen = false" />
    <ToastMessage :message="toast" />
  </div>
</template>
