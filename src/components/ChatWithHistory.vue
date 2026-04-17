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
import type { IEndpointConfigItem } from '../database/endpointConfig'
import { ChatRole } from '../logic/chat'
import ChatRoot from './Chat/ChatRoot.vue'
import { streamText, type ModelMessage } from 'ai'
import {
  createOpenAICompatible,
  type OpenAICompatibleProviderOptions,
} from '@ai-sdk/openai-compatible'
import { fetchWithProxy } from '../logic/fetchWithProxy'

export interface ChatWithHistoryProps {
  historyId: number
  endpointConfig?: IEndpointConfigItem
}

const props = defineProps<ChatWithHistoryProps>()

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
  })

  state.messages.push(state.responseMsg)

  try {
    await _startChatStream(state.messages.slice(0, -1))
  } catch (_) {
    // ignore all error
  }
}

async function _startChatStream(msgs: IChatHistoryMsgItem[]) {
  const { apiKey, model, baseUrl } = props.endpointConfig || {}

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
        reasoningEffort: 'none',
      } satisfies OpenAICompatibleProviderOptions,
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
      resultPromise.reject(evt)
    },
    onFinish() {
      state.responseMsg = null
      streamRef = null

      resultPromise.resolve()
    },
    onAbort(evt) {
      resultPromise.reject(evt)
    },
  })

  for await (const chunk of instance.textStream) {
    const content = chunk

    if (!state.responseMsg) {
      throw new Error(`Response message instance is null`)
    }

    state.responseMsg.content += content || ''
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
      :title="chatHistory.name"
      :messages="state.messages"
      :is-processing="isProcessing"
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
