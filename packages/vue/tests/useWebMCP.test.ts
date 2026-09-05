import { createRenderer, defineComponent, h, nextTick, reactive, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { FakeModelContext } from '../../core/tests/fixtures/fake-model-context'
import { defaultEnvironment } from 'webmcp-tool-core'
import { useWebMCP } from '../src/useWebMCP'
import type { UseWebMCPOptions } from '../src/types'

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

function mountComponent(setup: () => unknown) {
  const root = {}
  const Component = defineComponent({ setup, render: () => null })
  renderer.render(h(Component), root)
  return { root, unmount: () => renderer.render(null, root) }
}

const flushPromises = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

function createOptions(overrides: Partial<UseWebMCPOptions> = {}): UseWebMCPOptions {
  return {
    name: 'greet',
    description: 'Greet someone',
    execute: vi.fn(() => 'hello'),
    ...overrides,
  }
}

describe('useWebMCP', () => {
  it('registers after mount and aborts on unmount', async () => {
    const context = new FakeModelContext()
    const options = createOptions()
    let state: ReturnType<typeof useWebMCP> | undefined
    const instance = mountComponent(() => {
      const result = useWebMCP(options, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      state = result
      return () => null
    })
    await nextTick()
    await flushPromises()
    expect(context.registrations).toHaveLength(1)
    expect(state?.registered.value).toBe(true)
    expect(state?.supported.value).toBe(true)

    instance.unmount()
    expect(context.aborts).toHaveLength(1)
    expect(state?.registered.value).toBe(false)
  })

  it('updates callbacks without re-registering and metadata with re-registration', async () => {
    const context = new FakeModelContext()
    const firstExecute = vi.fn(() => 'first')
    const secondExecute = vi.fn(() => 'second')
    const options = reactive<UseWebMCPOptions>(createOptions({ execute: firstExecute }))
    const instance = mountComponent(() => {
      useWebMCP(options, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      return () => null
    })
    await nextTick()
    const registeredTool = context.registrations[0]?.tool
    options.execute = secondExecute
    await nextTick()
    expect(context.registrations).toHaveLength(1)
    await registeredTool?.execute({}, { signal: new AbortController().signal })
    expect(secondExecute).toHaveBeenCalled()

    options.description = 'Updated'
    await nextTick()
    await nextTick()
    expect(context.registrations).toHaveLength(2)
    instance.unmount()
  })

  it('updates refs when enabled is toggled off and on', async () => {
    const context = new FakeModelContext()
    const options = reactive<UseWebMCPOptions>(createOptions())
    let state: ReturnType<typeof useWebMCP> | undefined
    const instance = mountComponent(() => {
      state = useWebMCP(options, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      return () => null
    })

    await nextTick()
    await flushPromises()
    expect(state?.registered.value).toBe(true)

    options.enabled = false
    await nextTick()
    expect(context.aborts).toHaveLength(1)
    expect(state?.registered.value).toBe(false)
    expect(state?.error.value).toBeNull()

    options.enabled = true
    await nextTick()
    await flushPromises()
    expect(context.registrations).toHaveLength(2)
    expect(state?.registered.value).toBe(true)

    instance.unmount()
  })

  it('reports browser support while registration is deferred', async () => {
    const context = new FakeModelContext()
    const state = { current: undefined as ReturnType<typeof useWebMCP> | undefined }
    const instance = mountComponent(() => {
      state.current = useWebMCP(createOptions({ enabled: false }), {
        environment: {
          getModelContext: () => context,
          createAbortController: () => new AbortController(),
        },
      })
      return () => null
    })

    await nextTick()
    await flushPromises()

    expect(state.current?.supported.value).toBe(true)
    expect(state.current?.registered.value).toBe(false)
    expect(context.registrations).toHaveLength(0)
    instance.unmount()
  })

  it('forwards ref and getter option replacements', async () => {
    const context = new FakeModelContext()
    const first = createOptions()
    const second = createOptions({ name: 'farewell' })
    const optionsRef = ref<UseWebMCPOptions>(first)
    const instance = mountComponent(() => {
      useWebMCP(optionsRef, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      return () => null
    })

    await nextTick()
    await flushPromises()
    optionsRef.value = second
    await nextTick()
    await flushPromises()
    expect(context.registrations).toHaveLength(2)
    expect(context.unregistrations).toEqual(['greet'])
    expect(context.activeTools.has('farewell')).toBe(true)
    instance.unmount()

    const getterContext = new FakeModelContext()
    const current = ref<UseWebMCPOptions>(createOptions())
    const getter = () => current.value
    const getterInstance = mountComponent(() => {
      useWebMCP(getter, { environment: { getModelContext: () => getterContext, createAbortController: () => new AbortController() } })
      return () => null
    })

    await nextTick()
    await flushPromises()
    current.value = createOptions({ name: 'updated-greet' })
    await nextTick()
    await flushPromises()
    expect(getterContext.registrations).toHaveLength(2)
    expect(getterContext.unregistrations).toEqual(['greet'])
    getterInstance.unmount()
  })

  it('does not re-register for equal inline schemas and annotations', async () => {
    const context = new FakeModelContext()
    const options = reactive<UseWebMCPOptions>(createOptions({
      inputSchema: { type: 'object' },
      annotations: { readOnlyHint: true },
    }))
    const instance = mountComponent(() => {
      useWebMCP(options, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      return () => null
    })

    await nextTick()
    await flushPromises()
    options.inputSchema = { type: 'object' }
    options.annotations = { readOnlyHint: true }
    await nextTick()
    await nextTick()
    expect(context.registrations).toHaveLength(1)
    instance.unmount()
  })

  it('updates the error ref on registration failure and clears it after replacement', async () => {
    const failure = new Error('registration failed')
    const context = new FakeModelContext({
      register: vi.fn()
        .mockRejectedValueOnce(failure)
        .mockResolvedValue(undefined),
    })
    const options = reactive<UseWebMCPOptions>(createOptions())
    let state: ReturnType<typeof useWebMCP> | undefined
    const instance = mountComponent(() => {
      state = useWebMCP(options, { environment: { getModelContext: () => context, createAbortController: () => new AbortController() } })
      return () => null
    })

    await nextTick()
    await flushPromises()
    expect(state?.registered.value).toBe(false)
    expect(state?.error.value).toMatchObject({ cause: failure })

    options.description = 'Retry registration'
    await nextTick()
    await flushPromises()
    expect(state?.error.value).toBeNull()
    expect(state?.registered.value).toBe(true)
    instance.unmount()
  })

  it('does not access the browser boundary during setup and cleans retry timers on unmount', async () => {
    vi.useFakeTimers()
    let inSetup = false
    const getModelContext = vi.spyOn(defaultEnvironment, 'getModelContext').mockImplementation(() => {
      if (inSetup) throw new Error('browser boundary accessed during setup')
      return undefined
    })
    const options = createOptions()
    let instance: ReturnType<typeof mountComponent> | undefined
    instance = mountComponent(() => {
      inSetup = true
      try {
        useWebMCP(options)
      } finally {
        inSetup = false
      }
      return () => null
    })

    expect(getModelContext).toHaveBeenCalled()
    instance?.unmount()
    expect(vi.getTimerCount()).toBe(0)
    vi.useRealTimers()
    getModelContext.mockRestore()
  })

})
