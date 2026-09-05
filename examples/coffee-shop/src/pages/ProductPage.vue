<script setup lang="ts">
import { computed, nextTick, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProductBySlug } from '../data/catalog'
import { useCoffeeCart } from '../composables/useCoffeeCart'
import { useCoffeeTools } from '../composables/useCoffeeTools'

const route = useRoute()
const product = computed(() => getProductBySlug(String(route.params.slug)))
const quantity = shallowRef(1)
const specRefs = new Map<string, HTMLElement>()
const { addToCart, highlightSpecification, clearSpecificationHighlight, highlightedSpecification } = useCoffeeCart()

watch(() => route.params.slug, () => {
  specRefs.clear()
  clearSpecificationHighlight()
}, { immediate: true })

function setSpecRef(name: string, element: Element | null): void {
  if (element instanceof HTMLElement) specRefs.set(name, element)
}

async function showSpecification(name: string): Promise<void> {
  if (!highlightSpecification(name)) return
  await nextTick()
  specRefs.get(name)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

useCoffeeTools({
  includeAppTools: false,
  machineProductId: () => product.value?.specifications ? product.value.id : undefined,
  onSpecification: showSpecification,
})
</script>

<template>
  <section v-if="product" class="page detail-page">
    <p class="eyebrow">{{ product.category }} / considered goods</p><h1>{{ product.name }}</h1><p class="lede">{{ product.longDescription }}</p>
    <div class="detail-layout"><div class="product-visual" :style="{ backgroundColor: product.accent }" role="img" :aria-label="`${product.name} product illustration`"><span>{{ product.category }}</span><strong>{{ product.name }}</strong></div><div class="purchase-panel"><div class="price-line"><strong>${{ product.price }}</strong><span>{{ product.unit }}</span></div><div class="purchase-actions"><label>Quantity <input v-model.number="quantity" type="number" min="1" max="20"></label><button class="button button-dark" type="button" @click="addToCart(product.id, quantity)">Add to cart</button></div><p class="fine-print">Ships in 2–3 considered business days.</p></div></div>
    <section v-if="product.specifications" class="spec-section" aria-labelledby="spec-title"><div><p class="eyebrow">Know your machine</p><h2 id="spec-title">Specifications, without the noise.</h2><p class="lede">Ask about a detail, or use the list as a quick setup guide.</p></div><dl class="spec-list"><div v-for="(value, name) in product.specifications" :key="name" :ref="(element) => setSpecRef(name, element)" :class="{ 'spec-highlight': highlightedSpecification === name }"><dt>{{ name }}</dt><dd>{{ value }}</dd><button class="spec-button" type="button" @click="showSpecification(name)">Focus</button></div></dl></section>
  </section>
  <section v-else class="page empty-state"><p class="eyebrow">That one wandered off</p><h1>Product not found.</h1><RouterLink class="button button-dark" to="/">Return to the shop</RouterLink></section>
</template>
