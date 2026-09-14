import type { EventCallback } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { tryOnScopeDispose } from '@vueuse/core'
import type { TauriWindowEventMap } from '../logic/events'

export function useWinEventListener<Event extends keyof TauriWindowEventMap>(
  event: `${Event}`,
  handler: EventCallback<TauriWindowEventMap[Event]>,
) {
  const win = getCurrentWindow()

  const unlisten = win.listen(event, handler)

  tryOnScopeDispose(async () => {
    ;(await unlisten)()
  })
}
