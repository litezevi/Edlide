interface CacheEntry {
  blob: Blob
  objectUrl: string
  lastAccessed: number
}

const MAX_CACHE_SIZE = 5
const cache = new Map<string, CacheEntry>()

function evictOldest() {
  if (cache.size <= MAX_CACHE_SIZE) return
  let oldestKey = ''
  let oldestTime = Infinity
  cache.forEach((entry, key) => {
    if (entry.lastAccessed < oldestTime) {
      oldestTime = entry.lastAccessed
      oldestKey = key
    }
  })
  if (oldestKey) {
    const entry = cache.get(oldestKey)
    if (entry) {
      URL.revokeObjectURL(entry.objectUrl)
    }
    cache.delete(oldestKey)
  }
}

export function getCachedVideo(topicId: string): string | null {
  const entry = cache.get(topicId)
  if (!entry) return null
  entry.lastAccessed = Date.now()
  return entry.objectUrl
}

export async function cacheVideoFromUrl(topicId: string, presignedUrl: string): Promise<string> {
  const existing = cache.get(topicId)
  if (existing) {
    existing.lastAccessed = Date.now()
    return existing.objectUrl
  }

  try {
    const response = await fetch(presignedUrl, { mode: 'cors' })
    if (!response.ok) return presignedUrl

    const blob = await response.blob()
    if (blob.size === 0) return presignedUrl

    const objectUrl = URL.createObjectURL(blob)

    cache.set(topicId, {
      blob,
      objectUrl,
      lastAccessed: Date.now(),
    })

    evictOldest()
    return objectUrl
  } catch {
    return presignedUrl
  }
}

export function hasCachedVideo(topicId: string): boolean {
  return cache.has(topicId)
}

export function removeFromCache(topicId: string) {
  const entry = cache.get(topicId)
  if (entry) {
    URL.revokeObjectURL(entry.objectUrl)
    cache.delete(topicId)
  }
}

export function clearVideoCache() {
  cache.forEach((entry) => {
    URL.revokeObjectURL(entry.objectUrl)
  })
  cache.clear()
}
