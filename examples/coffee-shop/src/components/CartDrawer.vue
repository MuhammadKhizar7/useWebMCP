<script setup lang="ts">
import { nextTick, onBeforeUnmount, useTemplateRef, watch } from 'vue'
import { useCoffeeCart } from '../composables/useCoffeeCart'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const drawerRef = useTemplateRef<HTMLElement>('drawer')
const { items, total, removeFromCart, setQuantity, placeTestOrder } = useCoffeeCart()
let restoreFocus: HTMLElement | null = null
let previousOverflow = ''

function focusableElements(): HTMLElement[] {
  return drawerRef.value
    ? Array.from(drawerRef.value.querySelectorAll<HTMLElement>('button, input, a, [tabindex]:not([tabindex="-1"])')).filter((element) => !element.hasAttribute('disabled'))
    : []
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') { emit('close'); return }
  if (event.key !== 'Tab') return
  const elements = focusableElements()
  if (!elements.length) return
  const first = elements[0]!
  const last = elements[elements.length - 1]!
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
}

watch(() => props.open, async (open) => {
  if (open) {
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    drawerRef.value?.querySelector<HTMLElement>('.icon-button')?.focus()
  } else {
    document.body.style.overflow = previousOverflow
    document.removeEventListener('keydown', onKeydown)
    restoreFocus?.focus()
    restoreFocus = null
  }
}, { immediate: true })

onBeforeUnmount(() => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeydown) })
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="drawer-backdrop" role="presentation" @click.self="emit('close')">
      <aside ref="drawer" class="cart-drawer" aria-labelledby="cart-title" aria-modal="true" role="dialog">
        <div class="drawer-heading"><div><p class="eyebrow">Your ritual</p><h2 id="cart-title">Cart</h2></div><button class="icon-button" type="button" aria-label="Close cart" @click="emit('close')">×</button></div>
        <div v-if="items.length" class="cart-lines">
          <div v-for="item in items" :key="item.product.id" class="cart-line"><div><strong>{{ item.product.name }}</strong><small>${{ item.product.price }} · {{ item.product.unit }}</small></div><label>Qty <input :value="item.quantity" type="number" min="1" max="20" @change="setQuantity(item.product.id, Number(($event.target as HTMLInputElement).value))"></label><button class="remove-button" type="button" @click="removeFromCart(item.product.id)">Remove</button></div>
        </div>
        <p v-else class="cart-empty">Your next good cup starts here.</p>
        <div class="drawer-footer"><div><span>Total</span><strong>${{ total }}</strong></div><button class="button button-dark" type="button" :disabled="!items.length" @click="placeTestOrder">Place local test order</button><p class="drawer-note">Demo only: this clears the cart and does not create or save an order.</p></div>
      </aside>
    </div>
  </Teleport>
</template>
