<script setup lang="ts">
import { Input, Select } from 'tdesign-vue-next'
import ClickToEdit from '../../../components/ClickToEdit.vue'
import { useI18n } from '../../../composables'
import type { IEndpointConfigModel } from '../../../database/endpointConfig'

interface MainChatHeaderProps {
  historyName: string
  endpointOptions: IEndpointConfigModel[]
}

defineProps<MainChatHeaderProps>()

const endpointConfigId = defineModel<number | undefined>('endpointConfigId')

const emit = defineEmits<{
  rename: [name: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex gap-1 items-center p-2 border-(0 b solid gray-2)">
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
    <Select
      v-model="endpointConfigId"
      class="flex-1"
      :options="endpointOptions"
      :keys="{ label: 'name', value: 'id' }"
      :placeholder="t('chat.selectEndpoint')"
    />
  </div>
</template>
