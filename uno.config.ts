import {
  defineConfig,
  presetIcons,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'

export default defineConfig({
  presets: [presetWind3(), presetIcons()],
  transformers: [transformerVariantGroup(), transformerDirectives()],
  theme: {
    colors: {
      canvas: 'var(--color-canvas)',
      surface: {
        DEFAULT: 'var(--color-surface)',
        2: 'var(--color-surface-2)',
        3: 'var(--color-surface-3)',
      },
      line: {
        DEFAULT: 'var(--color-line)',
        strong: 'var(--color-line-strong)',
      },
      ink: {
        DEFAULT: 'var(--color-ink)',
        muted: 'var(--color-ink-muted)',
        faint: 'var(--color-ink-faint)',
      },
      accent: {
        DEFAULT: 'var(--color-accent)',
        soft: 'var(--color-accent-soft)',
      },
      danger: 'var(--color-danger)',
      'msg-user': 'var(--color-msg-user)',
      'msg-assistant': 'var(--color-msg-assistant)',
    },
  },
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
  },
})
