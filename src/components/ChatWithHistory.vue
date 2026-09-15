<script lang="ts" setup>
import { createPromise, type Optional } from '@0x-jerry/utils'
import { useLoading } from '@0x-jerry/vue-kit'
import { watchImmediate } from '@vueuse/core'
import { computed, reactive, ref } from 'vue'
import {
  chatHistoryTable,
  type IChatHistoryModel,
} from '../database/chatHistory'
import {
  chatHistoryMsgTable,
  type IChatHistoryMsgItem,
  type IChatHistoryMsgModel,
} from '../database/chatHistoryMsg'
import type { IEndpointConfigModel } from '../database/endpointConfig'
import { ChatRole } from '../logic/chat'
import ChatRoot from './Chat/ChatRoot.vue'
import { streamText, type ModelMessage } from 'ai'
import {
  createOpenAICompatible,
} from '@ai-sdk/openai-compatible'
import { fetchWithProxy } from '../logic/fetchWithProxy'
import type { IPromptConfigItem } from '../database/promptConfig'
import { DEFAULT_THINKING_LEVEL } from '../types'

export interface ChatWithHistoryProps {
  historyId: number
  endpointOptions?: IEndpointConfigModel[]

  /**
   * This config priority is higher than endpointOptions
   */
  promptConfig?: IPromptConfigItem
}

const props = defineProps<ChatWithHistoryProps>()

const endpointConfigId = defineModel<number | undefined>('endpointConfigId')

const selectedEndpoint = computed(() =>
  props.endpointOptions?.find((c) => c.id === endpointConfigId.value),
)

const state = reactive({
  selectedText: '',
  pinned: false,
  messages: [] as IChatHistoryMsgItem[],
  responseMsg: null as Optional<IChatHistoryMsgModel>,
})

let streamRef: Optional<AbortController>

const chatHistory = ref<IChatHistoryModel>()

let updateDataPromise = null as null | Promise<void>

const handleSendMsg = useLoading(_handleSendMsg)
const continueChatStream = useLoading(_continueChatStream)

const isProcessing = computed(
  () => handleSendMsg.isLoading || continueChatStream.isLoading,
)

watchImmediate(
  () => props.historyId,
  () => {
    updateDataPromise = updateHistoryData()
  },
)

async function updateHistoryData() {
  chatHistory.value = await chatHistoryTable.getById(props.historyId)

  await updateMessages()
}

async function updateMessages() {
  const msgs = await chatHistoryMsgTable.getMsgs(props.historyId)

  state.messages = msgs
}

async function updateChatTitle(newTitle: string) {
  const history = chatHistory.value
  if (!history) {
    throw new Error(`Chat history is not initialized`)
  }

  await chatHistoryTable.updateOne({
    ...history,
    name: newTitle,
  })

  chatHistory.value = await chatHistoryTable.getById(history.id)
}

async function _handleSendMsg(msgContent: string) {
  await updateDataPromise

  const historyId = props.historyId

  const newMsgItem = await chatHistoryMsgTable.createOne({
    chatHistoryId: historyId,
    role: ChatRole.User,
    content: msgContent,
    reasoning: '',
  })

  state.messages.push(newMsgItem)

  await continueChatStream()
}

async function saveResponseMsgItem() {
  if (!state.responseMsg?.id) return

  await chatHistoryMsgTable.updateOne({
    ...state.responseMsg,
  })
}

async function _continueChatStream() {
  const historyId = props.historyId

  state.responseMsg = await chatHistoryMsgTable.createOne({
    chatHistoryId: historyId,
    role: ChatRole.Assistant,
    content: '',
    reasoning: '',
  })

  state.messages.push(state.responseMsg)

  try {
    await _startChatStream(state.messages.slice(0, -1))
  } catch (_) {
    // ignore all error
  }
}

