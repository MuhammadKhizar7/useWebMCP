import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WebMCPTool } from '../src/index'

const argsOnlyTool = {
  name: 'args-only',
  description: 'Accepts the legacy one-argument callback shape.',
  execute: (args: { value: string }) => args.value,
} satisfies WebMCPTool<{ value: string }, string>

const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document')

afterEach(() => {
  vi.restoreAllMocks()

  if (documentDescriptor) {
    Object.defineProperty(globalThis, 'document', documentDescriptor)
  } else {
    Reflect.deleteProperty(globalThis, 'document')
  }
})

describe('default browser environment', () => {
  it('is safe when document is unavailable', async () => {
    Reflect.deleteProperty(globalThis, 'document')

    const { defaultEnvironment } = await import('../src/index')

    expect(defaultEnvironment.getModelContext()).toBeUndefined()
  })

  it('returns the current document model context when present', async () => {
    const modelContext = { registerTool: vi.fn() }
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { modelContext },
    })

    const { defaultEnvironment } = await import('../src/index')

    expect(defaultEnvironment.getModelContext()).toBe(modelContext)
  })

  it('does not read document during module import', async () => {
    let reads = 0
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      get() {
        reads += 1
        return { modelContext: { registerTool: vi.fn() } }
      },
    })

    vi.resetModules()
    await import('../src/index')

    expect(reads).toBe(0)
  })
})
