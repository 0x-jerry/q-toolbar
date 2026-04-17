import { createCacheableFn } from './cache'
import { fetchWithProxy } from './fetchWithProxy';

interface ListModelResponse {
  object: 'list'
  data: { id: string; object: string }[]
}

async function _fetchModelList(opt: { baseUrl: string; apiKey?: string }) {
  const { baseUrl, apiKey } = opt

  if (!apiKey) {
    return []
  }

  const response = await fetchWithProxy(`${baseUrl}/models`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  })

  const resp: ListModelResponse = await response.json()

  console.log(resp)

  return resp.data.map((n) => ({
    label: n.id,
    value: n.id,
  }))
}

const fetchModelList = createCacheableFn(_fetchModelList, {
  getKey(opt) {
    return opt.baseUrl
  },
})

export { fetchModelList }
