export interface ToolContent {
  type: 'text'
  text: string
}

export interface ToolResult {
  content: ToolContent[]
  isError?: boolean
}

const UNSERIALIZABLE_VALUE = '[unserializable value]'

function trySerialize(value: unknown): string | undefined {
  try {
    const serialized = JSON.stringify(value)

    return typeof serialized === 'string' ? serialized : undefined
  } catch {
    return undefined
  }
}

function safeString(value: unknown): string {
  try {
    return String(value)
  } catch {
    return UNSERIALIZABLE_VALUE
  }
}

function serializeForError(value: unknown): string {
  return trySerialize(value) ?? safeString(value)
}

function isToolResult(value: unknown): value is ToolResult {
  try {
    if (typeof value !== 'object' || value === null || !('content' in value)) {
      return false
    }

    return Array.isArray(value.content) && value.content.every(
      (item): item is ToolContent =>
        typeof item === 'object' &&
        item !== null &&
        item.type === 'text' &&
        typeof item.text === 'string',
    )
  } catch {
    return false
  }
}

export function normalizeResult(value: unknown): ToolResult {
  if (isToolResult(value)) {
    return value
  }

  if (value === undefined || value === null) {
    return { content: [] }
  }

  const text = typeof value === 'string' ? value : trySerialize(value)

  if (text === undefined) {
    return errorResult(value)
  }

  return {
    content: [{
      type: 'text',
      text,
    }],
  }
}

export function normalizeError(value: unknown): Error {
  if (value instanceof Error) {
    return value
  }

  return new Error(typeof value === 'string' ? value : serializeForError(value))
}

export function errorResult(value: unknown): ToolResult {
  const error = normalizeError(value)

  return {
    content: [{ type: 'text', text: safeString(error.message) }],
    isError: true,
  }
}
