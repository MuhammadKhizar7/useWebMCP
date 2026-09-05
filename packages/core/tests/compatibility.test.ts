import { describe, expect, it, vi } from 'vitest'
import { createToolController } from '../src/index'
import { createModelContextV1 } from './fixtures/model-context-v1'
import { createModelContextWithOptionalCapabilities } from './fixtures/model-context-with-optional-capabilities'

function options() {
  return { name: 'compatibility', description: 'Compatibility tool', execute: vi.fn(() => 'ok') }
}

describe('model-context capability compatibility', () => {
  it('registers with the minimal registerTool-only shape', async () => {
    const context = createModelContextV1()
    const controller = createToolController(options(), {
      getModelContext: () => context,
      createAbortController: () => new AbortController(),
    })

    controller.start()
    await Promise.resolve()

    expect(context.registrations).toHaveLength(1)
    expect(controller.snapshot).toMatchObject({ supported: true, registered: true, error: null })
    expect(() => controller.stop()).not.toThrow()
  })

  it('uses optional unregistration when available', async () => {
    const context = createModelContextWithOptionalCapabilities()
    const controller = createToolController(options(), {
      getModelContext: () => context,
      createAbortController: () => new AbortController(),
    })

    controller.start()
    await Promise.resolve()
    expect(context.getTools()).toHaveLength(1)
    controller.stop()

    expect(context.unregistrations).toEqual(['compatibility'])
    expect(context.getTools()).toEqual([])
  })

  it('does not require optional listing, execution, or event capabilities', async () => {
    const context = createModelContextV1()
    const controller = createToolController(options(), {
      getModelContext: () => context,
      createAbortController: () => new AbortController(),
    })

    controller.start()
    await Promise.resolve()

    expect(context.registrations[0]?.tool.name).toBe('compatibility')
    controller.stop()
  })
})
