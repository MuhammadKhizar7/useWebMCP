import { createRenderer, defineComponent, h, nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeModelContext } from '../../../packages/core/tests/fixtures/fake-model-context'
import { getCoffeeState, useCoffeeCart } from '../src/composables/useCoffeeCart'
import {
  getMachineSpecificationsSchema,
  getOrderHistorySchema,
  reorderProductSchema,
  searchCatalogSchema,
  useCoffeeTools,
} from '../src/composables/useCoffeeTools'

const renderer = createRenderer({
  patchProp: () => undefined,
  insert: () => undefined,
  remove: () => undefined,
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText: () => undefined,
  setElementText: () => undefined,
  parentNode: () => null,
  nextSibling: () => null,
})

function environment(context?: FakeModelContext) {
  return {
    getModelContext: () => context,
    createAbortController: () => new AbortController(),
  }
}

describe('coffee shop WebMCP tools', () => {
  const expectedToolNames = [
    'search_catalog',
    'get_order_history',
    'reorder_product',
    'get_machine_specifications',
  ]

  beforeEach(() => {
    const cart = useCoffeeCart()
    cart.clearCart()
    getCoffeeState().toast = null
    getCoffeeState().highlightedSpecification = null
  })

  it('exposes the exact object schemas and security annotations', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment(context) })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()

    const tools = new Map(context.registrations.map(({ tool }) => [tool.name, tool]))
    expect(tools.get('search_catalog')?.inputSchema).toEqual(searchCatalogSchema)
    expect(tools.get('get_order_history')?.inputSchema).toEqual(getOrderHistorySchema)
    expect(tools.get('reorder_product')?.inputSchema).toEqual(reorderProductSchema)
    expect(tools.get('search_catalog')?.annotations).toEqual({ readOnlyHint: true, openWorldHint: false, untrustedContentHint: true })
    expect(tools.get('get_order_history')?.annotations).toEqual({ readOnlyHint: true, openWorldHint: false, untrustedContentHint: true })
    expect(tools.get('reorder_product')?.annotations).toEqual({ readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false, untrustedContentHint: false })

    renderer.render(null, root)
  })

  it('returns concise results and rejects invalid execution arguments', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment(context) })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()
    const tools = new Map(context.registrations.map(({ tool }) => [tool.name, tool]))

    await expect(tools.get('search_catalog')!.execute({ query: 'walnut' }, { signal: new AbortController().signal }))
      .resolves.toEqual({ content: [{ type: 'text', text: JSON.stringify([{ id: 'dark-roast-no-4', name: 'Dark Roast No. 4', category: 'coffee', price: 18 }]) }] })
    await expect(tools.get('search_catalog')!.execute({ query: 42 }, { signal: new AbortController().signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('reorder_product')!.execute({ productId: 'dark-roast-no-4', quantity: 2 }, { signal: new AbortController().signal }))
      .resolves.toEqual({ content: [{ type: 'text', text: JSON.stringify({ productId: 'dark-roast-no-4', quantity: 2, added: true }) }] })
    expect(getCoffeeState().toast).toBe('Your usual coffee is ready in the cart')
    expect(useCoffeeCart().itemCount.value).toBe(2)

    renderer.render(null, root)
  })

  it('owns persistent registrations and does nothing without modelContext', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment(context) })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()
    expect([...context.activeTools.keys()]).toEqual(['search_catalog', 'get_order_history', 'reorder_product'])
    renderer.render(null, root)
    expect(context.aborts).toHaveLength(3)

    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment() })
        return () => null
      },
    })), {})
    await nextTick()
    expect(context.registrations).toHaveLength(3)
  })

  it('registers and cleans up machine specifications with the product route owner', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({
          environment: environment(context),
          includeAppTools: false,
          machineProductId: 'the-alchemist',
          onSpecification: (name) => { getCoffeeState().highlightedSpecification = name },
        })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()
    const tool = context.activeTools.get('get_machine_specifications')
    expect(tool?.inputSchema).toEqual(getMachineSpecificationsSchema)
    await expect(tool!.execute({ specification: 'Water tank' }, { signal: new AbortController().signal }))
      .resolves.toEqual({ content: [{ type: 'text', text: JSON.stringify({ productId: 'the-alchemist', specification: 'Water tank', value: '2.0 L' }) }] })
    expect(getCoffeeState().highlightedSpecification).toBe('Water tank')
    renderer.render(null, root)
    expect(context.aborts).toHaveLength(1)
  })

  it('exposes the complete four-tool demo surface across app and product ownership', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment(context), machineProductId: 'the-alchemist' })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()

    expect([...context.activeTools.keys()]).toEqual(expectedToolNames)
    expect(context.registrations).toHaveLength(expectedToolNames.length)
    expect(context.registrations.every(({ tool, options }) =>
      expectedToolNames.includes(tool.name)
      && typeof tool.execute === 'function'
      && !options?.exposedTo?.includes('assistant'),
    )).toBe(true)
    expect(context.activeTools.has('coffee_shop_capability_probe')).toBe(false)

    renderer.render(null, root)
  })

  it('rejects malformed arguments and pre-aborted executions for every tool', async () => {
    const context = new FakeModelContext()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ environment: environment(context), machineProductId: 'the-alchemist' })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()
    const tools = new Map(context.registrations.map(({ tool }) => [tool.name, tool]))
    const signal = new AbortController().signal

    await expect(tools.get('search_catalog')!.execute({ query: 'coffee', extra: true }, { signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('get_order_history')!.execute({ extra: true }, { signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('reorder_product')!.execute({ productId: 'dark-roast-no-4', quantity: 0 }, { signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('get_machine_specifications')!.execute({ specification: 42 }, { signal }))
      .resolves.toMatchObject({ isError: true })

    const controller = new AbortController()
    controller.abort()

    await expect(tools.get('search_catalog')!.execute({ query: 'coffee' }, { signal: controller.signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('get_order_history')!.execute({}, { signal: controller.signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('reorder_product')!.execute({ productId: 'dark-roast-no-4' }, { signal: controller.signal }))
      .resolves.toMatchObject({ isError: true })
    await expect(tools.get('get_machine_specifications')!.execute({ specification: 'Water tank' }, { signal: controller.signal }))
      .resolves.toMatchObject({ isError: true })

    expect(tools.get('get_machine_specifications')?.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
      untrustedContentHint: false,
    })
    renderer.render(null, root)
  })

  it('uses the default browser environment without registering a probe tool', async () => {
    const context = new FakeModelContext()
    vi.stubGlobal('document', { modelContext: context })
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({ machineProductId: 'the-alchemist' })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()

    expect([...context.activeTools.keys()]).toEqual([
      'search_catalog',
      'get_order_history',
      'reorder_product',
      'get_machine_specifications',
    ])
    expect(context.activeTools.has('coffee_shop_capability_probe')).toBe(false)

    renderer.render(null, root)
    vi.unstubAllGlobals()
  })

  it('checks abort state after an asynchronous specification callback', async () => {
    const context = new FakeModelContext()
    const controller = new AbortController()
    const root = {}
    renderer.render(h(defineComponent({
      setup() {
        useCoffeeTools({
          environment: environment(context),
          includeAppTools: false,
          machineProductId: 'the-alchemist',
          onSpecification: async () => controller.abort(),
        })
        return () => null
      },
    })), root)
    await nextTick()
    await Promise.resolve()

    const tool = context.activeTools.get('get_machine_specifications')!
    await expect(tool.execute({ specification: 'Water tank' }, { signal: controller.signal }))
      .resolves.toMatchObject({ isError: true })
    renderer.render(null, root)
  })
})
