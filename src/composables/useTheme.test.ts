import { describe, expect, it } from 'vitest'
import { applyTheme, resolveTheme } from './useTheme'

describe('resolveTheme', () => {
  it('uses the explicit mode', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the system preference in system mode', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})

describe('applyTheme', () => {
  it('sets both theme markers used by tokens and tdesign', () => {
    const el = document.createElement('div')

    applyTheme('dark', el)

    expect(el.dataset.theme).toBe('dark')
    expect(el.getAttribute('theme-mode')).toBe('dark')
  })
})
