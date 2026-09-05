import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  ModelContextLike,
  WebMCPEnvironment,
  WebMCPTool,
} from '../src/index'
import {
  createToolController,
  ToolRegistrationError,
  ToolTimeoutError,
} from '../src/index'

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
    setContext(value: ModelContextLike | undefined) {
      current = value
    },
  }
}

function tool<TArgs = unknown, TResult = unknown>(overrides: Partial<WebMCPTool<TArgs, TResult>> = {}): WebMCPTool<TArgs, TResult> {
  return {
    name: 'weather',
    description: 'Get weather',
    inputSchema: { type: 'object' },
    annotations: { readOnlyHint: true },
    execute: async () => 'sunny' as TResult,
    ...overrides,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('createToolController lifecycle', () => {
  it('remains unsupported without a model context', () => {
    const { environment } = makeEnvironment()
    const controller = createToolController(tool(), environment)

    controller.start()

    expect(controller.snapshot).toEqual({ supported: false, registered: false, error: null })
  })

  it('registers a discoverable browser wrapper when supported', async () => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()

    expect(registerTool).toHaveBeenCalledOnce()
    const [registeredTool, options] = registerTool.mock.calls[0]!
    expect(registeredTool).toEqual(expect.objectContaining({
      name: 'weather',
      description: 'Get weather',
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true },
    }))
    expect(registeredTool).not.toHaveProperty('formatOutput')
    expect(registeredTool).not.toHaveProperty('onError')
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(controller.snapshot).toEqual({ supported: true, registered: true, error: null })
  })

  it('detects support while disabled without registering, then registers when enabled', async () => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController({ ...tool(), enabled: false }, environment)

    controller.start()
    await Promise.resolve()
    expect(registerTool).not.toHaveBeenCalled()
    expect(controller.snapshot).toEqual({ supported: true, registered: false, error: null })

    controller.update({ ...tool(), enabled: true })
    await Promise.resolve()
    expect(registerTool).toHaveBeenCalledOnce()
  })

  it('wraps registration failures as errors', async () => {
    const failure = new Error('browser rejected registration')
    const { environment } = makeEnvironment({ registerTool: vi.fn(() => { throw failure }) })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()

    expect(controller.snapshot.error).toBeInstanceOf(ToolRegistrationError)
    expect(controller.snapshot.error?.cause).toBe(failure)
    expect(controller.snapshot.registered).toBe(false)
  })

  it('aborts and explicitly unregisters only on stop', async () => {
    const unregisterTool = vi.fn()
    const { environment, controllers } = makeEnvironment({ registerTool: vi.fn(), unregisterTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.stop()
    controller.stop()

    expect(controllers[0]?.signal.aborted).toBe(true)
    expect(unregisterTool).toHaveBeenCalledOnce()
    expect(controller.snapshot.registered).toBe(false)
  })

  it('falls back to abort cleanup when explicit unregistration is unavailable', async () => {
    const { environment, controllers } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    expect(() => controller.stop()).not.toThrow()
    expect(controllers[0]?.signal.aborted).toBe(true)
  })

  it('keeps the owned signal ahead of caller registration data', async () => {
    const registerTool = vi.fn()
    const callerSignal = new AbortController().signal
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController({ ...tool(), registration: { exposedTo: ['assistant'], signal: callerSignal } }, environment)

    controller.start()
    await Promise.resolve()

    expect(registerTool.mock.calls[0]![1]).toMatchObject({ exposedTo: ['assistant'] })
    expect(registerTool.mock.calls[0]![1].signal).not.toBe(callerSignal)
  })

  it('notifies subscribers only when state changes', async () => {
    const listener = vi.fn()
    const { environment } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool(), environment)
    const unsubscribe = controller.subscribe(listener)

    controller.start()
    await Promise.resolve()
    controller.start()
    controller.stop()
    unsubscribe()

    expect(listener.mock.calls.map(([snapshot]) => snapshot)).toEqual([
      { supported: true, registered: false, error: null },
      { supported: true, registered: true, error: null },
      { supported: true, registered: false, error: null },
    ])
  })

  it('rechecks availability and retries after restarting without support', async () => {
    vi.useFakeTimers()
    const registerTool = vi.fn()
    const harness = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    await Promise.resolve()
    controller.stop()
    harness.setContext(undefined)
    controller.start()
    expect(registerTool).toHaveBeenCalledOnce()
    harness.setContext({ registerTool })
    await vi.advanceTimersByTimeAsync(100)

    expect(registerTool).toHaveBeenCalledTimes(2)
  })

  it('does not leak async unregister errors during stop', async () => {
    const { environment } = makeEnvironment({
      registerTool: vi.fn(),
      unregisterTool: vi.fn(() => Promise.reject(new Error('unregister failed'))),
    })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    expect(() => controller.stop()).not.toThrow()
    await Promise.resolve()
    expect(controller.snapshot.registered).toBe(false)
  })

  it('does not leak synchronous unregister errors during replacement', async () => {
    const { environment } = makeEnvironment({
      registerTool: vi.fn(),
      unregisterTool: vi.fn(() => { throw new Error('unregister failed') }),
    })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    expect(() => controller.update(tool({ description: 'Updated weather' }))).not.toThrow()
    await Promise.resolve()
    expect(controller.snapshot.registered).toBe(true)
  })

  it('retries metadata registration after the previous registration failed', async () => {
    const registerTool = vi.fn()
      .mockImplementationOnce(() => { throw new Error('temporary failure') })
      .mockImplementation(() => undefined)
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ description: 'Updated weather' }))
    await Promise.resolve()

    expect(registerTool).toHaveBeenCalledTimes(2)
    expect(controller.snapshot).toEqual({ supported: true, registered: true, error: null })
  })

  it('unsubscribes capability listeners across disable and re-enable cycles', async () => {
    const registerTool = vi.fn()
    const unsubscribe = vi.fn()
    const onCapabilityChange = vi.fn(() => unsubscribe)
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), { ...environment, onCapabilityChange })

    controller.start()
    await Promise.resolve()
    controller.update({ ...tool(), enabled: false })
    expect(unsubscribe).toHaveBeenCalledOnce()
    controller.update(tool())
    expect(onCapabilityChange).toHaveBeenCalledTimes(2)
    controller.stop()
    expect(unsubscribe).toHaveBeenCalledTimes(2)
  })

  it('keeps only the current capability listener across metadata replacement', async () => {
    const registerTool = vi.fn()
    const activeListeners = new Set<() => void>()
    const onCapabilityChange = vi.fn((listener: () => void) => {
      activeListeners.add(listener)
      return () => { activeListeners.delete(listener) }
    })
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), { ...environment, onCapabilityChange })

    controller.start()
    await Promise.resolve()
    expect(activeListeners.size).toBe(1)
    controller.update(tool({ description: 'Updated weather' }))
    await Promise.resolve()

    expect(activeListeners.size).toBe(1)
    expect(onCapabilityChange).toHaveBeenCalledTimes(2)
    controller.stop()
    expect(activeListeners.size).toBe(0)
  })

  it('does not let a capability disposer failure break replacement cleanup', async () => {
    const registerTool = vi.fn()
    const unsubscribe = vi.fn(() => { throw new Error('dispose failed') })
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), { ...environment, onCapabilityChange: () => unsubscribe })

    controller.start()
    await Promise.resolve()
    expect(() => controller.update(tool({ description: 'Updated weather' }))).not.toThrow()
    await Promise.resolve()
    expect(() => controller.stop()).not.toThrow()
  })
})

