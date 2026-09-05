import type { ModelContextLike, RegistrationOptions, WebMCPTool } from '../../src/index'

export interface FakeRegistration {
  tool: WebMCPTool
  options: RegistrationOptions | undefined
  signal: AbortSignal | undefined
}

export interface FakeModelContextOptions {
  unregister?: boolean
  register?: (tool: WebMCPTool, options?: RegistrationOptions) => void | Promise<void>
}

export class FakeModelContext implements ModelContextLike {
  readonly registrations: FakeRegistration[] = []
  readonly unregistrations: string[] = []
  readonly aborts: AbortSignal[] = []
  readonly activeTools = new Map<string, WebMCPTool>()

  readonly registerTool = async (
    tool: WebMCPTool,
    options?: RegistrationOptions,
  ): Promise<void> => {
    const registration = { tool, options, signal: options?.signal }
    this.registrations.push(registration)

    const signal = registration.signal
    if (signal) {
      signal.addEventListener('abort', () => {
        this.aborts.push(signal)
        if (this.activeTools.get(tool.name) === tool) this.activeTools.delete(tool.name)
      }, { once: true })
    }

    await this.options.register?.(tool, options)
    if (registration.signal?.aborted) return
    this.activeTools.set(tool.name, tool)
  }

  readonly unregisterTool = (name: string): void => {
    this.unregistrations.push(name)
    this.activeTools.delete(name)
  }

  private readonly options: FakeModelContextOptions

  constructor(options: FakeModelContextOptions = {}) {
    this.options = options
    if (options.unregister === false) Reflect.deleteProperty(this, 'unregisterTool')
  }

  getTools(): WebMCPTool[] {
    return [...this.activeTools.values()]
  }
}

export function createFakeModelContext(options?: FakeModelContextOptions): FakeModelContext {
  return new FakeModelContext(options)
}
