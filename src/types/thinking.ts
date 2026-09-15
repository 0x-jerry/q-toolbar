export const THINKING_LEVELS = [
  'none',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
] as const

export type ThinkingLevel = (typeof THINKING_LEVELS)[number]

export const DEFAULT_THINKING_LEVEL: ThinkingLevel = 'none'

export function normalizeThinkingLevel(value: unknown): ThinkingLevel {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return 'medium'
  }

  if (
    typeof value === 'string' &&
    (THINKING_LEVELS as readonly string[]).includes(value)
  ) {
    return value as ThinkingLevel
  }

  return DEFAULT_THINKING_LEVEL
}
