import Database from '@tauri-apps/plugin-sql'
import dayjs from 'dayjs'

export const db = Database.get('sqlite:data.db')

export interface BaseModel {
  id: number
  createdDate: number
  updatedDate: number
}

interface PaginationParam {
  size?: number
  current: number
  /**
   * sort order
   */
  desc?: boolean
}

type CreatedModel<T extends BaseModel> = Omit<
  T,
  'id' | 'createdDate' | 'updatedDate'
>

type UpdatedModel<T extends BaseModel> = Omit<T, 'createdDate' | 'updatedDate'>

export const COMMON_COLUMN = {
  id: 'id',
  createdDate: 'createdDate',
  updatedDate: 'updatedDate',
} as const

const commonColumn = [COMMON_COLUMN.createdDate, COMMON_COLUMN.updatedDate]

export interface ModelOption {
  /**
   * When save data into database
   *
   * @param key
   * @param value
   * @returns
   */
  serialize?: (key: string, value: unknown) => unknown

  /**
   * When read data from database
   * @param key
   * @param data
   * @returns
   */
  deserialize?: (key: string, data: unknown) => unknown
}

export abstract class BaseModelManager<T extends BaseModel> {
  abstract readonly TABLE_NAME: string

  /**
   * Only custom columns, no need to include id/createdDate/updatedDate.
   */
  abstract readonly COLUMN_NAMES: string[]

  constructor(readonly opt?: ModelOption) {}

  readonly db = db

  _deserialize<T extends Record<string, any>>(data: T[]): T[] {
    const deserialize = this.opt?.deserialize

    if (!deserialize) {
      return data
    }

    return data.map((item) => {
      return Object.fromEntries(
        Object.entries(item).map(([key, value]) => [
          key,
          deserialize(key, value),
        ]),
      )
    }) as T[]
  }

  async count() {
    const sql = `select count(*) as count from ${this.TABLE_NAME}`

    const resp = await db.select<{ count: number }[]>(sql)

    return resp.at(0)?.count || 0
  }

  async page(opt: PaginationParam) {
    const { size = 10, current, desc } = opt

    const order = desc ? 'desc' : 'asc'

    const sql = `select * from ${this.TABLE_NAME} order by ${COMMON_COLUMN.id} ${order} limit ${size} offset ${size * current}`

    const resp = await db.select<T[]>(sql)

    return this._deserialize(resp)
  }

  async getById(id: number) {
    const sql = `select * from ${this.TABLE_NAME} where id = $1`

    const resp = await db.select<T[]>(sql, [id])

    return this._deserialize(resp).at(0)
  }

  async findAll() {
    const sql = `select * from ${this.TABLE_NAME} order by ${COMMON_COLUMN.id} desc`

    const resp = await db.select<T[]>(sql)

    return this._deserialize(resp)
  }

  async deleteById(id: number) {
    const sql = `delete from ${this.TABLE_NAME} where id = $1`

    const resp = await db.execute(sql, [id])

    return resp
  }

  async deleteBatchByIds(ids: number[]) {
    const keys = ids.map((_, idx) => `$${idx + 1}`).join(', ')
    const sql = `delete from ${this.TABLE_NAME} where id in (${keys})`

    const resp = await db.execute(sql, ids)

    return resp
  }

  async createOne(data: CreatedModel<T>) {
    const serialize = this.opt?.serialize

    const columns = [...commonColumn, ...this.COLUMN_NAMES]

    const columnNames = columns.join(', ')
    const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ')

    const values = [
      ...commonColumn.map((_) => dayjs().unix()),
      ...this.COLUMN_NAMES.map((key) => {
        const v = Reflect.get(data, key)
        return serialize ? serialize(key, v) : v
      }),
    ]

    const sql = `insert into ${this.TABLE_NAME} (${columnNames}) values (${placeholders})`

    const resp = await db.execute(sql, values)

    // biome-ignore lint/style/noNonNullAssertion: lastInsertId always exists.
    const createdItem = (await this.getById(resp.lastInsertId!))!

    return createdItem
  }

  async updateOne(data: UpdatedModel<T>, opt: IUpdateOneOption = {}) {
    const serialize = this.opt?.serialize

    const { columns = this.COLUMN_NAMES } = opt

    const allColumns = [COMMON_COLUMN.updatedDate, ...columns]

    const placeholders = allColumns
      .map((name, idx) => `${name} = $${idx + 1}`)
      .join(', ')

    const values = [
      dayjs().unix(),
      ...columns.map((key) => {
        const v = Reflect.get(data, key)
        return serialize ? serialize(key, v) : v
      }),
      data.id,
    ]

    const sql = `update ${this.TABLE_NAME} set ${placeholders} where id = $${allColumns.length + 1}`

    const resp = await db.execute(sql, values)

    return resp
  }
}

interface IUpdateOneOption {
  columns?: string[]
}
