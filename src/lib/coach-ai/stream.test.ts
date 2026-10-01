import { expect, test } from "vitest"
import { minimaxTokens } from "./stream"
const encoder = new TextEncoder()
const data = 'data: {"choices":[{"delta":{"reasoning_content":"hidden","content":"Café"}}]}\r\n\r\ndata: {"choices":[{"delta":{},"finish_reason":"stop"}]}\r\n\r\n'
async function collect(chunks: Uint8Array[]) {
  const stream = new ReadableStream<Uint8Array>({ start(c) { for (const chunk of chunks) c.enqueue(chunk); c.close() } })
  let text = ""
  for await (const token of minimaxTokens(stream)) text += token
  return text
}
test("SSE parser tolerates every byte boundary, CRLF and a provider EOF without DONE", async () => {
  const bytes = encoder.encode(data)
  for (let split=1;split<bytes.length;split++) expect(await collect([bytes.slice(0,split),bytes.slice(split)])).toBe("Café")
})
test.each([
  'data: {"choices":[{"delta":{"content":"partial"}}]}\n\n',
  'data: [DONE]\n\n',
  'data: {"error":{"message":"private detail"}}\n\n',
  'data: {"choices":[{"delta":{},"finish_reason":"content_filter"}]}\n\n',
])("refuses incomplete/error stream", async value => { await expect(collect([encoder.encode(value)])).rejects.toThrow() })
