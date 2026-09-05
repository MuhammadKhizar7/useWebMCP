export type JSONSchema = Record<string, unknown>

export type ToolAnnotations = Record<string, unknown>

export type RegistrationOptions = Record<string, unknown> & {
  signal?: AbortSignal
}

export interface WebMCPTool<TArgs = unknown, TResult = unknown> {
  name: string
  description: string
  inputSchema?: JSONSchema
  annotations?: ToolAnnotations
  execute: (
    args: TArgs,
    context: ToolExecutionContext,
  ) => TResult | Promise<TResult>
  formatOutput?: (result: TResult, args: TArgs) => unknown
  onError?: (error: Error) => void
}

export interface ToolExecutionContext {
  signal: AbortSignal
}

export interface WebMCPToolOptions {
  registration?: Record<string, unknown>
}

export interface ModelContextLike {
  registerTool(
    tool: WebMCPTool,
    options?: RegistrationOptions,
  ): void | Promise<void>
  unregisterTool?(name: string): void | Promise<void>
  getTools?(): WebMCPTool[]
  executeTool?(name: string, args?: unknown): Promise<unknown>
  addEventListener?(type: 'toolchange', listener: EventListener): void
  removeEventListener?(type: 'toolchange', listener: EventListener): void
}

export interface WebMCPEnvironment {
  getModelContext(): ModelContextLike | undefined
  createAbortController(): AbortController
  onCapabilityChange?(listener: () => void): () => void
}
