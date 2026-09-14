<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window'
import CarbonIcon from '../../components/CarbonIcon.vue'
import CloseWindow from '../../components/CloseWindow.vue'
import DraggableArea from '../../components/DraggableArea.vue'
import Icon from '../../components/Icon.vue'
import { useI18n } from '../../composables'
import { commands } from '../../logic/commands'

export interface ChatPageHeadProps {
  icon?: string
  title?: string
}

defineProps<ChatPageHeadProps>()

const pinned = defineModel('pinned', { default: false })

const { t } = useI18n()

const win = getCurrentWindow()

async function togglePinWindow() {
  pinned.value = !pinned.value

  await win.setAlwaysOnTop(pinned.value)
  await commands.setChatPinned({ pinned: pinned.value })
}
</script>

<template>
  <header class="chat-head">
    <button
      type="button"
      class="chat-head-btn"
      :class="{ 'is-active': pinned }"
      :title="pinned ? t('common.unpin') : t('common.pin')"
      @click="togglePinWindow"
    >
      <Icon :class="pinned ? 'i-carbon:pin-filled' : 'i-carbon:pin'" />
    </button>

    <DraggableArea class="chat-head-title">
      <CarbonIcon v-if="icon" :name="icon" class="text-lg" />
      <span class="truncate">{{ title }}</span>
    </DraggableArea>

    <CloseWindow />
  </header>
</template>

<style lang="scss" scoped>
.chat-head {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 40px;
  padding: 0 6px;
  border-bottom: 1px solid var(--color-line);
  background: var(--color-surface);
  user-select: none;
}

.chat-head-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-ink-muted);
  cursor: pointer;
  transition:
    background-color var(--duration-fast),
    color var(--duration-fast);

  &:hover {
    background: var(--color-surface-2);
    color: var(--color-ink);
  }

  &.is-active {
    color: var(--color-accent);
  }
}

.chat-head-title {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 13px;
  color: var(--color-ink);
}
</style>
