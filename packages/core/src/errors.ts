import { normalizeError } from './normalize.js'

export class ToolRegistrationError extends Error {
  override readonly cause: unknown

  constructor(toolName: string, cause: unknown) {
    const message = normalizeError(cause).message
    super(`Failed to register tool "${toolName}": ${message}`)
    this.name = 'ToolRegistrationError'
    this.cause = cause
  }
}

export class ToolTimeoutError extends Error {
  constructor(toolName: string) {
    super(`Timed out waiting for WebMCP support for tool "${toolName}"`)
    this.name = 'ToolTimeoutError'
  }
}

export class DuplicateToolNameError extends Error {
  readonly toolName: string

  constructor(toolName: string, operation = 'register') {
    super(`Cannot ${operation} tool "${toolName}": a tool with that name is already owned`)
    this.name = 'DuplicateToolNameError'
    this.toolName = toolName
  }
}

export class ToolReplacementError extends Error {
  override readonly cause: unknown
  readonly restorationCause: unknown

  constructor(toolName: string, cause: unknown, restorationCause: unknown) {
    super(`Failed to replace tool "${toolName}": ${normalizeError(cause).message}; restoration failed: ${normalizeError(restorationCause).message}`)
    this.name = 'ToolReplacementError'
    this.cause = cause
    this.restorationCause = restorationCause
  }
}
