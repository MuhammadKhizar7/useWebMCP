import type { ToolControllerOptions } from 'webmcp-tool-core'
import type { WebMCPEnvironment } from 'webmcp-tool-core'

export type UseWebMCPOptions<TArgs = unknown, TResult = unknown> = ToolControllerOptions<TArgs, TResult>

export interface UseWebMCPConfig {
  environment?: WebMCPEnvironment
}

export interface UseWebMCPState {
  supported: import('vue').ShallowRef<boolean>
  registered: import('vue').ShallowRef<boolean>
  error: import('vue').ShallowRef<Error | null>
}
