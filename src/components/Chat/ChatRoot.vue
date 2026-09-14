<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from 'vue'
import type { IChatHistoryMsgItem } from '../../database/chatHistoryMsg'
import type { IEndpointConfigModel } from '../../database/endpointConfig'
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
  endpointOptions?: IEndpointConfigModel[]
}

export interface ChatRoomEmits extends ChatInputEmits {
  'delete-msg': [msg: IChatHistoryMsgItem]
  'reset-to-msg': [msg: IChatHistoryMsgItem]
  'continue-from-msg': [msg: IChatHistoryMsgItem]
}

const props = defineProps<ChatRoomProps>()

const emit = defineEmits<ChatRoomEmits>()

const endpointConfigId = defineModel<number | undefined>('endpointConfigId')

const containerEl = useTemplateRef('scrollEl')

const composerEl = useTemplateRef<HTMLElement>('composerEl')
const composerSize = useElementSize(composerEl)

const composerOffset = computed(() => `${composerSize.height.value + 24}px`)

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

watch(
  () => composerSize.height.value,
  () => {
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
    <div class="scroll-wrap">
      <div
        class="scroll-area"
        ref="scrollEl"
        :style="{ paddingBottom: composerOffset }"
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

      <div
        class="floating-btn"
        :class="{ 'is-visible': !isStickyToBottom }"
        :style="{ bottom: composerOffset }"
      >
        <Button shape="circle" theme="default" @click="handleClickToBottom">
          <div class="i-carbon-chevron-down text-2xl"></div>
        </Button>
      </div>
    </div>

    <div class="composer-dock" ref="composerEl">
      <ChatInput
        v-model:endpoint-config-id="endpointConfigId"
        :endpoint-options="endpointOptions"
        :is-processing="isProcessing"
        @send="handleSend"
        @abort="emit('abort')"
      />
    </div>
  </div>
</template>

<style lang="less" scoped>
.chat-root {
  position: relative;
  height: 100%;
}

.scroll-wrap {
  position: relative;
  height: 100%;
}

.scroll-area {
  height: 100%;
  overflow: auto;
  padding: 12px;
}

.composer-dock {
  position: absolute;
  z-index: 2;
  right: 12px;
  bottom: 12px;
  left: 12px;
}

.floating-btn {
  position: absolute;
  z-index: 1;
  right: 12px;

  --uno: transition;

  scale: 0;

  transition-property: scale;

  &.is-visible {
    scale: 1;
  }
}
</style>
