<script setup lang="ts">
import { useAsyncData } from '@0x-jerry/vue-kit'
import { computed, onMounted, reactive, ref } from 'vue'
import ChatWithHistory from '../../components/ChatWithHistory.vue'
import { useI18n } from '../../composables'
import { chatHistoryTable, type IChatHistoryModel } from '../../database/chatHistory'
import { endpointConfigTable } from '../../database/endpointConfig'
import MainChatHeader from './components/MainChatHeader.vue'
import MainHistorySidebar from './components/MainHistorySidebar.vue'

const endpointConfigsApi = useAsyncData(endpointConfigTable.findAll, [])

const { t } = useI18n()

const selectedHistory = ref<IChatHistoryModel | null>(null)

const state = reactive({
  endpointConfigId: undefined as number | undefined,
})

const selectedEndpoint = computed(() => {
  return endpointConfigsApi.data.value.find(
    (c) => c.id === state.endpointConfigId,
  )
})

onMounted(() => {
  void fetchEndpointsData()
})

async function fetchEndpointsData() {
  await endpointConfigsApi.load()

  const hit = endpointConfigsApi.data.value.find(
    (c) => c.id === state.endpointConfigId,
  )
  if (!hit) {
    state.endpointConfigId = endpointConfigsApi.data.value[0]?.id
  }
}

async function updateHistoryName(name: string) {
  const selected = selectedHistory.value
  if (!selected) return

  await chatHistoryTable.updateOne({
    ...selected,
    name,
  })

  // No need to reload all, just update local
  selected.name = name
}
</script>

<template>
  <div class="flex h-full">
    <MainHistorySidebar v-model:selected-history="selectedHistory" />

    <section class="flex flex-col h-full flex-1 w-0 bg-white">
      <template v-if="selectedHistory">
        <MainChatHeader
          v-model:endpoint-config-id="state.endpointConfigId"
          :history-name="selectedHistory.name"
          :endpoint-options="endpointConfigsApi.data.value"
          @rename="updateHistoryName"
        />

        <div class="flex-1 h-0">
          <ChatWithHistory :history-id="selectedHistory.id" :endpoint-config="selectedEndpoint" />
        </div>
      </template>
      <template v-else>
        <div class="flex items-center justify-center h-full text-muted">
          {{ t('chat.selectHistory') }}
        </div>
      </template>
    </section>
  </div>
</template>
