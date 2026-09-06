<script setup lang="ts">
const cart = ref<Array<{ id: string; name: string; price: number; quantity: number }>>([])
const toast = ref('')

const products = [
  { id: 'espresso-blend', name: 'Espresso Blend', price: 18, description: 'Rich, bold single-origin espresso' },
  { id: 'morning-roast', name: 'Morning Roast', price: 14, description: 'Smooth medium roast for everyday' },
  { id: 'dark-reserve', name: 'Dark Reserve', price: 22, description: 'Full-bodied dark roast with chocolate notes' },
  { id: 'cold-brew', name: 'Cold Brew Concentrate', price: 16, description: 'Ready-to-drink cold brew, 32oz' },
]

const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
const cartCount = computed(() => cart.value.reduce((sum, item) => sum + item.quantity, 0))

function showToast(msg: string) {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 3000)
}

// Tool 1: search_products (readOnly)
const { supported, registered, error } = useWebMCP({
  name: 'search_products',
  description: 'Search the coffee product catalog by name or keyword',
  annotations: { readOnlyHint: true },
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search term to filter products' },
    },
    required: ['query'],
  },
  execute: (args) => {
    const query = (args as any)?.query?.toLowerCase() ?? ''
    const results = products.filter(
      (p) => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query),
    )
    return results.map((p) => ({ id: p.id, name: p.name, price: p.price, description: p.description }))
  },
})

// Tool 2: add_to_cart (state-changing)
useWebMCP({
  name: 'add_to_cart',
  description: 'Add a product to the shopping cart',
  inputSchema: {
    type: 'object',
    properties: {
      productId: { type: 'string', description: 'The product ID to add' },
      quantity: { type: 'number', description: 'Number of items (1-10)' },
    },
    required: ['productId'],
  },
  execute: (args) => {
    const { productId, quantity = 1 } = args as any
    const product = products.find((p) => p.id === productId)
    if (!product) return { success: false, error: `Unknown product: ${productId}` }
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1))

    const existing = cart.value.find((item) => item.id === productId)
    if (existing) {
      existing.quantity += qty
    } else {
      cart.value.push({ id: product.id, name: product.name, price: product.price, quantity: qty })
    }

    showToast(`Added ${qty}x ${product.name} to cart`)
    return { success: true, productId, quantity: qty, cartTotal: cartTotal.value, cartCount: cartCount.value }
  },
})

// Tool 3: get_cart_summary (readOnly)
useWebMCP({
  name: 'get_cart_summary',
  description: 'Get the current cart contents and total',
  annotations: { readOnlyHint: true },
  inputSchema: { type: 'object', properties: {} },
  execute: () => ({
    items: cart.value.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    })),
    totalItems: cartCount.value,
    totalPrice: cartTotal.value,
  }),
})
</script>

<template>
  <div class="playground">
    <header>
      <h1>Nuxt WebMCP Playground</h1>
      <div class="status-panel" data-testid="status">
        <span :class="['status-dot', supported ? 'green' : 'red']" />
        <span>WebMCP: {{ supported ? 'Supported' : 'Unavailable' }}</span>
        <span v-if="registered" class="badge">3 tools registered</span>
        <span v-if="error" class="error">Error: {{ error.message }}</span>
      </div>
    </header>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toast" class="toast" data-testid="toast">{{ toast }}</div>
    </Transition>

    <!-- Cart badge -->
    <div v-if="cartCount > 0" class="cart-badge" data-testid="cart-badge">
      Cart: {{ cartCount }} items &mdash; ${{ cartTotal.toFixed(2) }}
    </div>

    <!-- Products -->
    <section class="products">
      <h2>Products</h2>
      <div class="product-grid">
        <div v-for="product in products" :key="product.id" class="product-card" :data-testid="`product-${product.id}`">
          <h3>{{ product.name }}</h3>
          <p>{{ product.description }}</p>
          <span class="price">${{ product.price }}</span>
        </div>
      </div>
    </section>

    <!-- Cart contents -->
    <section v-if="cart.length > 0" class="cart-section">
      <h2>Your Cart</h2>
      <table data-testid="cart-table">
        <thead>
          <tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr>
        </thead>
        <tbody>
          <tr v-for="item in cart" :key="item.id">
            <td>{{ item.name }}</td>
            <td>${{ item.price }}</td>
            <td>{{ item.quantity }}</td>
            <td>${{ (item.price * item.quantity).toFixed(2) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3"><strong>Total</strong></td>
            <td><strong>${{ cartTotal.toFixed(2) }}</strong></td>
          </tr>
        </tfoot>
      </table>
    </section>

    <footer>
      <p>Tools registered: <code>search_products</code>, <code>add_to_cart</code>, <code>get_cart_summary</code></p>
      <p>Use Chrome DevTools MCP to call <code>document.modelContext.getTools()</code> and <code>executeTool()</code>.</p>
    </footer>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #fafafa; color: #1a1a1a; }
.playground { max-width: 800px; margin: 0 auto; padding: 2rem; }

header { margin-bottom: 2rem; }
h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
.status-panel { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
.status-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.status-dot.green { background: #22c55e; }
.status-dot.red { background: #ef4444; }
.badge { background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; }
.error { color: #ef4444; }

.toast {
  position: fixed; top: 1rem; right: 1rem;
  background: #1a1a1a; color: white; padding: 0.75rem 1.25rem;
  border-radius: 8px; font-size: 0.9rem; z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }

.cart-badge {
  position: fixed; top: 1rem; right: 1rem;
  background: #059669; color: white; padding: 0.5rem 1rem;
  border-radius: 8px; font-weight: 600; z-index: 90;
}

section { margin-bottom: 2rem; }
h2 { font-size: 1.3rem; margin-bottom: 1rem; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.product-card {
  background: white; border: 1px solid #e5e7eb; border-radius: 8px;
  padding: 1rem; transition: box-shadow 0.2s;
}
.product-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.product-card h3 { font-size: 1rem; margin-bottom: 0.25rem; }
.product-card p { font-size: 0.85rem; color: #6b7280; margin-bottom: 0.5rem; }
.price { font-weight: 600; color: #059669; }

.cart-section table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; }
.cart-section th, .cart-section td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.cart-section th { background: #f9fafb; font-size: 0.85rem; text-transform: uppercase; color: #6b7280; }
.cart-section tfoot td { border-bottom: none; }

footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.85rem; color: #6b7280; }
footer code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }
</style>
