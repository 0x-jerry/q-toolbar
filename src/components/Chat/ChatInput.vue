<script setup lang="ts">
import { Textarea, type TextareaValue } from 'tdesign-vue-next'
import { computed, ref } from 'vue'
import { useI18n } from '../../composables'
import Icon from '../Icon.vue'
import SelectMenu from '../SelectMenu.vue'

export interface ChatInputEndpointOption {
  id?: number
  name?: string
}

export interface ChatInputProps {
  isProcessing?: boolean
  endpointOptions?: ChatInputEndpointOption[]
}

export type ChatInputEmits = {
  send: [content: string]
  abort: []
}

const props = defineProps<ChatInputProps>()
const emit = defineEmits<ChatInputEmits>()
const { t } = useI18n()

const endpointConfigId = defineModel<number | undefined>('endpointConfigId')

const text = ref('')

const canSend = computed(() => text.value.trim().length > 0)
const hasEndpointOptions = computed(() => !!props.endpointOptions?.length)
const endpointSelectOptions = computed(() =>
  (props.endpointOptions ?? []).flatMap((c) =>
    c.id == null ? [] : [{ label: c.name ?? '', value: c.id }],
  ),
)

function send() {
  if (!canSend.value) return
  if (props.isProcessing) return

  emit('send', text.value.trim())

  text.value = ''
}

function onInputKeydown(_: TextareaValue, opt: { e: KeyboardEvent }) {
  const evt = opt.e
  evt.stopPropagation()

  if (evt.key === 'Escape') {
    ;(evt.target as HTMLInputElement).blur()
    return
  }

  if (evt.key === 'Enter') {
    const shouldSend = !(evt.shiftKey || evt.metaKey || evt.ctrlKey)

    if (shouldSend) {
      evt.preventDefault()
      send()
      return
    }
  }
}

function handleAbort() {
  if (!props.isProcessing) {
    return
  }

  emit('abort')
}
</script>

<template>
  <div class="composer">
    <Textarea
      class="composer-textarea"
      style="resize: none"
      v-model="text"
      @keydown="onInputKeydown"
      :placeholder="t('chat.typeMessage')"
      :autosize="{ minRows: 2, maxRows: 8 }"
    />

    <div class="composer-footer">
      <SelectMenu
        v-if="hasEndpointOptions"
        v-model="endpointConfigId"
        class="composer-endpoint"
        :options="endpointSelectOptions"
        :placeholder="t('chat.selectEndpoint')"
      />

      <button
        v-if="isProcessing"
        type="button"
        class="composer-action is-danger"
        :title="t('common.abort')"
        :aria-label="t('common.abort')"
        @click="handleAbort"
      >
        <div class="spinning-effect"></div>
        <Icon class="i-carbon:stop-filled-alt" />
      </button>
      <button
        v-else
        type="button"
        class="composer-action"
        :title="t('common.send')"
        :aria-label="t('common.send')"
        :disabled="!canSend"
        @click="send"
      >
        <Icon class="i-carbon:send-alt-filled" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.composer:focus-within {
  border-color: var(--color-accent);
}

.composer-textarea {
  width: 100%;
}

.composer-textarea :deep(.t-textarea__inner) {
  border: 0;
  outline: none;
  box-shadow: none;
  background: transparent;
  padding: 4px 2px;
  color: var(--color-ink);
}

.composer-textarea :deep(.t-textarea__inner:hover),
.composer-textarea :deep(.t-textarea__inner:focus),
.composer-textarea :deep(.t-textarea__inner.t-is-focused) {
  border-color: transparent;
  box-shadow: none;
}

.composer-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.composer-endpoint {
  max-width: 180px;
}

.composer-action {
  position: relative;
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-accent);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: opacity var(--duration-fast);
}

.composer-action:hover:not(:disabled) {
  opacity: 0.75;
}

.composer-action:disabled {
  color: var(--color-ink-faint);
  cursor: not-allowed;
}

.composer-action.is-danger {
  color: var(--color-danger);
}

.spinning-effect {
  --size: 24px;

  position: absolute;
  z-index: 0;
  top: 50%;
  left: 50%;
  width: var(--size);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);

  &::before {
    --border: 3px;
    --color: var(--color-danger);
    position: absolute;
    display: block;
    top: 0;
    left: 0;
    content: '';
    width: 100%;
    aspect-ratio: 1;
    border-radius: 50%;
    background:
      radial-gradient(farthest-side, var(--color) 94%, #0000) top/var(--border)
        var(--border) no-repeat,
      conic-gradient(#0000 30%, var(--color));

    mask: radial-gradient(
      farthest-side,
      #0000 calc(100% - var(--border)),
      #000 0
    );
    animation: l13 1s infinite linear;
  }
}

@keyframes l13 {
  100% {
    transform: rotate(1turn);
  }
}
</style>
