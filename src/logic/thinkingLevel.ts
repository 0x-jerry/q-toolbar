import { THINKING_LEVELS, type ThinkingLevel } from '../types'

const LABEL_KEYS: Record<ThinkingLevel, string> = {
  none: 'common.thinkingLevelNone',
  low: 'common.thinkingLevelLow',
  medium: 'common.thinkingLevelMedium',
  high: 'common.thinkingLevelHigh',
  xhigh: 'common.thinkingLevelXHigh',
  max: 'common.thinkingLevelMax',
}

export function thinkingLevelOptions(t: (key: string) => string) {
  return THINKING_LEVELS.map((value) => ({
    label: t(LABEL_KEYS[value]),
    value,
  }))
}
