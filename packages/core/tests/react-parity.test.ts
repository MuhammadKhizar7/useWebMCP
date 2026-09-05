import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ModelContextLike, ToolController, WebMCPEnvironment, WebMCPTool } from '../src/index'
import {
  createToolController,
  errorResult,
  ToolRegistrationError,
  ToolTimeoutError,
} from '../src/index'
import { createFakeModelContext, type FakeModelContext } from './fixtures/fake-model-context'

function makeEnvironment(context?: ModelContextLike) {
  let current = context
  const controllers: AbortController[] = []
  const environment: WebMCPEnvironment = {
    getModelContext: () => current,
    createAbortController: () => {
      const controller = new AbortController()
      controllers.push(controller)
      return controller
    },
  }

  return {
    environment,
    controllers,
    setContext: (next: ModelContextLike | undefined) => { current = next },
  }
}

function tool<TArgs = unknown, TResult = unknown>(overrides: Partial<WebMCPTool<TArgs, TResult>> = {}): WebMCPTool<TArgs, TResult> {
  return {
    name: 'weather',
    description: 'Get weather',
    inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
    annotations: { readOnlyHint: true },
    execute: async () => 'sunny' as TResult,
    ...overrides,
  }
}

async function waitForRegistration(context: FakeModelContext, count = 1): Promise<void> {
  await vi.waitFor(() => {
    if (context.registrations.length < count) throw new Error(`Expected ${count} registration(s)`)
  })
}

async function waitForRegistered<TArgs, TResult>(controller: ToolController<TArgs, TResult>): Promise<void> {
  await vi.waitFor(() => {
    if (!controller.snapshot.registered) throw new Error('Expected the controller to be registered')
  })
}

function getRegisteredTool(context: FakeModelContext, index = 0): WebMCPTool {
  const registration = context.registrations[index]
  if (!registration) throw new Error(`Missing registration at index ${index}`)
  return registration.tool
}

afterEach(() => {
  vi.useRealTimers()
})

