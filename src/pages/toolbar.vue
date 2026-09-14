<script lang="ts" setup>
import { useAsyncData } from '@0x-jerry/vue-kit'
import { useEventListener } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import AutoResizeContainer from '../components/AutoResizeContainer.vue'
import CarbonIcon from '../components/CarbonIcon.vue'
import { useI18n } from '../composables'
import { useWinEventListener } from '../composables/useWinEventListener'
import {
  type IPromptConfigModel,
  promptConfigTable,
} from '../database/promptConfig'
import { commands } from '../logic/commands'
import { WindowEventName } from '../logic/events'

const promptConfigsApi = useAsyncData(promptConfigTable.getAllSorted, [])

const { t } = useI18n()

const configs = computed(() => promptConfigsApi.data.value)
const activeIndex = ref(0)

const toolbarRef = useTemplateRef<HTMLElement>('toolbarRef')

promptConfigsApi.load()

watch(configs, () => {
  activeIndex.value = 0
})

useWinEventListener(WindowEventName.ToolbarShow, () => {
  activeIndex.value = 0
  promptConfigsApi.load()
})

useEventListener(window, 'keydown', handleKeydown)

async function openChatPage(conf: IPromptConfigModel) {
  await hideWindow()
  await commands.openChat({ promptId: conf.id.toString() })
}

async function hideWindow() {
  await commands.hideToolbarWindow()
}

function moveActive(delta: number) {
  const length = configs.value.length
  if (!length) return

  activeIndex.value = (activeIndex.value + delta + length) % length
}

function focusActiveItem() {
  const items = toolbarRef.value?.querySelectorAll<HTMLElement>(
    '[data-toolbar-item]',
  )

  items?.[activeIndex.value]?.focus()
}

function isToolbarItemFocused() {
  const el = document.activeElement

  return el instanceof HTMLElement && el.hasAttribute('data-toolbar-item')
}

function handleKeydown(evt: KeyboardEvent) {
  if (evt.key === 'Escape') {
    evt.preventDefault()
    void hideWindow()
    return
  }

  if (!configs.value.length) return

  if (
    evt.key === 'ArrowRight' ||
    evt.key === 'ArrowDown' ||
    evt.key === 'ArrowLeft' ||
    evt.key === 'ArrowUp'
  ) {
    const forward = evt.key === 'ArrowRight' || evt.key === 'ArrowDown'
    const focused = isToolbarItemFocused()

    evt.preventDefault()
    moveActive(forward ? 1 : -1)

    if (focused) {
      focusActiveItem()
    }
    return
  }

  if (/^[1-9]$/.test(evt.key)) {
    const hit = configs.value[Number(evt.key) - 1]
    if (!hit) return

    evt.preventDefault()
    void openChatPage(hit)
    return
  }

  if (evt.key === 'Enter' && !isToolbarItemFocused()) {
    const hit = configs.value[activeIndex.value]

    evt.preventDefault()
    if (hit) {
      void openChatPage(hit)
    }
  }
}
</script>

<template>
  <AutoResizeContainer>
    <div class="toolbar-wrap">
      <div ref="toolbarRef" class="toolbar" role="toolbar">
        <template v-if="configs.length">
          <button
            v-for="(conf, idx) in configs"
            :key="conf.id"
            data-toolbar-item
            type="button"
            class="toolbar-item"
            :class="{ 'is-active': idx === activeIndex }"
            :title="conf.name"
            :aria-label="conf.name"
            @click="openChatPage(conf)"
            @mouseenter="activeIndex = idx"
            @focus="activeIndex = idx"
          >
            <CarbonIcon v-if="conf.icon" :name="conf.icon" />
            <span v-else class="toolbar-label">{{ conf.name }}</span>
            <span v-if="idx < 9" class="toolbar-hint" aria-hidden="true">
              {{ idx + 1 }}
            </span>
          </button>
        </template>
        <span v-else class="toolbar-empty">{{ t('toolbar.noPrompts') }}</span>
      </div>
    </div>
  </AutoResizeContainer>
</template>

<style lang="scss" scoped>
.toolbar-wrap {
  padding: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.toolbar-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 28px;
  min-width: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color var(--duration-fast);

  &:hover,
  &.is-active {
    background: var(--color-surface-2);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 1px;
  }
}

.toolbar-label {
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toolbar-hint {
  position: absolute;
  top: 0;
  right: 2px;
  font-size: 9px;
  line-height: 1;
  color: var(--color-ink-faint);
  opacity: 0;
  transition: opacity var(--duration-fast);

  .toolbar-item:hover &,
  .toolbar-item:focus-visible &,
  .toolbar-item.is-active & {
    opacity: 1;
  }
}

.toolbar-empty {
  padding: 0 8px;
  font-size: 13px;
  color: var(--color-ink-faint);
}
</style>
