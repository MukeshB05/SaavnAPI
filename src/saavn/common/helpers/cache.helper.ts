// Simple in-memory cache with TTL and a size cap.
// NOTE: on Vercel each serverless instance has its own memory, so this is a
// best-effort speed-up only, never a source of truth.
const MAX_ENTRIES = 500

const cache = new Map<string, { data: unknown; expiry: number }>()

export const getCached = <T>(key: string): T | null => {
  const entry = cache.get(key)

  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

export const setCached = <T>(key: string, data: T, ttlSeconds = 3600): void => {
  // Evict the oldest entry when full (Map keeps insertion order)
  if (cache.size >= MAX_ENTRIES) {
    const oldestKey = cache.keys().next().value
    if (oldestKey !== undefined) cache.delete(oldestKey)
  }

  cache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000
  })
}

export const clearCache = (): void => {
  cache.clear()
}

export const getCacheKey = (endpoint: string, params: Record<string, string | number>, context = ''): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')

  return `${context}|${endpoint}:${sortedParams}`
}
