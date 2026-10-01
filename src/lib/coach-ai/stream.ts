// Decode upstream SSE incrementally. Only answer text crosses the server boundary.
export async function* minimaxTokens(body: ReadableStream<Uint8Array>, onFirstByte?: () => void): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = "", finished = false, receivedByte = false
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (value?.byteLength && !receivedByte) {
        receivedByte = true
        onFirstByte?.()
      }
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      if (buffer.length > 131072) throw new Error("Invalid upstream stream")
      let end: number
      while ((end = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, end).trim()
        buffer = buffer.slice(end + 1)
        if (!line.startsWith("data:")) continue
        const data = line.slice(5).trim()
        if (data === "[DONE]") {
          if (!finished) throw new Error("Incomplete upstream stream")
          return
        }
        const event = JSON.parse(data)
        if (event.error || event.base_resp?.status_code) throw new Error("Upstream error")
        const choice = event.choices?.[0]
        const token = choice?.delta?.content
        if (typeof token === "string" && token) yield token
        if (choice?.finish_reason) {
          if (!["stop", "length"].includes(choice.finish_reason)) throw new Error("Upstream refused")
          finished = true
        }
      }
      if (done) {
        if (!finished || buffer.trim()) throw new Error("Incomplete upstream stream")
        return
      }
    }
  } finally {
    await reader.cancel()
    reader.releaseLock()
  }
}
