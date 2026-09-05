import type { RegistrationOptions, WebMCPTool } from '../../src/index'
import { ModelContextV1 } from './model-context-v1'

/** A future-shaped context used to prove optional capabilities are additive. */
export class ModelContextWithOptionalCapabilities extends ModelContextV1 {
  readonly unregistrations: string[] = []

  unregisterTool(name: string): void {
    this.unregistrations.push(name)
    for (let index = this.registrations.length - 1; index >= 0; index -= 1) {
      if (this.registrations[index]?.tool.name === name) this.registrations.splice(index, 1)
    }
  }

  getTools(): WebMCPTool[] {
    return this.registrations.map(({ tool }) => tool)
  }

  async executeTool(name: string, args?: unknown): Promise<unknown> {
    const registration = this.registrations.find(({ tool }) => tool.name === name)
    if (!registration) throw new Error(`Unknown tool: ${name}`)
    return registration.tool.execute(args, { signal: registration.options?.signal ?? new AbortController().signal })
  }

  addEventListener(_type: 'toolchange', _listener: EventListener): void {}
  removeEventListener(_type: 'toolchange', _listener: EventListener): void {}
}

export function createModelContextWithOptionalCapabilities(): ModelContextWithOptionalCapabilities {
  return new ModelContextWithOptionalCapabilities()
}