describe('discovery retries and races', () => {
  it('discovers a context injected during the retry window', async () => {
    vi.useFakeTimers()
    const registerTool = vi.fn()
    const harness = makeEnvironment()
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    harness.setContext({ registerTool })
    vi.advanceTimersByTime(100)
    await vi.runOnlyPendingTimersAsync()

    expect(registerTool).toHaveBeenCalledOnce()
    expect(controller.snapshot.supported).toBe(true)
  })

  it('reports a timeout after the discovery window', async () => {
    vi.useFakeTimers()
    const controller = createToolController(tool(), makeEnvironment().environment)

    controller.start()
    await vi.advanceTimersByTimeAsync(3000)

    expect(controller.snapshot.error).toBeInstanceOf(ToolTimeoutError)
    expect(controller.snapshot.supported).toBe(false)
  })

  it('cancels pending discovery when stopped', async () => {
    vi.useFakeTimers()
    const registerTool = vi.fn()
    const harness = makeEnvironment()
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    controller.stop()
    harness.setContext({ registerTool })
    await vi.advanceTimersByTimeAsync(3000)

    expect(registerTool).not.toHaveBeenCalled()
  })

  it('ignores a late registration completion from a stopped attempt', async () => {
    let resolveRegistration!: () => void
    const registerTool = vi.fn(() => new Promise<void>((resolve) => { resolveRegistration = resolve }))
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.stop()
    resolveRegistration()
    await Promise.resolve()

    expect(controller.snapshot.registered).toBe(false)
  })
})

