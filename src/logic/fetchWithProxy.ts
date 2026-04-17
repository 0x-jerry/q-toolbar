import { fetch, type ClientOptions } from '@tauri-apps/plugin-http'
import { commands } from './commands'

export const fetchWithProxy: typeof globalThis.fetch = async (input, init) => {
  const appConfig = await commands.getConfiguration()
  const proxy = appConfig.proxy

  if (!proxy) {
    return fetch(input, init)
  }

  const config: RequestInit & ClientOptions = init || {}

  config.proxy = {
    all: {
      url: proxy,
    },
  }
  return fetch(input, init)
}
