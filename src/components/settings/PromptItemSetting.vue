<script lang="ts" setup>
import { useAsyncData } from '@0x-jerry/vue-kit'
import { watchImmediate } from '@vueuse/core'
import {
  Checkbox,
  Form,
  type FormInstanceFunctions,
  FormItem,
  Input,
  Select,
  Textarea,
} from 'tdesign-vue-next'
import { useTemplateRef } from 'vue'
import { useI18n } from '../../composables'
import { endpointConfigTable } from '../../database/endpointConfig'
import type { IPromptConfigItem } from '../../database/promptConfig'
import IconPicker from '../IconPicker.vue'
import { fetchModelList } from '../../logic/modelListUtils'

export interface PromptItemSettingProps {
  _?: unknown
}

const props = defineProps<PromptItemSettingProps>()

const currentPromptConfig = defineModel<IPromptConfigItem>({ required: true })
const { t } = useI18n()

const formRef = useTemplateRef<FormInstanceFunctions>('formRef')

const endpointsApi = useAsyncData(endpointConfigTable.findAll, [])

const modelListApi = useAsyncData(updateModelList, [])

watchImmediate(currentPromptConfig, () => {
  endpointsApi.load()
})

watchImmediate(
  () => currentPromptConfig.value.endpointId,
  () => {
    modelListApi.load()
  },
)

async function updateModelList(force = false) {
  if (!currentPromptConfig.value.endpointId) {
    return []
  }

  const endpointConfig = await endpointConfigTable.getById(
    currentPromptConfig.value.endpointId,
  )
  const { baseUrl, apiKey, model, reasoning } = endpointConfig || {}

  if (!baseUrl) {
    return []
  }

  currentPromptConfig.value.model = model
  currentPromptConfig.value.reasoning = reasoning

  if (force) {
    return fetchModelList.forceUpdate({
      baseUrl,
      apiKey,
    })
  }

  return fetchModelList({
    baseUrl,
    apiKey,
  })
}

function validate() {
  formRef.value?.validate()
}

defineExpose({
  validate,
})
</script>

<template>
  <div class="prompt-item-setting">
    <Form ref="formRef" :data="currentPromptConfig" label-align="top">
      <FormItem :label="t('common.name')" name="name">
        <div class="flex gap-1 w-full">
          <IconPicker v-model="currentPromptConfig.icon" />
          <Input class="flex-1" v-model="currentPromptConfig.name"></Input>
        </div>
      </FormItem>
      <FormItem :label="t('common.provider')" name="endpointId">
        <Select
          v-model="currentPromptConfig.endpointId"
          :options="endpointsApi.data.value"
          :keys="{ label: 'name', value: 'id' }"
        ></Select>
      </FormItem>
      <FormItem :label="t('common.model')" name="model">
        <Select
          v-model="currentPromptConfig.model"
          :options="modelListApi.data.value"
          :loading="modelListApi.isLoading.value"
          filterable
        >
          <template #panelBottomContent>
            <Button
              block
              variant="text"
              theme="primary"
              @click="modelListApi.load(true)"
              >{{ t('providersetting.refreshList') }}</Button
            >
          </template>
        </Select>
      </FormItem>
      <FormItem :label="t('common.reasoning')" name="reasoning">
        <Checkbox v-model="currentPromptConfig.reasoning"></Checkbox>
      </FormItem>
      <FormItem :label="t('common.prompt')" name="prompt">
        <Textarea
          v-model="currentPromptConfig.prompt"
          :placeholder="t('common.prompt')"
          :autosize="{ minRows: 3, maxRows: 5 }"
        ></Textarea>
      </FormItem>
    </Form>
  </div>
</template>

<style lang="scss" scoped></style>
