import { beforeEach, describe, expect, it } from 'vitest'
import { catalog, getProductBySlug, searchCatalog } from '../src/data/catalog'
import { getCoffeeOrderLines, getOrderHistory, getOrderLines } from '../src/data/orders'
import { getCoffeeState, useCoffeeCart } from '../src/composables/useCoffeeCart'

describe('coffee shop fixtures', () => {
  it('searches deterministic product fields', () => {
    expect(searchCatalog('walnut').map((product) => product.id)).toEqual(['dark-roast-no-4'])
    expect(searchCatalog('ESPRESSO').map((product) => product.id)).toEqual(['the-alchemist'])
    expect(searchCatalog('')).toHaveLength(catalog.length)
    expect(searchCatalog(42)).toEqual([])
  })

  it('resolves product slugs and complete order lines', () => {
    expect(getProductBySlug('the-alchemist')?.name).toBe('The Alchemist')
    expect(getOrderHistory()).toHaveLength(3)
    expect(getOrderLines(getOrderHistory()[0]!)[0]?.name).toBe('Dark Roast No. 4')
    expect(getOrderLines({ ...getOrderHistory()[0]!, lines: [{ productId: 'missing', quantity: 1, price: 1 }] })).toEqual([])
    expect(getOrderLines({ ...getOrderHistory()[0]!, lines: [{ productId: 'dark-roast-no-4', quantity: 1, price: Number.NaN }] })).toEqual([])
    expect(getOrderLines({ ...getOrderHistory()[0]!, lines: [{ productId: 'dark-roast-no-4', quantity: 1, price: Number.POSITIVE_INFINITY }] })).toEqual([])
    expect(getOrderLines({ ...getOrderHistory()[0]!, total: Number.NaN })).toEqual([])
    expect(getOrderLines({ ...getOrderHistory()[0]!, total: Number.NEGATIVE_INFINITY })).toEqual([])
    expect(getCoffeeOrderLines(getOrderHistory()[1]!)).toEqual([])
  })
})

describe('coffee cart action boundary', () => {
  beforeEach(() => {
    const cart = useCoffeeCart()
    cart.clearCart()
    getCoffeeState().toast = null
    getCoffeeState().highlightedSpecification = null
  })

  it('adds, increments, removes, and totals valid products', () => {
    const cart = useCoffeeCart()
    expect(cart.addToCart('dark-roast-no-4', 2)).toBe(true)
    expect(cart.addToCart('dark-roast-no-4', 1)).toBe(true)
    expect(cart.itemCount.value).toBe(3)
    expect(cart.total.value).toBe(54)
    expect(cart.setQuantity('dark-roast-no-4', 4)).toBe(true)
    expect(cart.itemCount.value).toBe(4)
    expect(cart.removeFromCart('dark-roast-no-4')).toBe(true)
    expect(cart.itemCount.value).toBe(0)
  })

  it('rejects malformed action arguments without changing state', () => {
    const cart = useCoffeeCart()
    expect(cart.addToCart('missing-product', 1)).toBe(false)
    expect(cart.addToCart('the-alchemist', 0)).toBe(false)
    expect(cart.addToCart('the-alchemist', '2')).toBe(false)
    expect(cart.reorderProduct('missing-product')).toBe(false)
    expect(cart.itemCount.value).toBe(0)
  })

  it('supports reorder feedback and machine specification highlighting', () => {
    const cart = useCoffeeCart()
    expect(cart.reorderProduct('dark-roast-no-4', 1)).toBe(true)
    expect(cart.itemCount.value).toBe(1)
    expect(getCoffeeState().toast).toBe('Your usual coffee is ready in the cart')
    expect(cart.highlightSpecification('Water tank')).toBe(true)
    expect(getCoffeeState().highlightedSpecification).toBe('Water tank')
    expect(cart.highlightSpecification('Unknown')).toBe(false)
  })

  it('reorders every coffee line while excluding equipment and accessories', () => {
    const cart = useCoffeeCart()
    expect(cart.reorderOrder('MR-1048')).toBe(true)
    expect(cart.itemCount.value).toBe(2)
    expect(cart.total.value).toBe(39)
    cart.clearCart()
    expect(cart.reorderOrder('MR-1012')).toBe(false)
    expect(cart.itemCount.value).toBe(0)
    expect(cart.reorderOrder('unknown-order')).toBe(false)
  })
})