describe('core React contract parity', () => {
  it('remains unsupported without a model context', () => {
    const controller = createToolController(tool(), makeEnvironment().environment)

    controller.start()

    expect(controller.snapshot).toEqual({ supported: false, registered: false, error: null })
  })

  it('registers metadata, annotations, and only browser-facing fields', async () => {
    const context = createFakeModelContext()
    const { environment } = makeEnvironment(context)
    const controller = createToolController({ ...tool(), formatOutput: (value) => value, onError: vi.fn() }, environment)

    controller.start()
    await waitForRegistered(controller)

    const registration = context.registrations[0]
    if (!registration) throw new Error('Expected a browser registration')
    expect(registration.tool).toMatchObject({
      name: 'weather',
      description: 'Get weather',
      inputSchema: { type: 'object', properties: { city: { type: 'string' } } },
      annotations: { readOnlyHint: true },
    })
    expect(Object.keys(registration.tool).sort()).toEqual(['annotations', 'description', 'execute', 'inputSchema', 'name'])
    expect(registration.options?.signal).toBeInstanceOf(AbortSignal)
    expect(controller.snapshot).toEqual({ supported: true, registered: true, error: null })
  })

  it('toggles an active registration off and back on', async () => {
    const context = createFakeModelContext()
    const harness = makeEnvironment(context)
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    await waitForRegistered(controller)
    expect(context.registrations).toHaveLength(1)

    controller.update({ ...tool(), enabled: false })
    expect(controller.snapshot.registered).toBe(false)
    expect(harness.controllers[0]?.signal.aborted).toBe(true)
    expect(context.unregistrations).toEqual(['weather'])

    controller.update({ ...tool(), enabled: true })
    await waitForRegistered(controller)
    expect(context.registrations).toHaveLength(2)
    expect(harness.controllers[1]?.signal.aborted).toBe(false)
  })

  it('aborts and explicitly unregisters on cleanup, with abort-only fallback', async () => {
    const context = createFakeModelContext()
    const harness = makeEnvironment(context)
    const controller = createToolController(tool(), harness.environment)
    controller.start()
    await waitForRegistered(controller)
    controller.stop()
    controller.stop()

    expect(harness.controllers[0]!.signal.aborted).toBe(true)
    expect(context.aborts).toHaveLength(1)
    expect(context.unregistrations).toEqual(['weather'])

    const abortOnly = createFakeModelContext({ unregister: false })
    const fallback = makeEnvironment(abortOnly)
    const fallbackController = createToolController(tool(), fallback.environment)
    fallbackController.start()
    await waitForRegistered(fallbackController)
    fallbackController.stop()
    expect(fallback.controllers[0]!.signal.aborted).toBe(true)
    expect(abortOnly.unregistrations).toHaveLength(0)
  })

  it('wraps registration errors as Error instances', async () => {
    const cause = 'browser rejected registration'
    const context = createFakeModelContext({ register: () => { throw cause } })
    const controller = createToolController(tool(), makeEnvironment(context).environment)

    controller.start()
    await waitForRegistration(context)

    expect(controller.snapshot.error).toBeInstanceOf(ToolRegistrationError)
    expect(controller.snapshot.error?.cause).toBe(cause)
    expect(controller.snapshot.error).toBeInstanceOf(Error)
  })

  it('discovers late injection and times out when unsupported', async () => {
    vi.useFakeTimers()
    const context = createFakeModelContext()
    const harness = makeEnvironment()
    const controller = createToolController(tool(), harness.environment)
    controller.start()
    harness.setContext(context)
    await vi.advanceTimersByTimeAsync(100)
    await waitForRegistered(controller)
    expect(context.registrations).toHaveLength(1)

    const timeoutController = createToolController(tool({ name: 'timeout' }), makeEnvironment().environment)
    timeoutController.start()
    await vi.advanceTimersByTimeAsync(3000)
    expect(timeoutController.snapshot.error).toBeInstanceOf(ToolTimeoutError)
    expect(timeoutController.snapshot.supported).toBe(false)
  })

  it('keeps a remounted controller safe from stale registration completion', async () => {
    let resolveFirstRegistration: (() => void) | undefined
    let registrationAttempt = 0
    const context = createFakeModelContext({ register: () => {
      registrationAttempt += 1
      if (registrationAttempt === 1) {
        return new Promise<void>((resolve) => { resolveFirstRegistration = resolve })
      }
    } })
    const harness = makeEnvironment(context)
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    await waitForRegistration(context)
    controller.stop()
    controller.start()
    await waitForRegistered(controller)
    if (!resolveFirstRegistration) throw new Error('Expected the first registration to remain pending')
    resolveFirstRegistration()
    await vi.waitFor(() => {
      if (!controller.snapshot.registered) throw new Error('New registration was lost')
    })

    expect(controller.snapshot.registered).toBe(true)
    expect(context.activeTools.get('weather')).toBe(getRegisteredTool(context, 1))
    expect(context.aborts).toHaveLength(1)
    expect(harness.controllers[0]?.signal.aborted).toBe(true)
    expect(harness.controllers[1]?.signal.aborted).toBe(false)
  })

  it('keeps equal inline metadata stable and replaces changed metadata', async () => {
    const context = createFakeModelContext()
    const controller = createToolController(tool(), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    controller.update(tool())
    expect(context.registrations).toHaveLength(1)
    controller.update(tool({ description: 'Updated weather' }))
    await waitForRegistered(controller)
    expect(context.registrations).toHaveLength(2)
    expect(getRegisteredTool(context, 1).description).toBe('Updated weather')
  })

  it.each(['name', 'description', 'inputSchema', 'annotations'] as const)('replaces when %s identity changes', async (field) => {
    const context = createFakeModelContext()
    const controller = createToolController(tool(), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)
    const changed = tool({ [field]: field === 'inputSchema' ? { type: 'string' } : field === 'annotations' ? { readOnlyHint: false } : `${field}-changed` })
    controller.update(changed)
    await waitForRegistered(controller)
    expect(context.registrations).toHaveLength(2)
  })

  it('updates callbacks without replacing the registration', async () => {
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => 'first' }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)
    controller.update(tool({ execute: () => 'second', formatOutput: (value) => `formatted:${value}` }))

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: 'formatted:second' }],
    })
    expect(context.registrations).toHaveLength(1)
  })

  it('passes execution context and normalizes successful values', async () => {
    const execute = vi.fn((_args: { city: string }, context: { signal: AbortSignal }) => {
      expect(context.signal).toBeInstanceOf(AbortSignal)
      return { forecast: 'sunny' }
    })
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)
    const browserTool = getRegisteredTool(context)

    await expect(browserTool.execute({ city: 'Paris' }, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: '{"forecast":"sunny"}' }],
    })
  })

  it.each([
    [undefined, { content: [] }],
    [null, { content: [] }],
    ['hello', { content: [{ type: 'text', text: 'hello' }] }],
    [42, { content: [{ type: 'text', text: '42' }] }],
    [[1, 'two'], { content: [{ type: 'text', text: '[1,"two"]' }] }],
    [{ answer: true }, { content: [{ type: 'text', text: '{"answer":true}' }] }],
  ])('normalizes successful return %p', async (value, expected) => {
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => value }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual(expected)
  })

  it('preserves an existing content response by identity through the wrapper', async () => {
    const content = { content: [{ type: 'text' as const, text: 'already normalized' }] }
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => content }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    const result = await getRegisteredTool(context).execute({}, { signal: new AbortController().signal })
    expect(result).toBe(content)
  })

  it.each([
    [{ content: 'malformed' }, { content: [{ type: 'text', text: '{"content":"malformed"}' }] }],
    [BigInt(42), { content: [{ type: 'text', text: '42' }], isError: true }],
  ])('normalizes malformed or unsupported returns through the wrapper', async (value, expected) => {
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => value }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual(expected)
  })

  it('turns circular returns into normalized execution errors', async () => {
    const circular: Record<string, unknown> = {}
    circular['self'] = circular
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => circular }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: '[object Object]' }],
      isError: true,
    })
  })

  it.each([
    ['bad input', 'bad input'],
    [{ reason: 'bad input' }, '{"reason":"bad input"}'],
    [null, 'null'],
  ])('normalizes non-Error throw %p and calls the latest error callback', async (thrown, text) => {
    const onError = vi.fn()
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => { throw thrown }, onError }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual(errorResult(thrown))
    expect(onError).toHaveBeenCalledWith(new Error(text))
  })

  it('normalizes rejected Promise execution and calls the latest error callback', async () => {
    const onError = vi.fn()
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => Promise.reject('async failure'), onError }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: 'async failure' }],
      isError: true,
    })
    expect(onError).toHaveBeenCalledWith(new Error('async failure'))
  })

  it('normalizes circular thrown values through the wrapper and calls onError', async () => {
    const circular: Record<string, unknown> = {}
    circular['self'] = circular
    const onError = vi.fn()
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => { throw circular }, onError }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: '[object Object]' }],
      isError: true,
    })
    expect(onError).toHaveBeenCalledWith(new Error('[object Object]'))
  })

  it('preserves Error identity and survives an error callback that throws', async () => {
    const error = new Error('failed')
    const onError = vi.fn(() => { throw new Error('callback failed') })
    const context = createFakeModelContext()
    const controller = createToolController(tool({ execute: () => { throw error }, onError }), makeEnvironment(context).environment)
    controller.start()
    await waitForRegistered(controller)

    await expect(getRegisteredTool(context).execute({}, { signal: new AbortController().signal })).resolves.toEqual(errorResult(error))
    expect(onError).toHaveBeenCalledWith(error)
  })
})

describe('fake model context contract', () => {
  it('tracks active tools and optional unregistration independently', () => {
    const withUnregister: FakeModelContext = createFakeModelContext()
    const withoutUnregister: FakeModelContext = createFakeModelContext({ unregister: false })

    expect(withUnregister.unregisterTool).toBeTypeOf('function')
    expect(withoutUnregister.unregisterTool).toBeUndefined()
  })
})
