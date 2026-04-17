<script lang="ts" setup>
import { useAsyncData } from '@0x-jerry/vue-kit'
import { watchImmediate } from '@vueuse/core'
import {
  Button,
  Checkbox,
  Form,
  type FormInstanceFunctions,
  FormItem,
  Input,
  Select,
} from 'tdesign-vue-next'
import { useTemplateRef } from 'vue'
import { useI18n } from '../../composables'
import type { IEndpointConfigItem } from '../../database/endpointConfig'
import { fetchModelList } from '../../logic/modelListUtils'

export interface EndpointItemSettingProps {
  _?: unknown
}

const props = defineProps<EndpointItemSettingProps>()

const currentProviderConfig = defineModel<IEndpointConfigItem>({ required: true })
const { t } = useI18n()

const formRef = useTemplateRef<FormInstanceFunctions>('formRef')

const modelListApi = useAsyncData(updateModelList, [])

watchImmediate(currentProviderConfig, () => {
  modelListApi.load()
})

async function updateModelList(force = false) {
  const { baseUrl, apiKey } = currentProviderConfig.value

  if (!baseUrl) {
    return []
  }

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
  <div class="endpoint-item-setting">
    <Form ref="formRef" :data="currentProviderConfig" label-align="top">
      <FormItem :label="t('common.name')" name="name">
        <Input v-model="currentProviderConfig.name"></Input>
      </FormItem>
      <FormItem :label="t('common.baseUrl')" name="baseUrl">
        <Input v-model="currentProviderConfig.baseUrl"></Input>
      </FormItem>
      <FormItem :label="t('common.apiKey')" name="apiKey">
        <Input v-model="currentProviderConfig.apiKey" type="password"></Input>
      </FormItem>
      <FormItem :label="t('common.model')" name="model">
        <Select
          v-model="currentProviderConfig.model"
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
        <Checkbox v-model="currentProviderConfig.reasoning" ></Checkbox>
      </FormItem>
    </Form>
  </div>
</template>

<style lang="scss" scoped></style>
