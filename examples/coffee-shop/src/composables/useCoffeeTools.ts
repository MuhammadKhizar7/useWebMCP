import { toValue, type MaybeRefOrGetter } from 'vue'
import { useWebMCP, type UseWebMCPConfig, type UseWebMCPState } from 'use-vue-webmcp-tool'
import type { WebMCPTool } from 'webmcp-tool-core'
import { getProductById, searchCatalog } from '../data/catalog'
import { getOrderHistory, getOrderLines } from '../data/orders'
import { useCoffeeCart } from './useCoffeeCart'

type ToolContext = { signal: AbortSignal }
type ObjectInput = Record<string, unknown>

export const searchCatalogSchema = {
  type: 'object',
  properties: { query: { type: 'string', description: 'Text to search across product names, categories, descriptions, and tags.' } },
  required: ['query'],
  additionalProperties: false,
} as const

export const getOrderHistorySchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
} as const

export const reorderProductSchema = {
  type: 'object',
  properties: {
    productId: { type: 'string', description: 'The exact catalog product ID.' },
    quantity: { type: 'integer', minimum: 1, maximum: 20, default: 1 },
  },
  required: ['productId'],
  additionalProperties: false,
} as const

export const getMachineSpecificationsSchema = {
  type: 'object',
  properties: { specification: { type: 'string', description: 'The specification name to focus, such as Height or Water tank.' } },
  required: ['specification'],
  additionalProperties: false,
} as const

export interface CoffeeToolsOptions extends UseWebMCPConfig {
  includeAppTools?: boolean
  machineProductId?: MaybeRefOrGetter<string | undefined>
  onSpecification?: (name: string) => void | Promise<void>
}

function inputObject(value: unknown): ObjectInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Arguments must be an object')
  return value as ObjectInput
}

function active(context: ToolContext): void {
  if (context.signal.aborted) throw new Error('Tool execution was aborted')
}

function stringArgument(input: ObjectInput, name: string): string {
  if (typeof input[name] !== 'string' || !input[name]) throw new Error(`${name} must be a non-empty string`)
  return input[name] as string
}

function noExtraKeys(input: ObjectInput, allowed: readonly string[]): void {
  if (Object.keys(input).some((key) => !allowed.includes(key))) throw new Error('Arguments contain an unknown property')
}

function createAppTools(cart: ReturnType<typeof useCoffeeCart>): WebMCPTool<unknown, unknown>[] {
  return [
    {
      name: 'search_catalog',
      description: 'Search the Morning Ritual coffee catalog.',
      inputSchema: searchCatalogSchema,
      annotations: { readOnlyHint: true, openWorldHint: false, untrustedContentHint: true },
      execute: (args: unknown, context: ToolContext) => {
        active(context)
        const input = inputObject(args)
        noExtraKeys(input, ['query'])
        return searchCatalog(stringArgument(input, 'query')).map(({ id, name, category, price }) => ({ id, name, category, price }))
      },
    },
    {
      name: 'get_order_history',
      description: 'Read the signed-in customer order history.',
      inputSchema: getOrderHistorySchema,
      annotations: { readOnlyHint: true, openWorldHint: false, untrustedContentHint: true },
      execute: (args: unknown, context: ToolContext) => {
        active(context)
        const input = inputObject(args)
        noExtraKeys(input, [])
        return getOrderHistory().map((order) => ({
          id: order.id,
          placedAt: order.placedAt,
          status: order.status,
          total: order.total,
          lines: getOrderLines(order).map(({ productId, name, quantity, price }) => ({ productId, name, quantity, price })),
        }))
      },
    },
    {
      name: 'reorder_product',
      description: 'Add a coffee product to the shopping cart for reorder.',
      inputSchema: reorderProductSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false, untrustedContentHint: false },
      execute: (args: unknown, context: ToolContext) => {
        active(context)
        const input = inputObject(args)
        noExtraKeys(input, ['productId', 'quantity'])
        const productId = stringArgument(input, 'productId')
        const quantity = input['quantity'] === undefined ? 1 : input['quantity']
        if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 20) throw new Error('quantity must be an integer from 1 to 20')
        if (getProductById(productId)?.category !== 'coffee') throw new Error('Only coffee products can be reordered')
        if (!cart.reorderProduct(productId, quantity)) throw new Error('Product could not be reordered')
        return { productId, quantity, added: true }
      },
    },
  ]
}

export function useCoffeeTools(options: CoffeeToolsOptions = {}): Pick<UseWebMCPState, 'supported'> {
  const cart = useCoffeeCart()
  const config = options.environment ? { environment: options.environment } : {}
  const capabilityState = useWebMCP({
    name: 'coffee_shop_capability_probe',
    description: 'Internal capability probe; never registered as a shop tool.',
    enabled: false,
    execute: () => undefined,
  }, config)
  const appTools = options.includeAppTools === false ? [] : createAppTools(cart)

  appTools.forEach((tool) => useWebMCP(tool, config))

  if (options.machineProductId !== undefined) {
    useWebMCP({
      name: 'get_machine_specifications',
      description: 'Read and focus a specification for the machine currently shown.',
      inputSchema: getMachineSpecificationsSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false, untrustedContentHint: false },
      execute: async (args: unknown, context: ToolContext) => {
          active(context)
          const input = inputObject(args)
          noExtraKeys(input, ['specification'])
          const specification = stringArgument(input, 'specification')
          const currentProduct = getProductById(toValue(options.machineProductId) ?? '')
          const value = currentProduct?.specifications?.[specification]
          if (!currentProduct || !value) throw new Error('Machine specification was not found')
          await options.onSpecification?.(specification)
          active(context)
          return { productId: currentProduct.id, specification, value }
      },
    }, config)
  }

  return { supported: capabilityState.supported }
}
