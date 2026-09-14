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
import {
  groupHistoriesByDate,
  type HistoryGroupKey,
} from '../../../utils/historyGroup'

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

const groupLabels: Record<HistoryGroupKey, string> = {
  today: 'chat.groupToday',
  yesterday: 'chat.groupYesterday',
  earlier: 'chat.groupEarlier',
}

const groupedHistories = computed(() =>
  groupHistoriesByDate(historyState.data),
)

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

function selectHistory(history: IChatHistoryModel) {
  selectedHistory.value = history
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
  <aside class="history-sidebar">
    <div class="history-search">
      <Input
        v-model="state.search"
        clearable
        class="w-full"
        :placeholder="t('common.search')"
      />
    </div>

    <div ref="listContainer" class="history-list">
      <template v-if="historyState.data.length">
        <section
          v-for="group in groupedHistories"
          :key="group.key"
          class="history-group"
        >
          <div class="history-group-label">
            {{ t(groupLabels[group.key]) }}
          </div>

          <div
            v-for="h in group.items"
            :key="h.id"
            class="history-item"
            :class="{ 'is-selected': selectedHistory?.id === h.id }"
            role="button"
            tabindex="0"
            @click="selectHistory(h)"
            @keydown.enter.prevent.self="selectHistory(h)"
            @keydown.space.prevent.self="selectHistory(h)"
          >
            <div class="history-item-main">
              <div class="history-item-name">
                {{ h.name || t('common.untitled') }}
              </div>
              <button
                type="button"
                class="history-item-delete"
                :title="t('common.delete')"
                @click.stop="handleDeleteHistory(h)"
              >
                <Icon class="i-carbon:trash-can" />
              </button>
            </div>
            <div class="history-item-date">
              {{ dayjs.unix(h.createdDate).format('YYYY-MM-DD HH:mm') }}
            </div>
          </div>
        </section>

        <div v-if="historyState.loading" class="history-loading">
          {{ t('common.loading') }}...
        </div>
      </template>

      <div v-else class="history-empty">
        <Empty />
      </div>
    </div>

    <div class="history-footer">
      <Button block @click="createNewChat">
        + {{ t('chat.newChat') }}
      </Button>
    </div>
  </aside>
</template>

<style lang="scss" scoped>
.history-sidebar {
  display: flex;
  flex-direction: column;
  width: 232px;
  border-right: 1px solid var(--color-line);
  background: var(--color-surface-2);
}

.history-search {
  padding: 8px;
  border-bottom: 1px solid var(--color-line);
}

.history-list {
  flex: 1;
  overflow: auto;
  padding: 6px;
}

.history-group-label {
  padding: 8px 8px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.history-item {
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;

  &:hover {
    background: var(--color-surface-3);
  }

  &.is-selected {
    background: var(--color-surface);
    border-color: var(--color-line);
    box-shadow: var(--shadow-sm);
  }
}

.history-item-main {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.history-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: var(--color-ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item-delete {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--color-ink-faint);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity var(--duration-fast),
    color var(--duration-fast);

  .history-item:hover &,
  .history-item:focus-within & {
    opacity: 1;
  }

  &:hover {
    color: var(--color-danger);
  }
}

.history-item-date {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-ink-faint);
}

.history-loading {
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--color-ink-faint);
}

.history-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.history-footer {
  padding: 8px;
  border-top: 1px solid var(--color-line);
}
</style>
