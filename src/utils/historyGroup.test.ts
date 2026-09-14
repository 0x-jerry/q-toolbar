import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import type { IChatHistoryModel } from '../database/chatHistory'
import { groupHistoriesByDate } from './historyGroup'

function historyAt(date: dayjs.Dayjs, id: number): IChatHistoryModel {
  return {
    id,
    name: `#${id}`,
    createdDate: date.unix(),
    updatedDate: date.unix(),
  }
}

describe('groupHistoriesByDate', () => {
  const now = dayjs('2026-04-17T12:00:00')

  it('buckets histories into today, yesterday and earlier', () => {
    const groups = groupHistoriesByDate(
      [
        historyAt(now, 1),
        historyAt(now.subtract(1, 'day'), 2),
        historyAt(now.subtract(10, 'day'), 3),
      ],
      now.toDate(),
    )

    expect(groups.map((group) => group.key)).toEqual([
      'today',
      'yesterday',
      'earlier',
    ])
    expect(groups.map((group) => group.items.map((item) => item.id))).toEqual([
      [1],
      [2],
      [3],
    ])
  })

  it('drops empty buckets and keeps input order', () => {
    const groups = groupHistoriesByDate(
      [historyAt(now, 1), historyAt(now.subtract(5, 'day'), 2)],
      now.toDate(),
    )

    expect(groups.map((group) => group.key)).toEqual(['today', 'earlier'])
  })
})
