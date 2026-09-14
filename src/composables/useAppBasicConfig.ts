import { createSharedComposable } from '@vueuse/core'
import { isEqual } from 'lodash-es'
import { ref, toRaw } from 'vue'
import { commands } from '../logic/commands'
import { WindowEventName } from '../logic/events'
import type { AppBasicConfig } from '../types'
import { useWinEventListener } from './useWinEventListener'

export const useAppBasicConfig = createSharedComposable(() => {
  const conf = ref<Partial<AppBasicConfig>>({})
  const loaded = ref(false)

  useWinEventListener(WindowEventName.ConfigurationChanged, () => {
    void reload()
  })

  return {
    get data() {
      return conf.value
    },
    get isLoaded() {
      return loaded.value
    },
    load: reload,
    save,
  }

  async function reload() {
    const new_conf = await commands.getConfiguration()

    loaded.value = true

    if (isEqual(conf.value, new_conf)) {
      return
    }

    conf.value = new_conf
  }

  async function save() {
    const new_conf = structuredClone(toRaw(conf.value)) as AppBasicConfig

    await commands.saveConfiguration({ conf: new_conf })
  }
})
