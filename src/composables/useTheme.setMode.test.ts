import { effectScope } from 'vue'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/window', () => ({
  getCurrentWindow: () => ({ listen: mocks.listen }),
}))

import { useAppBasicConfig } from './useAppBasicConfig'
import { useTheme } from './useTheme'

describe('useAppBasicConfig', () => {
  it('shares a single snapshot between consumers', () => {
    mocks.invoke.mockResolvedValue({ version: 4, theme: 'light' })
    mocks.listen.mockResolvedValue(() => {})

    const scope = effectScope()
    const [first, second] = scope.run(() => [
      useAppBasicConfig(),
      useAppBasicConfig(),
    ])!

    expect(first).toBe(second)

    scope.stop()
  })
})

describe('useTheme', () => {
  it('rolls the theme back when saving fails', async () => {
    mocks.invoke.mockImplementation((command: string) => {
      if (command === 'get_configuration') {
        return Promise.resolve({ version: 4, theme: 'light' })
      }
      if (command === 'save_configuration') {
        return Promise.reject(new Error('save failed'))
      }

      return Promise.resolve(undefined)
    })
    mocks.listen.mockResolvedValue(() => {})

    const scope = effectScope()
    const theme = scope.run(() => useTheme())!

    await vi.waitFor(() => expect(theme.mode.value).toBe('light'))

    await expect(theme.setMode('dark')).rejects.toThrow('save failed')
    expect(theme.mode.value).toBe('light')

    scope.stop()
  })
})
