export const RATE_LIMIT_MESSAGE = "Too many messages. Wait a minute and try again."
export function createRateLimiter(limit = 20, windowMs = 5 * 60 * 1000) {
  const users = new Map<string, number[]>()
  const retryAfter = (userId: string, now = Date.now()): number => {
    const times = (users.get(userId) ?? []).filter(t => t > now - windowMs)
    return times.length < limit ? 0 : Math.ceil((times[0] + windowMs - now) / 1000)
  }
  const allow = (userId: string, now = Date.now()): boolean => {
    for (const [id, times] of users) if (times.at(-1)! <= now - windowMs) users.delete(id)
    const times = (users.get(userId) ?? []).filter(t => t > now - windowMs)
    if (times.length >= limit) return false
    users.set(userId, [...times, now])
    return true
  }
  return Object.assign(allow, { retryAfter })
}
// Best effort per Worker isolate; no shared/distributed state.
export const allowMessage = createRateLimiter()
