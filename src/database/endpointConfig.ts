import {
  normalizeThinkingLevel,
  type ThinkingLevel,
} from '../types'
import { bindAllMethodsToSelf } from '../utils'
import { type BaseModel, BaseModelManager } from './database'
import type { GetPureModelType } from './types'

export interface IEndpointConfigModel extends BaseModel {
  isBuiltin?: number
  name?: string
  baseUrl?: string
  apiKey?: string
  model?: string
  thinkingLevel?: ThinkingLevel
}

export type IEndpointConfigItem = GetPureModelType<IEndpointConfigModel>

class EndpointConfigTable extends BaseModelManager<IEndpointConfigModel> {
  TABLE_NAME = 'endpoint_config'
  COLUMN_NAMES = [
    'name',
    'baseUrl',
    'apiKey',
    'model',
    'isBuiltin',
    'thinkingLevel',
  ]

  constructor() {
    super({
      deserialize(key, value) {
        if (key === 'thinkingLevel') {
          return normalizeThinkingLevel(value)
        }

        return value
      },
    })
  }
}

export const endpointConfigTable = new EndpointConfigTable()

bindAllMethodsToSelf(endpointConfigTable)
