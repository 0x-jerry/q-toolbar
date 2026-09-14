<script lang="ts" setup>
import { getCurrentWindow } from '@tauri-apps/api/window'
import type { Awaitable } from '@vueuse/core'
import { useI18n } from '../composables'
import Icon from './Icon.vue'

export interface CloseWindowProps {
  close?: () => Awaitable<void>
}

const props = defineProps<CloseWindowProps>()

const { t } = useI18n()

const win = getCurrentWindow()

async function closeWindow() {
  if (props.close) {
    await props.close()
    return
  }

  await win.hide()
}
</script>

<template>
  <button
    type="button"
    class="close-window"
    :title="t('common.close')"
    @click.stop="closeWindow"
  >
    <Icon class="i-carbon:close" />
  </button>
</template>

<style lang="scss" scoped>
.close-window {
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
    background: var(--color-danger);
    color: #fff;
  }
}
</style>
