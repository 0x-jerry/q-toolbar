<script setup lang="ts">
import { useAsyncData } from '@0x-jerry/vue-kit'
import { useDebounceFn, useInfiniteScroll } from '@vueuse/core'
import dayjs from 'dayjs'
import { Button, Empty, Input } from 'tdesign-vue-next'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import Icon from '../../../components/Icon.vue'
import { useI18n } from '../../../composables'
import { useWinEventListener } from '../../../composables/useWinEventListener'
import {
  chatHistoryTable,
  type IChatHistoryModel,
} from '../../../database/chatHistory'
import { WindowEventName } from '../../../logic/events'

const HISTORY_PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 250

const selectedHistory = defineModel<IChatHistoryModel | null>('selectedHistory', {
  default: null,
})

const { t } = useI18n()

const state = reactive({
  search: '',
})

const historyState = reactive({
  data: [] as IChatHistoryModel[],
  current: 0,
  size: HISTORY_PAGE_SIZE,
  hasMore: true,
  loading: false,
})

const historyApi = useAsyncData(chatHistoryTable.searchPage, [])
const listContainer = ref<HTMLElement | null>(null)
const historyQueryToken = ref(0)

const searchKeyword = computed(() => state.search.trim())

const loadMoreHistoriesWithDebounce = useDebounceFn(() => {
  void loadMoreHistories(true)
}, SEARCH_DEBOUNCE_MS)

useInfiniteScroll(listContainer, () => void loadMoreHistories(), {
  distance: 10,
})

watch(searchKeyword, () => {
  loadMoreHistoriesWithDebounce()
})

onMounted(() => {
  void loadMoreHistories(true)
})

useWinEventListener(WindowEventName.WindowShow, () => {
  void loadMoreHistories(true)
})

async function loadMoreHistories(reset = false) {
  if (reset) {
    resetHistoryState()
  }

  if (!historyState.hasMore || (historyState.loading && !reset)) return

  historyState.loading = true
  const queryToken = ++historyQueryToken.value

  try {
    await historyApi.load({
      current: historyState.current,
      size: historyState.size,
      desc: true,
      keyword: searchKeyword.value,
    })

    if (queryToken !== historyQueryToken.value) {
      return
    }

    applyHistoryPage(historyApi.data.value, reset)
    syncSelectedHistory()
  } finally {
    if (queryToken === historyQueryToken.value) {
      historyState.loading = false
    }
  }
}

function resetHistoryState() {
  historyState.current = 0
  historyState.hasMore = true
}

function applyHistoryPage(res: IChatHistoryModel[], reset: boolean) {
  if (res.length < historyState.size) {
    historyState.hasMore = false
  }

  if (reset) {
    historyState.data = res
    historyState.current = 1
    return
  }

  historyState.data.push(...res)
  historyState.current++
}

function syncSelectedHistory() {
  if (!selectedHistory.value) return

  const selected = historyState.data.find(
    (history) => history.id === selectedHistory.value?.id,
  )

  if (!selected) {
    selectedHistory.value = null
    return
  }

  selectedHistory.value = selected
}

async function createNewChat() {
  const chatHistory = await chatHistoryTable.createOne({
    name: t('common.untitled'),
  })

  await loadMoreHistories(true)
  selectedHistory.value
    = historyState.data.find((history) => history.id === chatHistory.id) || chatHistory
}

async function handleDeleteHistory(history: IChatHistoryModel) {
  await chatHistoryTable.deleteAllById(history.id)

  const idx = historyState.data.findIndex((item) => item.id === history.id)
  if (idx > -1) {
    historyState.data.splice(idx, 1)
  }

  if (selectedHistory.value?.id === history.id) {
    selectedHistory.value = null
  }
}
</script>

<template>
  <aside class="w-58 flex flex-col bg-light-3 overflow-auto border-(0 r solid gray-2)">
    <div class="p-2 border-(0 b solid gray-2)">
      <Input
        v-model="state.search"
        clearable
        class="w-full"
        :placeholder="t('common.search')"
      />
    </div>
    <div ref="listContainer" class="flex-1 overflow-auto">
      <template v-if="historyState.data.length">
        <div
          v-for="h in historyState.data"
          :key="h.id"
          class="mx-2 my-1.5 px-2.5 py-2 rounded-md cursor-pointer border border-transparent transition-colors group"
          :class="selectedHistory?.id === h.id
            ? 'bg-white border-gray-3 shadow-sm'
            : 'hover:bg-light-5'"
          @click="selectedHistory = h"
        >
          <div class="w-full flex items-start gap-2">
            <div class="flex-1 w-0 truncate text-3.5 text-gray-8">
              {{ h.name || t('common.untitled') }}
            </div>
            <Icon
              class="i-carbon:trash-can cursor-pointer text-gray-5 hover:text-red opacity-0 group-hover:opacity-100 transition-opacity"
              @click.stop="handleDeleteHistory(h)"
            />
          </div>
          <div class="text-xs text-gray-5 mt-1">
            {{ dayjs.unix(h.createdDate).format("YYYY-MM-DD HH:mm:ss") }}
          </div>
        </div>
        <div v-if="historyState.loading" class="text-center text-gray-4 text-sm p-2">
          {{ t('common.loading') }}...
        </div>
      </template>
      <div v-else class="size-full flex items-center justify-center">
        <Empty />
      </div>
    </div>
    <div class="bottom-btn">
      <Button class="!rounded-0 w-full" @click="createNewChat">
        + {{ t('chat.newChat') }}
      </Button>
    </div>
  </aside>
</template>
