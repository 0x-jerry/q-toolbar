import dayjs from 'dayjs'
import type { IChatHistoryModel } from '../database/chatHistory'

export type HistoryGroupKey = 'today' | 'yesterday' | 'earlier'

export interface HistoryGroup {
  key: HistoryGroupKey
  items: IChatHistoryModel[]
}

export function groupHistoriesByDate(
  histories: IChatHistoryModel[],
  now: Date = new Date(),
): HistoryGroup[] {
  const startOfToday = dayjs(now).startOf('day')
  const startOfYesterday = startOfToday.subtract(1, 'day')

  const buckets: Record<HistoryGroupKey, IChatHistoryModel[]> = {
    today: [],
    yesterday: [],
    earlier: [],
  }

  histories.forEach((history) => {
    const date = dayjs.unix(history.createdDate)

    if (!date.isBefore(startOfToday)) {
      buckets.today.push(history)
    } else if (!date.isBefore(startOfYesterday)) {
      buckets.yesterday.push(history)
    } else {
      buckets.earlier.push(history)
    }
  })

  return (['today', 'yesterday', 'earlier'] as const)
    .map((key) => ({ key, items: buckets[key] }))
    .filter((group) => group.items.length > 0)
}