describe('identity and callback updates', () => {
  it('does not re-register for equal inline metadata', async () => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool())

    expect(registerTool).toHaveBeenCalledOnce()
  })

  it('does not collide distinct unserializable metadata identities', async () => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const firstSchema: Record<string, unknown> = {}
    firstSchema['self'] = firstSchema
    const secondSchema: Record<string, unknown> = {}
    secondSchema['self'] = secondSchema
    const controller = createToolController(tool({ inputSchema: firstSchema }), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ inputSchema: secondSchema }))
    await Promise.resolve()

    expect(registerTool).toHaveBeenCalledTimes(2)
  })

  it.each(['name', 'description', 'inputSchema', 'annotations'] as const)('re-registers when %s changes', async (field) => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    const changed = tool({ [field]: field === 'inputSchema' ? { type: 'string' } : `${field}-changed` })
    controller.update(changed)
    await Promise.resolve()

    expect(registerTool).toHaveBeenCalledTimes(2)
  })

  it('updates callbacks without replacing registration', async () => {
    const registerTool = vi.fn()
    const onError = vi.fn()
    const first = tool({ execute: () => 'first', formatOutput: (value) => `formatted:${value}` })
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(first, environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ execute: () => 'second', onError }))
    const registeredTool = registerTool.mock.calls[0]![0] as WebMCPTool

    await expect(registeredTool.execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: 'second' }],
    })
    expect(registerTool).toHaveBeenCalledOnce()
  })

  it('replaces an in-flight registration when metadata changes', async () => {
    let resolveFirst!: () => void
    const registerTool = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirst = resolve }))
      .mockImplementation(() => undefined)
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ description: 'Updated weather' }))
    resolveFirst()
    await Promise.resolve()
    await Promise.resolve()

    expect(registerTool).toHaveBeenCalledTimes(2)
    expect(registerTool.mock.calls[1]![0]).toMatchObject({ description: 'Updated weather' })
  })

  it('retries metadata replacement when the context is temporarily absent', async () => {
    vi.useFakeTimers()
    const registerTool = vi.fn()
    const harness = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), harness.environment)

    controller.start()
    await Promise.resolve()
    harness.setContext(undefined)
    controller.update(tool({ description: 'Updated weather' }))
    harness.setContext({ registerTool })
    await vi.advanceTimersByTimeAsync(100)

    expect(registerTool).toHaveBeenCalledTimes(2)
    expect(registerTool.mock.calls[1]![0]).toMatchObject({ description: 'Updated weather' })
  })
})

