import { getProductById } from './catalog'

export interface OrderLine {
  productId: string
  quantity: number
  price: number
}

export interface Order {
  id: string
  placedAt: string
  status: 'Delivered' | 'In transit'
  total: number
  lines: OrderLine[]
}

export const orders: Order[] = [
  {
    id: 'MR-1048',
    placedAt: 'August 24, 2026',
    status: 'Delivered',
    total: 39,
    lines: [{ productId: 'dark-roast-no-4', quantity: 1, price: 18 }, { productId: 'quiet-morning', quantity: 1, price: 21 }],
  },
  {
    id: 'MR-1012',
    placedAt: 'July 08, 2026',
    status: 'Delivered',
    total: 906,
    lines: [{ productId: 'the-alchemist', quantity: 1, price: 890 }, { productId: 'linen-filter-set', quantity: 1, price: 16 }],
  },
  {
    id: 'MR-0991',
    placedAt: 'June 17, 2026',
    status: 'Delivered',
    total: 36,
    lines: [{ productId: 'dark-roast-no-4', quantity: 2, price: 18 }],
  },
]

export function getOrderLines(order: Order): Array<OrderLine & { name: string }> {
  if (!order || !Number.isFinite(order.total) || !Array.isArray(order.lines)) return []
  return order.lines.flatMap((line) => {
    if (!line || typeof line.productId !== 'string' || !Number.isInteger(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.price)) return []
    const product = getProductById(line.productId)
    return product ? [{ ...line, name: product.name }] : []
  })
}

export function getCoffeeOrderLines(order: Order): OrderLine[] {
  return getOrderLines(order)
    .filter((line) => getProductById(line.productId)?.category === 'coffee')
    .map(({ productId, quantity, price }) => ({ productId, quantity, price }))
}

export function getOrderHistory(): Order[] {
  return orders.map((order) => ({ ...order, lines: order.lines.map((line) => ({ ...line })) }))
}
