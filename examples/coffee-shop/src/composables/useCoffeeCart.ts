import { computed, reactive, readonly } from 'vue'
import { getProductById, type Product } from '../data/catalog'
import { getCoffeeOrderLines, getOrderHistory } from '../data/orders'

export interface CartItem {
  product: Product
  quantity: number
}

interface CoffeeState {
  items: CartItem[]
  toast: string | null
  highlightedSpecification: string | null
}

const state = reactive<CoffeeState>({ items: [], toast: null, highlightedSpecification: null })
let toastTimer: ReturnType<typeof setTimeout> | undefined

function validQuantity(quantity: unknown): quantity is number {
  return typeof quantity === 'number' && Number.isInteger(quantity) && quantity > 0 && quantity <= 20
}

function showToast(message: string): void {
  state.toast = message
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { state.toast = null }, 3200)
}

export function useCoffeeCart() {
  const itemCount = computed(() => state.items.reduce((sum, item) => sum + item.quantity, 0))
  const total = computed(() => state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0))

  function addToCart(productId: unknown, quantity: unknown = 1): boolean {
    if (typeof productId !== 'string' || !validQuantity(quantity)) return false
    const product = getProductById(productId)
    if (!product) return false
    const existing = state.items.find((item) => item.product.id === productId)
    if (existing) existing.quantity = Math.min(existing.quantity + quantity, 20)
    else state.items.push({ product, quantity })
    showToast(`${product.name} added to your cart`)
    return true
  }

  function removeFromCart(productId: unknown): boolean {
    if (typeof productId !== 'string') return false
    const index = state.items.findIndex((item) => item.product.id === productId)
    if (index < 0) return false
    state.items.splice(index, 1)
    return true
  }

  function setQuantity(productId: unknown, quantity: unknown): boolean {
    if (typeof productId !== 'string' || !validQuantity(quantity)) return false
    const item = state.items.find((entry) => entry.product.id === productId)
    if (!item) return false
    item.quantity = quantity
    return true
  }

  function reorderProduct(productId: unknown, quantity: unknown = 1): boolean {
    const result = addToCart(productId, quantity)
    if (result) showToast('Your usual coffee is ready in the cart')
    return result
  }

  function reorderOrder(orderId: unknown): boolean {
    if (typeof orderId !== 'string') return false
    const order = getOrderHistory().find((entry) => entry.id === orderId)
    if (!order) return false
    const coffeeLines = getCoffeeOrderLines(order)
    if (!coffeeLines.length) {
      showToast('This order has no coffee to reorder')
      return false
    }
    let added = false
    for (const line of coffeeLines) added = addToCart(line.productId, line.quantity) || added
    if (added) showToast('Your coffee regulars are ready in the cart')
    return added
  }

  function highlightSpecification(name: unknown): boolean {
    if (typeof name !== 'string' || !getProductById('the-alchemist')?.specifications?.[name]) return false
    state.highlightedSpecification = name
    return true
  }

  function clearSpecificationHighlight(): void { state.highlightedSpecification = null }

  function dismissToast(): void { state.toast = null }
  function clearCart(): void { state.items.splice(0, state.items.length) }

  function placeTestOrder(): boolean {
    if (!state.items.length) return false
    clearCart()
    showToast('Local demo only: cart cleared; no order was placed')
    return true
  }

  return {
    items: readonly(state).items,
    itemCount,
    total,
    toast: computed(() => state.toast),
    highlightedSpecification: computed(() => state.highlightedSpecification),
    addToCart,
    removeFromCart,
    setQuantity,
    reorderProduct,
    reorderOrder,
    highlightSpecification,
    clearSpecificationHighlight,
    dismissToast,
    clearCart,
    placeTestOrder,
    getOrderHistory,
  }
}

export function getCoffeeState(): Readonly<CoffeeState> { return state }
