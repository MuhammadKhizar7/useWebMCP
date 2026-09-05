import { describe, expect, it } from 'vitest'
import {
  errorResult,
  normalizeError,
  normalizeResult,
} from '../src/index'

describe('normalizeResult', () => {
  it('preserves an existing content response by identity', () => {
    const result = { content: [{ type: 'text', text: 'already normalized' }] }

    expect(normalizeResult(result)).toBe(result)
  })

  it.each([
    [undefined, { content: [] }],
    [null, { content: [] }],
    ['hello', { content: [{ type: 'text', text: 'hello' }] }],
    [42, { content: [{ type: 'text', text: '42' }] }],
    [[1, 'two'], { content: [{ type: 'text', text: '[1,"two"]' }] }],
    [{ answer: true }, { content: [{ type: 'text', text: '{"answer":true}' }] }],
  ])('normalizes %p to %p', (value, expected) => {
    expect(normalizeResult(value)).toEqual(expected)
  })

  it.each([
    [BigInt(42), '42'],
    [Symbol('value'), 'Symbol(value)'],
  ])('normalizes unsupported returned values as execution errors', (value, text) => {
    const result = normalizeResult(value)

    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toEqual(text)
  })

  it('normalizes returned functions as execution errors', () => {
    const result = normalizeResult(function unsupported() {})

    expect(result.isError).toBe(true)
    expect(result.content[0]?.text).toContain('unsupported')
  })

  it('normalizes circular returned values as execution errors', () => {
    const value: Record<string, unknown> = {}
    value['self'] = value

    expect(normalizeResult(value)).toEqual({
      content: [{ type: 'text', text: '[object Object]' }],
      isError: true,
    })
  })

  it('keeps undefined successful results as empty content', () => {
    expect(normalizeResult(undefined)).toEqual({ content: [] })
  })

  it('does not pass malformed content through by identity', () => {
    const result = { content: 'not an array' }

    expect(normalizeResult(result)).toEqual({
      content: [{ type: 'text', text: '{"content":"not an array"}' }],
    })
  })

  it('does not pass malformed content blocks through by identity', () => {
    const result = { content: [{ type: 'text', text: 123 }] }

    expect(normalizeResult(result)).toEqual({
      content: [{ type: 'text', text: '{"content":[{"type":"text","text":123}]}' }],
    })
  })
})

describe('normalizeError', () => {
  it('preserves Error instances', () => {
    const error = new Error('failed')

    expect(normalizeError(error)).toBe(error)
  })

  it.each([
    ['failed', 'failed'],
    [{ reason: 'failed' }, '{"reason":"failed"}'],
    [null, 'null'],
    [undefined, 'undefined'],
  ])('normalizes thrown %p to an Error with text %p', (value, text) => {
    expect(normalizeError(value)).toEqual(new Error(text))
  })

  it('uses a string fallback for circular thrown values', () => {
    const value: Record<string, unknown> = {}
    value['self'] = value

    expect(normalizeError(value)).toEqual(new Error('[object Object]'))
  })

  it('normalizes hostile serialization and string fallback without throwing', () => {
    const value = {
      toJSON() {
        throw new Error('serialization failed')
      },
      [Symbol.toPrimitive]() {
        throw new Error('coercion failed')
      },
    }

    expect(normalizeError(value)).toEqual(new Error('[unserializable value]'))
    expect(normalizeResult(value)).toEqual({
      content: [{ type: 'text', text: '[unserializable value]' }],
      isError: true,
    })
    expect(errorResult(value)).toEqual({
      content: [{ type: 'text', text: '[unserializable value]' }],
      isError: true,
    })
  })

  it('returns an error tool result with normalized display text', () => {
    expect(errorResult('bad input')).toEqual({
      content: [{ type: 'text', text: 'bad input' }],
      isError: true,
    })
  })
})
