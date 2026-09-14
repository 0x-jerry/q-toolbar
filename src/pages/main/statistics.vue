<script lang="ts" setup>
import { useAsyncData } from '@0x-jerry/vue-kit'
import dayjs from 'dayjs'
import { DateRangePicker } from 'tdesign-vue-next'
import { computed, reactive, watch } from 'vue'
import Chart from '../../components/Chart.vue'
import { useI18n } from '../../composables'
import { selectionTable } from '../../database'

const { t } = useI18n()

const query = reactive({
  dates: [
    dayjs().add(-7, 'd').startOf('d').toDate(),
    dayjs().endOf('d').toDate(),
  ],
})

const selectionData = useAsyncData(() => {
  const start = dayjs(query.dates[0]).startOf('d')
  const end = dayjs(query.dates[1]).endOf('d')

  return selectionTable.groupDataBySelectedText({ start, end })
}, [])

watch(
  () => query,
  () => {
    const length = query.dates.filter((n) => n).length
    if (length < 2) return

    selectionData.load()
  },
  {
    deep: true,
    immediate: true,
  },
)

const chartData = computed(() => {
  const data = selectionData.data.value || []

  return {
    labels: data.map((n) => n.selected),
    datasets: [
      {
        data: data.map((n) => n.count),
      },
    ],
  }
})
</script>

<template>
  <div class="p-4">
    <div class="query mb-2">
      <span>{{ t('statistics.selectRange') }}</span>
      <DateRangePicker v-model="query.dates" />
    </div>
    <div class="flex justify-center">
      <div v-if="chartData.labels.length" class="chart-wrap">
        <Chart type="pie" :data="chartData" />
      </div>
      <div
        v-else
        class="text-center text-ink-faint h-100px text-lg flex items-center"
      >
        {{ t('statistics.noData') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chart-wrap {
  width: 420px;
  max-width: 100%;
}
</style>
