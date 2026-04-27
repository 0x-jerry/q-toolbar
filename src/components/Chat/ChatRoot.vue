<script setup lang="ts">
import { nextTick, ref, shallowRef, useTemplateRef } from 'vue'
import type { IChatHistoryMsgItem } from '../../database/chatHistoryMsg'
import ChatInput, { type ChatInputEmits } from './ChatInput.vue'
import ChatMessageList from './ChatMessageList.vue'
import { Button } from 'tdesign-vue-next'
import {
  useCurrentElement,
  useElementSize,
  watchImmediate,
  type VueInstance,
} from '@vueuse/core'

export interface ChatRoomProps {
  title: string
  messages: IChatHistoryMsgItem[]
  isProcessing?: boolean
}

export interface ChatRoomEmits extends ChatInputEmits {
  'delete-msg': [msg: IChatHistoryMsgItem]
  'reset-to-msg': [msg: IChatHistoryMsgItem]
  'continue-from-msg': [msg: IChatHistoryMsgItem]
}

const props = defineProps<ChatRoomProps>()

const emit = defineEmits<ChatRoomEmits>()

const containerEl = useTemplateRef('scrollEl')

const scrollContentComponent = shallowRef<VueInstance>(
  null as unknown as VueInstance,
)
const scrollContentEl = useCurrentElement(scrollContentComponent)

const size = useElementSize(scrollContentEl)

const isStickyToBottom = ref(true)

watchImmediate(
  () => size.height.value,
  async () => {
    scrollToBottom()
  },
)

async function scrollToBottom() {
  if (!isStickyToBottom.value) {
    return
  }

  await nextTick()
  containerEl.value?.scrollTo({
    top: containerEl.value.scrollHeight,
    behavior: 'smooth',
  })
}

function handleSend(content: string) {
  emit('send', content)
}

function handleClickToBottom() {
  isStickyToBottom.value = true
  scrollToBottom()
}

function handleScrollEvent(evt: WheelEvent) {
  if (evt.deltaY >= 0) {
    const el = containerEl.value
    if (!el) return

    const isHitBottom =
      el.scrollTop + evt.deltaY + el.clientHeight >=
      el.scrollHeight - 5 /* Offset */

    isStickyToBottom.value = isHitBottom
    return
  }

  isStickyToBottom.value = false
}
</script>

<template>
  <div class="chat-root">
    <div class="flex-1 h-0 relative">
      <div
        class="h-full overflow-auto p-3"
        ref="scrollEl"
        @wheel="handleScrollEvent"
      >
        <ChatMessageList
          ref="scrollContentComponent"
          :messages="messages"
          @delete="emit('delete-msg', $event)"
          @reset-to="emit('reset-to-msg', $event)"
          @continue="emit('continue-from-msg', $event)"
        />
      </div>

      <div class="floating-btn" :class="{ 'is-visible': !isStickyToBottom }">
        <Button shape="circle" theme="default" @click="handleClickToBottom">
          <div class="i-carbon-chevron-down text-2xl"></div>
        </Button>
      </div>
    </div>

    <ChatInput
      :is-processing="isProcessing"
      @send="handleSend"
      @abort="emit('abort')"
    />
  </div>
</template>

<style lang="less" scoped>
.chat-root {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.floating-btn {
  position: absolute;

  --uno: transition right-3 bottom-3;
  scale: 0;

  transition-property: scale;

  &.is-visible {
    scale: 1;
  }
}
</style>
