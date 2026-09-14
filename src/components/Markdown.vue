<script lang="ts">
import { katex, type MarkdownItKatexOptions } from '@mdit/plugin-katex'
import 'katex/dist/katex.min.css'
import MarkdownIt from 'markdown-it'
import '@mdit/plugin-katex/mhchem'

const mdit = MarkdownIt().use(katex, {
  delimiters: 'all',
} satisfies MarkdownItKatexOptions)
</script>

<script lang="ts" setup>
import remend from 'remend'
import { computed } from 'vue'
import 'github-markdown-css/github-markdown.css'

export interface MarkdownContentProps {
  content?: string
}

const props = defineProps<MarkdownContentProps>()

const html = computed(() => {
  const content = remend(props.content?.trim() || '')
  return mdit.render(content)
})
</script>

<template>
  <div class="markdown-body" v-html="html"></div>
</template>

<style lang="less" scoped>
.markdown-body {
  --bgColor-default: transparent;
  --bgColor-muted: var(--color-surface-2);
  --bgColor-neutral-muted: var(--color-surface-2);
  --bgColor-attention-muted: #fff8c5;

  --fgColor-default: var(--color-ink);
  --fgColor-muted: var(--color-ink-muted);
  --fgColor-accent: var(--color-accent);
  --fgColor-attention: #9a6700;
  --fgColor-danger: var(--color-danger);
  --fgColor-success: #1a7f37;
  --fgColor-done: #8250df;

  --borderColor-default: var(--color-line);
  --borderColor-muted: var(--color-line);
  --borderColor-neutral-muted: var(--color-line);
  --borderColor-accent-emphasis: var(--color-accent);
  --borderColor-attention-emphasis: #9a6700;
  --borderColor-danger-emphasis: var(--color-danger);
  --borderColor-success-emphasis: #1a7f37;
  --borderColor-done-emphasis: #8250df;

  --focus-outlineColor: var(--color-accent);
}

[data-theme='dark'] .markdown-body {
  --bgColor-attention-muted: #bb800926;
  --fgColor-attention: #d29922;
  --fgColor-success: #3fb950;
  --fgColor-done: #ab7df8;
  --borderColor-attention-emphasis: #9e6a03;
  --borderColor-success-emphasis: #238636;
  --borderColor-done-emphasis: #8957e5;
}
</style>


<style>
.katex-html {
  overflow-x: auto;
  overflow-y: hidden;

  &::-webkit-scrollbar {
    height: 2px;
  }
}
</style>
