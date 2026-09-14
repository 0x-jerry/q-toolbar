<script setup lang="ts">
import { Input } from 'tdesign-vue-next'
import ClickToEdit from '../../../components/ClickToEdit.vue'

interface MainChatHeaderProps {
  historyName: string
}

defineProps<MainChatHeaderProps>()

const emit = defineEmits<{
  rename: [name: string]
}>()
</script>

<template>
  <div class="flex gap-1 items-center p-2 border-b border-line">
    <div class="truncate w-200px">
      <ClickToEdit :value="historyName" @ok="emit('rename', $event)">
        <div class="w-full truncate">
          {{ historyName }}
        </div>
        <template #edit="{ value, update }">
          <Input class="w-full" :model-value="value" autofocus @update:model-value="update" />
        </template>
      </ClickToEdit>
    </div>
  </div>
</template>
