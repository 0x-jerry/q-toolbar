<script lang="ts" setup>
import Markdown from '../Markdown.vue'
import { ref, useTemplateRef } from 'vue'
import { t } from 'i18next'
import { useElementSize } from '@vueuse/core'

export interface ChatReasoningContentProps {
  content: string
  expanded?: boolean
  initExpanded?: boolean
}

const props = defineProps<ChatReasoningContentProps>()

const expanded = ref(props.initExpanded)

const contentRef = useTemplateRef('contentRef')

const { height } = useElementSize(contentRef)
</script>

<template>
  <div class="reasoning" :class="{ 'is-expanded': expanded }">
    <div
      class="flex mb-1 text-gray-4 items-center select-none cursor-pointer"
      @click="expanded = !expanded"
    >
      <div class="flex-1 truncate">{{ t('common.thinkingContent') }}</div>
      <div class="icon i-carbon-chevron-down text-xl mr-1"></div>
    </div>
    <div class="content" :style="{ height: expanded ? height + 'px' : 0 }">
      <Markdown ref="contentRef" :content="content" />
    </div>
  </div>
</template>

<style lang="less" scoped>
.reasoning {
  border-left: 4px solid #ddd;
  margin-bottom: 8px;
  padding-left: 8px;

  .icon {
    --uno: transition;
    transition-property: rotate;

    rotate: 0deg;
  }

  .content {
    height: 0;
    overflow: hidden;
    opacity: 0.5;

    --uno: transition;
    transition-property: height;
  }

  &.is-expanded {
    .icon {
      rotate: 180deg;
    }

    .content {
      height: max-content;
    }
  }
}
</style>
