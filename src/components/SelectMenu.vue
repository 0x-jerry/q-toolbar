<script setup lang="ts" generic="T extends string | number">
import { onClickOutside } from '@vueuse/core'
import { computed, ref, useTemplateRef } from 'vue'
import Icon from './Icon.vue'

interface SelectMenuOption<T> {
  label: string
  value: T
}

interface SelectMenuProps<T> {
  options: SelectMenuOption<T>[]
  placeholder?: string
}

const props = defineProps<SelectMenuProps<T>>()
const model = defineModel<T>()

const rootEl = useTemplateRef<HTMLElement>('rootEl')

const isOpen = ref(false)
const activeIndex = ref(-1)

const selected = computed(() =>
  props.options.find((option) => option.value === model.value),
)

function open() {
  if (!props.options.length) return

  isOpen.value = true
  activeIndex.value = props.options.findIndex((o) => o.value === model.value)
}

function close() {
  isOpen.value = false
}

function toggle() {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

function select(option: SelectMenuOption<T>) {
  model.value = option.value
  close()
}

function moveActive(delta: number) {
  const length = props.options.length
  if (!length) return

  if (activeIndex.value === -1) {
    activeIndex.value = delta > 0 ? 0 : length - 1
    return
  }

  activeIndex.value = (activeIndex.value + delta + length) % length
}

function onKeydown(evt: KeyboardEvent) {
  evt.stopPropagation()

  if (evt.key === 'Escape') {
    close()
    return
  }

  if (!isOpen.value) {
    if (evt.key === 'Enter' || evt.key === ' ') {
      evt.preventDefault()
      open()
    }
    return
  }

  switch (evt.key) {
    case 'ArrowDown':
      evt.preventDefault()
      moveActive(1)
      break
    case 'ArrowUp':
      evt.preventDefault()
      moveActive(-1)
      break
    case 'Enter':
    case ' ': {
      evt.preventDefault()
      const option = props.options[activeIndex.value]
      if (option) select(option)
      break
    }
  }
}

onClickOutside(rootEl, close)
</script>

<template>
  <div class="select-menu" ref="rootEl">
    <button
      type="button"
      class="select-menu-trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="select-menu-label" :class="{ 'is-placeholder': !selected }">
        {{ selected?.label ?? placeholder }}
      </span>
      <Icon
        class="select-menu-arrow i-carbon:chevron-down"
        :class="{ 'is-open': isOpen }"
      />
    </button>

    <ul v-if="isOpen" class="select-menu-panel" role="listbox">
      <li
        v-for="(option, idx) in options"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
        class="select-menu-option"
        :class="{
          'is-active': idx === activeIndex,
          'is-selected': option.value === model,
        }"
        @mouseenter="activeIndex = idx"
        @click="select(option)"
      >
        {{ option.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.select-menu {
  position: relative;
  display: inline-flex;
  min-width: 0;
}

.select-menu-trigger {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  height: 24px;
  padding: 0 4px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-ink-muted);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  transition: color var(--duration-fast);
}

.select-menu-trigger:hover {
  color: var(--color-ink);
}

.select-menu-label {
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.select-menu-label.is-placeholder {
  color: var(--color-ink-faint);
}

.select-menu-arrow {
  flex: none;
  font-size: 14px;
  transition: transform var(--duration-fast);
}

.select-menu-arrow.is-open {
  transform: rotate(180deg);
}

.select-menu-panel {
  position: absolute;
  right: 0;
  bottom: calc(100% + 4px);
  z-index: 10;
  min-width: 160px;
  max-width: 260px;
  max-height: 240px;
  margin: 0;
  padding: 4px;
  overflow: auto;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  list-style: none;
}

.select-menu-option {
  overflow: hidden;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--color-ink);
  font-size: 13px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.select-menu-option.is-active {
  background: var(--color-surface-2);
}

.select-menu-option.is-selected {
  color: var(--color-accent);
}
</style>
