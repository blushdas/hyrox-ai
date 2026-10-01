import { auth } from "@/auth"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { buildSystemPrompt, tierForCategory } from "@/lib/coach-ai/prompt"
import { readRequest, MAX_TOKENS } from "@/lib/coach-ai/request"
import { allowMessage, RATE_LIMIT_MESSAGE } from "@/lib/coach-ai/rate-limit"
import { minimaxTokens } from "@/lib/coach-ai/stream"

import { webContext, WEB_UNAVAILABLE } from "@/lib/coach-ai/web-search"

type Bindings = { COHERE_API_KEY?: string; TAVILY_API_KEY?: string; MINIMAX_API_KEY?: string; MINIMAX_MODEL?: string; MINIMAX_BASE_URL?: string }
const UNAVAILABLE = "Coach is unavailable right now. Please try again."
export async function POST(request: Request): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Sign in to use Coach AI." }, { status: 401 })
  let input
  try { input = await readRequest(request) }
  catch { return Response.json({ error: "Invalid request. Keep messages under 2000 characters." }, { status: 400 }) }
  if (!allowMessage(session.user.id)) return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429, headers: { "Retry-After": String(allowMessage.retryAfter(session.user.id)) } })
  const abort = new AbortController()
  const disconnect = () => abort.abort()
  request.signal.addEventListener("abort", disconnect, { once: true })
  if (request.signal.aborted) abort.abort()
  const timer = setTimeout(() => abort.abort(), 45000)
  let firstByteTimer: ReturnType<typeof setTimeout> | undefined
  const cleanup = () => { clearTimeout(timer); clearTimeout(firstByteTimer); request.signal.removeEventListener("abort", disconnect) }
  try {
    const { env } = await getCloudflareContext({ async: true })
    const bindings = env as typeof env & Bindings
    const read = (key: keyof Bindings) => bindings[key] || process.env[key]
    const key = read("MINIMAX_API_KEY")
    if (!key) throw new Error("Missing provider configuration")
    const web = await webContext({ question: input.messages.at(-1)!.content, context: input.context, plannerKey: read("COHERE_API_KEY"), searchKey: read("TAVILY_API_KEY"), signal: abort.signal })
    const model = read("MINIMAX_MODEL") || "MiniMax-M3"
    firstByteTimer = setTimeout(() => abort.abort(), 30000)
    const response = await fetch(`${(read("MINIMAX_BASE_URL") || "https://api.minimax.io/v1").replace(/\/$/, "")}/chat/completions`, {
      method: "POST", signal: abort.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, stream: true, reasoning_split: true,
        ...(model === "MiniMax-M3" ? { thinking: { type: "disabled" } } : {}),
        messages: [{ role: "system", content: buildSystemPrompt({ tier: tierForCategory(input.context.category), context: input.context, webBlock: web.block }) }, ...input.messages] }),
    })
    if (!response.ok || !response.body) throw new Error(`Upstream unavailable (status ${response.status})`)
    const tokens = minimaxTokens(response.body, () => clearTimeout(firstByteTimer))
    // Fail with 502 while headers are still mutable, including empty/reasoning-only replies.
    const first = await tokens.next()
    if (first.done) throw new Error("Empty upstream answer")
    const encoder = new TextEncoder()
    let initial: string | undefined = first.value
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        if (web.sources.length) controller.enqueue(encoder.encode(JSON.stringify({ sources: web.sources }) + "\n"))
        if (web.unavailable) controller.enqueue(encoder.encode(JSON.stringify({ text: WEB_UNAVAILABLE + "\n\n" }) + "\n"))
      },
      async pull(controller) {
        try {
          const next = initial !== undefined ? { value: initial, done: false } : await tokens.next()
          initial = undefined
          controller.enqueue(encoder.encode(JSON.stringify(next.done ? { done: true } : { text: next.value }) + "\n"))
          if (next.done) { cleanup(); controller.close() }
        } catch {
          abort.abort(); cleanup()
          // HTTP status cannot change after first bytes. Explicit error frame, never upstream detail.
          controller.enqueue(encoder.encode(JSON.stringify({ error: UNAVAILABLE }) + "\n"))
          controller.close()
        }
      },
      async cancel() { abort.abort(); cleanup(); await tokens.return(undefined) },
    })
    return new Response(body, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } })
  } catch (error) {
    // Name and message only: never log the key, request body, or upstream response body.
    console.error("coach-ai upstream failure", error instanceof Error ? `${error.name}: ${error.message}` : "unknown")
    abort.abort(); cleanup()
    return Response.json({ error: UNAVAILABLE }, { status: 502 })
  }
}
