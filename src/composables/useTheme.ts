import { createSharedComposable, useMediaQuery, useStorage } from '@vueuse/core'
import { computed, watch } from 'vue'
import type { ThemeMode } from '../types'
import { useAppBasicConfig } from './useAppBasicConfig'

export type ResolvedTheme = 'light' | 'dark'

const THEME_STORAGE_KEY = 'app-theme'

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function resolveTheme(
  mode: ThemeMode,
  prefersDark: boolean,
): ResolvedTheme {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return mode === 'dark' ? 'dark' : 'light'
}

export function applyTheme(
  theme: ResolvedTheme,
  el: HTMLElement = document.documentElement,
) {
  el.dataset.theme = theme
  el.setAttribute('theme-mode', theme)
}

export const useTheme = createSharedComposable(() => {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const cachedMode = useStorage<ThemeMode>(THEME_STORAGE_KEY, 'system')

  const config = useAppBasicConfig()
  void config.load()

  const mode = computed<ThemeMode>(() => {
    const persisted = config.data.theme
    if (isThemeMode(persisted)) {
      return persisted
    }

    return isThemeMode(cachedMode.value) ? cachedMode.value : 'system'
  })

  const resolved = computed(() => resolveTheme(mode.value, prefersDark.value))

  watch(
    resolved,
    (theme) => {
      applyTheme(theme)
    },
    { immediate: true },
  )

  watch(
    mode,
    (next) => {
      cachedMode.value = next
    },
    { immediate: true },
  )

  async function setMode(next: ThemeMode) {
    if (!config.isLoaded) {
      await config.load()
    }

    const previousTheme = config.data.theme
    const previousCached = cachedMode.value

    config.data.theme = next
    cachedMode.value = next

    try {
      await config.save()
    } catch (error) {
      config.data.theme = previousTheme
      cachedMode.value = previousCached
      throw error
    }
  }

  return {
    mode,
    resolved,
    setMode,
  }
})
