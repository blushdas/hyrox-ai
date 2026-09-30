import { auth } from "@/auth"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { buildSystemPrompt, tierForCategory } from "@/lib/coach-ai/prompt"
import { readRequest, MAX_TOKENS } from "@/lib/coach-ai/request"
import { allowMessage, RATE_LIMIT_MESSAGE } from "@/lib/coach-ai/rate-limit"
import { minimaxTokens } from "@/lib/coach-ai/stream"

type Bindings = { MINIMAX_API_KEY?: string; MINIMAX_MODEL?: string; MINIMAX_BASE_URL?: string }
const UNAVAILABLE = "Coach is unavailable right now. Please try again."
export async function POST(request: Request): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Sign in to use Coach AI." }, { status: 401 })
  let input
  try { input = await readRequest(request) }
  catch { return Response.json({ error: "Invalid request. Keep messages under 2000 characters." }, { status: 400 }) }
  if (!allowMessage(session.user.id)) return Response.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 })
  const abort = new AbortController()
  const disconnect = () => abort.abort()
  request.signal.addEventListener("abort", disconnect, { once: true })
  if (request.signal.aborted) abort.abort()
  const timer = setTimeout(() => abort.abort(), 45000)
  const cleanup = () => { clearTimeout(timer); request.signal.removeEventListener("abort", disconnect) }
  try {
    const { env } = await getCloudflareContext({ async: true })
    const bindings = env as typeof env & Bindings
    const read = (key: keyof Bindings) => bindings[key] || process.env[key]
    const key = read("MINIMAX_API_KEY")
    if (!key) throw new Error("Missing provider configuration")
    const model = read("MINIMAX_MODEL") || "MiniMax-M3"
    const response = await fetch(`${(read("MINIMAX_BASE_URL") || "https://api.minimax.io/v1").replace(/\/$/, "")}/chat/completions`, {
      method: "POST", signal: abort.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, max_tokens: MAX_TOKENS, stream: true, reasoning_split: true,
        ...(model === "MiniMax-M3" ? { thinking: { type: "disabled" } } : {}),
        messages: [{ role: "system", content: buildSystemPrompt({ tier: tierForCategory(input.context.category), context: input.context }) }, ...input.messages] }),
    })
    if (!response.ok || !response.body) throw new Error("Upstream unavailable")
    const tokens = minimaxTokens(response.body)
    // Fail with 502 while headers are still mutable, including empty/reasoning-only replies.
    const first = await tokens.next()
    if (first.done) throw new Error("Empty upstream answer")
    const encoder = new TextEncoder()
    let initial: string | undefined = first.value
    const body = new ReadableStream<Uint8Array>({
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
  } catch {
    abort.abort(); cleanup()
    return Response.json({ error: UNAVAILABLE }, { status: 502 })
  }
}
