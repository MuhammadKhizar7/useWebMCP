import type { ModelContextLike, RegistrationOptions, WebMCPTool } from '../../src/index'

/** Minimal WebMCP shape: the required registration method only. */
export class ModelContextV1 implements ModelContextLike {
  readonly registrations: Array<{ tool: WebMCPTool; options?: RegistrationOptions }> = []

  registerTool(tool: WebMCPTool, options?: RegistrationOptions): void {
    this.registrations.push({ tool, ...(options === undefined ? {} : { options }) })
  }
}

export function createModelContextV1(): ModelContextV1 {
  return new ModelContextV1()
}