async function _startChatStream(msgs: IChatHistoryMsgItem[]) {
  const endpointConfig = selectedEndpoint.value
  const { apiKey, baseUrl } =
    props.promptConfig?.endpointConfig || endpointConfig || {}
  const model =
    props.promptConfig?.model ||
    props.promptConfig?.endpointConfig?.model ||
    endpointConfig?.model
  const thinkingLevel =
    props.promptConfig?.thinkingLevel ??
    props.promptConfig?.endpointConfig?.thinkingLevel ??
    endpointConfig?.thinkingLevel ??
    DEFAULT_THINKING_LEVEL

  if (!baseUrl || !apiKey || !model) {
    throw new Error(`Endpoint config is missing`)
  }

  const providerName = 'my-provider'
  const openaiProvider = createOpenAICompatible({
    name: providerName,
    apiKey,
    baseURL: baseUrl,
    fetch: fetchWithProxy,
  })

  streamRef?.abort('Abort by new chat request')
  streamRef = new AbortController()

  const resultPromise = createPromise<void>()

  const instance = streamText({
    model: openaiProvider(model),
    providerOptions: {
      [providerName]: {
        enable_thinking: thinkingLevel !== 'none',
        reasoningEffort: thinkingLevel,
      },
    },
    messages: msgs.map((msg) => {
      const item: ModelMessage = {
        role: msg.role === ChatRole.User ? ChatRole.User : ChatRole.Assistant,
        content: msg.content,
      }

      return item
    }),
    abortSignal: streamRef.signal,
    onError(evt) {
      resultPromise.reject(evt.error)
    },
    onFinish() {
      state.responseMsg = null
      streamRef = null

      resultPromise.resolve()
    },
    onAbort() {
      resultPromise.reject(`Aborted`)
    },
  })

  for await (const chunk of instance.fullStream) {
    if (!state.responseMsg) {
      throw new Error(`Response message instance is null`)
    }

    switch (chunk.type) {
      case 'reasoning-delta':
        state.responseMsg.reasoning += chunk.text || ''
        break
      case 'text-delta':
        state.responseMsg.content += chunk.text || ''
        break

      default:
        break
    }

    await saveResponseMsgItem()
  }

  return resultPromise.promise
}

function handleAbort() {
  const canAbort = streamRef && !streamRef.signal.aborted
  streamRef?.abort()
  streamRef = null

  return canAbort
}

async function handleResetToMsg(msg: IChatHistoryMsgItem) {
  const idx = state.messages.findIndex((n) => n.id === msg.id)
  if (idx === -1) {
    return
  }

  const removedMsgs = state.messages.splice(idx + 1)

  // biome-ignore lint/style/noNonNullAssertion: Ensured exists
  await chatHistoryMsgTable.deleteBatchByIds(removedMsgs.map((n) => n.id!))
}

async function handleDeleteMsg(msg: IChatHistoryMsgItem) {
  const idx = state.messages.findIndex((n) => n.id === msg.id)
  if (idx === -1) {
    return
  }

  const removedMsg = state.messages.splice(idx, 1).at(0)
  if (!removedMsg?.id) {
    return
  }

  await chatHistoryMsgTable.deleteById(removedMsg.id)
}

async function handleContinue(msg: IChatHistoryMsgItem) {
  await handleResetToMsg(msg)
  if (isProcessing.value) {
    return
  }

  await continueChatStream()
}

defineExpose({
  sendMsg: handleSendMsg,
  abortStream: handleAbort,
})
</script>

<template>
  <template v-if="chatHistory">
    <ChatRoot
      v-model:endpoint-config-id="endpointConfigId"
      :title="chatHistory.name"
      :messages="state.messages"
      :is-processing="isProcessing"
      :endpoint-options="endpointOptions"
      @rename-title="updateChatTitle"
      @send="handleSendMsg"
      @abort="handleAbort"
      @reset-to-msg="handleResetToMsg"
      @delete-msg="handleDeleteMsg"
      @continue-from-msg="handleContinue"
    />
  </template>
  <template v-else>
    <div class="loading">Loading ...</div>
  </template>
</template>

<style lang="scss" scoped></style>
