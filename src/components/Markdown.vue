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
}
</style>
