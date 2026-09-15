import { describe, expect, it } from 'vitest'
import { normalizeThinkingLevel } from './thinking'

describe('normalizeThinkingLevel', () => {
  it('keeps valid levels', () => {
    expect(normalizeThinkingLevel('high')).toBe('high')
    expect(normalizeThinkingLevel('xhigh')).toBe('xhigh')
  })

  it('maps legacy reasoning booleans to a level', () => {
    expect(normalizeThinkingLevel(true)).toBe('medium')
    expect(normalizeThinkingLevel(1)).toBe('medium')
    expect(normalizeThinkingLevel('true')).toBe('medium')
  })

  it('falls back to none for unknown or disabled values', () => {
    expect(normalizeThinkingLevel(false)).toBe('none')
    expect(normalizeThinkingLevel(0)).toBe('none')
    expect(normalizeThinkingLevel(null)).toBe('none')
    expect(normalizeThinkingLevel('bogus')).toBe('none')
  })
})