describe('browser wrapper execution', () => {
  it('passes the execution signal and formats successful output', async () => {
    const execute = vi.fn((_args: { city: string }, context: { signal: AbortSignal }) => {
      expect(context.signal).toBeInstanceOf(AbortSignal)
      return 'sunny'
    })
    const { environment } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool<{ city: string }, string>({ execute, formatOutput: (result) => ({ result }) }), environment)

    controller.start()
    await Promise.resolve()
    const registeredTool = (environment.getModelContext() as ModelContextLike).registerTool as ReturnType<typeof vi.fn>
    const browserTool = registeredTool.mock.calls[0]![0] as WebMCPTool

    await expect(browserTool.execute({ city: 'Paris' }, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: '{"result":"sunny"}' }],
    })
  })

  it('exposes exactly the browser-facing keys', async () => {
    const { environment } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool({ formatOutput: (value) => value, onError: vi.fn() }), environment)

    controller.start()
    await Promise.resolve()
    const registerTool = environment.getModelContext()!.registerTool as ReturnType<typeof vi.fn>
    const browserTool = registerTool.mock.calls[0]![0] as Record<string, unknown>

    expect(Object.keys(browserTool).sort()).toEqual(['annotations', 'description', 'execute', 'inputSchema', 'name'])
    expect(browserTool).not.toHaveProperty('formatOutput')
    expect(browserTool).not.toHaveProperty('onError')
    expect(browserTool).not.toHaveProperty('registration')
    expect(browserTool).not.toHaveProperty('enabled')
  })

  it('uses an updated formatter without re-registering', async () => {
    const registerTool = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool({ formatOutput: (value) => `old:${value}` }), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ formatOutput: (value) => `new:${value}` }))
    const browserTool = registerTool.mock.calls[0]![0] as WebMCPTool

    await expect(browserTool.execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: 'new:sunny' }],
    })
    expect(registerTool).toHaveBeenCalledOnce()
  })

  it('uses an updated error callback without re-registering', async () => {
    const registerTool = vi.fn()
    const onError = vi.fn()
    const { environment } = makeEnvironment({ registerTool })
    const controller = createToolController(tool({ execute: () => { throw 'bad' } }), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ execute: () => { throw 'bad' }, onError }))
    const browserTool = registerTool.mock.calls[0]![0] as WebMCPTool
    await browserTool.execute({}, { signal: new AbortController().signal })

    expect(onError).toHaveBeenCalledWith(new Error('bad'))
    expect(registerTool).toHaveBeenCalledOnce()
  })

  it('aborts the replaced signal and ignores stale completion', async () => {
    let resolveFirst!: () => void
    const registerTool = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { resolveFirst = resolve }))
      .mockImplementation(() => undefined)
    const { environment, controllers } = makeEnvironment({ registerTool })
    const controller = createToolController(tool(), environment)

    controller.start()
    await Promise.resolve()
    controller.update(tool({ description: 'Updated weather' }))
    expect(controllers[0]?.signal.aborted).toBe(true)
    resolveFirst()
    await Promise.resolve()
    await Promise.resolve()

    expect(controller.snapshot).toEqual({ supported: true, registered: true, error: null })
    expect(controllers[1]?.signal.aborted).toBe(false)
  })

  it('calls the latest error callback and returns normalized failures', async () => {
    const onError = vi.fn()
    const { environment } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool({ execute: () => { throw 'bad input' }, onError }), environment)

    controller.start()
    await Promise.resolve()
    const registerTool = environment.getModelContext()!.registerTool as ReturnType<typeof vi.fn>
    const browserTool = registerTool.mock.calls[0]![0] as WebMCPTool
    const result = await browserTool.execute({}, { signal: new AbortController().signal })

    expect(onError).toHaveBeenCalledWith(new Error('bad input'))
    expect(result).toEqual({ content: [{ type: 'text', text: 'bad input' }], isError: true })
  })

  it('returns normalized failure output when the error callback throws', async () => {
    const onError = vi.fn(() => { throw new Error('callback failed') })
    const { environment } = makeEnvironment({ registerTool: vi.fn() })
    const controller = createToolController(tool({ execute: () => { throw 'bad input' }, onError }), environment)

    controller.start()
    await Promise.resolve()
    const registerTool = environment.getModelContext()!.registerTool as ReturnType<typeof vi.fn>
    const browserTool = registerTool.mock.calls[0]![0] as WebMCPTool

    await expect(browserTool.execute({}, { signal: new AbortController().signal })).resolves.toEqual({
      content: [{ type: 'text', text: 'bad input' }],
      isError: true,
    })
  })
})
