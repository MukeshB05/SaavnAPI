import { userAgents, type Endpoints } from '#common/constants'
import { HTTPException } from 'hono/http-exception'
import { getCached, setCached, getCacheKey } from './cache.helper'
import type { ApiContextEnum } from '#common/enums'

type EndpointValue = (typeof Endpoints)[keyof typeof Endpoints]

interface FetchParams {
  endpoint: EndpointValue
  params: Record<string, string | number>
  context?: ApiContextEnum
  cache?: boolean
  cacheTTL?: number
}

interface FetchResponse<T> {
  data: T
  ok: Response['ok']
}

// Keep the worst case well under the route's maxDuration (60s):
// 3 attempts x 12s + 2 backoffs (0.6s + 1.2s) is about 38s.
const MAX_RETRIES = 2
const ATTEMPT_TIMEOUT_MS = 12_000

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// JioSaavn answers 200 with an error body for bad ids / blocked requests,
// so such bodies must never be cached.
const isCacheable = (data: unknown) => {
  if (data === null || data === undefined) return false
  if (Array.isArray(data)) return data.length > 0
  if (typeof data !== 'object') return false

  const record = data as Record<string, unknown>
  if (Object.keys(record).length === 0) return false
  if (record.error) return false
  if (record.status === 'failure') return false

  return true
}

export const useFetch = async <T>({
  endpoint,
  params,
  context,
  cache: useCache = true,
  cacheTTL = 3600
}: FetchParams): Promise<FetchResponse<T>> => {
  const cacheKey = getCacheKey(endpoint.toString(), params, context || 'web6dot0')

  if (useCache) {
    const cached = getCached<T>(cacheKey)
    if (cached) return { data: cached, ok: true }
  }

  const url = new URL('https://www.jiosaavn.com/api.php')

  url.searchParams.append('__call', endpoint.toString())
  url.searchParams.append('_format', 'json')
  url.searchParams.append('_marker', '0')
  url.searchParams.append('api_version', '4')
  url.searchParams.append('ctx', context || 'web6dot0')

  Object.keys(params).forEach((key) => url.searchParams.append(key, String(params[key])))

  let lastError: HTTPException | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)
    let retryable = true

    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-IN,en;q=0.9'
        },
        signal: controller.signal,
        cache: 'no-store'
      })

      if (!response.ok) {
        // Only 429 / 5xx are worth retrying; other 4xx will not change
        retryable = response.status === 429 || response.status >= 500
        throw new HTTPException(502, { message: `JioSaavn API returned status ${response.status}` })
      }

      const text = await response.text()
      let data: T

      try {
        data = JSON.parse(text) as T
      } catch {
        // JioSaavn sometimes serves an HTML block / region page instead of JSON
        throw new HTTPException(502, { message: 'JioSaavn returned a non-JSON response (blocked or unavailable)' })
      }

      if (useCache && isCacheable(data)) setCached(cacheKey, data, cacheTTL)

      return { data, ok: response.ok }
    } catch (error) {
      if (error instanceof HTTPException) {
        lastError = error
      } else if (error instanceof Error && error.name === 'AbortError') {
        lastError = new HTTPException(504, { message: 'JioSaavn API timeout - service may be slow or unavailable' })
      } else {
        lastError = new HTTPException(502, {
          message: error instanceof Error ? error.message : 'Failed to fetch data from JioSaavn'
        })
      }

      if (!retryable || attempt === MAX_RETRIES) break

      await sleep(600 * (attempt + 1))
    } finally {
      clearTimeout(timeoutId)
    }
  }

  throw lastError || new HTTPException(502, { message: 'Failed to fetch data from JioSaavn' })
}
