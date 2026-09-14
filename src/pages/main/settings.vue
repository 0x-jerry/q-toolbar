<script setup lang="ts">
import BasicSetting from '../../components/settings/BasicSetting.vue'
import PromptSetting from '../../components/settings/PromptSetting.vue'
import ProviderSetting from '../../components/settings/ProviderSetting.vue'
</script>

<template>
  <div class="page flex h-screen">
    <div class="content bg-surface flex-1 p-4 pt-2 overflow-auto flex flex-col gap-4">
      <BasicSetting class="section-content" />
      <ProviderSetting class="section-content" />
      <PromptSetting class="section-content" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.section-content {
  &:first-child {
    padding-top: 8px;
  }

  &:last-child {
    padding-bottom: 50vh;
  }
}
</style>
