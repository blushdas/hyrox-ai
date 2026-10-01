export type Inline =
  | { type: "text" | "code"; text: string }
  | { type: "bold" | "italic"; children: Inline[] }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "citation"; index: number }
export type Block =
  | { type: "heading"; level: number; children: Inline[] }
  | { type: "paragraph"; children: Inline[] }
  | { type: "list"; ordered: boolean; start: number; items: Inline[][] }
  | { type: "blockquote"; children: Inline[] }
  | { type: "code"; text: string; language: string }
  | { type: "hr" }
  | { type: "table"; headers: Inline[][]; rows: Inline[][][] }

// One bounded scan; unmatched delimiters stay literal. Inline nesting is bounded.
export function parseInline(text: string, depth = 0): Inline[] {
  if (depth > 8) return [{ type: "text", text }]
  const result: Inline[] = []
  const tokens = /(`+|\*{1,3}|_{1,3}|\[|\]|\(|\))/g
  const positions = new Map<string, number[]>()
  for (const match of text.matchAll(tokens)) {
    const entries = positions.get(match[0]) ?? []
    entries.push(match.index)
    positions.set(match[0], entries)
    if (match[0] === "***" || match[0] === "___") {
      for (const [token, offset] of [[match[0][0], 0], [match[0].slice(0, 2), 1]] as const) {
        const nested = positions.get(token) ?? []
        nested.push(match.index + offset)
        positions.set(token, nested)
      }
    }
  }
  const parentheses = new Map<number, number>()
  const opens: number[] = []
  for (let offset = 0; offset < text.length; offset++) {
    if (text[offset] === "(") opens.push(offset)
    if (text[offset] === ")" && opens.length) parentheses.set(opens.pop()!, offset)
  }
  const cursors = new Map<string, number>()
  const next = (token: string, after: number) => {
    const entries = positions.get(token) ?? []
    let cursor = cursors.get(token) ?? 0
    while (cursor < entries.length && entries[cursor] < after) cursor++
    cursors.set(token, cursor)
    return entries[cursor] ?? -1
  }
  let plain = 0
  let i = 0
  const emit = (node: Inline, end: number) => {
    if (i > plain) result.push({ type: "text", text: text.slice(plain, i) })
    result.push(node)
    i = end
    plain = end
  }
  while (i < text.length) {
    const char = text[i]
    if (text.startsWith("https://", i) || text.startsWith("http://", i)) {
      let end = i
      while (end < text.length && !/\s/.test(text[end])) end++
      emit({ type: "text", text: text.slice(i, end) }, end)
      continue
    }
    if (char === "`") {
      let size = 1
      while (text[i + size] === "`") size++
      const end = next("`".repeat(size), i + size)
      if (end >= 0) { emit({ type: "code", text: text.slice(i + size, end) }, end + size); continue }
      i += size
      continue
    }
    if (char === "[") {
      const close = next("]", i + 1)
      const nested = next("[", i + 1)
      if (nested >= 0 && nested < close) { i++; continue }
      if (close >= 0 && text[close + 1] === "(") {
        const end = parentheses.get(close + 1) ?? -1
        if (end >= 0) {
          const href = text.slice(close + 2, end)
          if (/^https?:\/\//i.test(href) && !/[\s\u0000-\u001f]/.test(href)) {
            emit({ type: "link", href, children: parseInline(text.slice(i + 1, close), depth + 1) }, end + 1)
          } else emit({ type: "text", text: text.slice(i, end + 1) }, end + 1)
          continue
        }
      }
      if (close >= 0 && /^\d+$/.test(text.slice(i + 1, close))) {
        emit({ type: "citation", index: Number(text.slice(i + 1, close)) }, close + 1)
        continue
      }
    }
    if (char === "_" && /[a-z0-9]/i.test(text[i - 1] ?? "") && /[a-z0-9]/i.test(text[i + 1] ?? "")) { i++; continue }
    if (char === "*" || char === "_") {
      if (text.slice(i, i + 3) === char.repeat(3)) {
        const end = next(char.repeat(3), i + 3)
        if (end > i + 3) {
          emit({ type: "bold", children: [{ type: "italic", children: parseInline(text.slice(i + 3, end), depth + 1) }] }, end + 3)
          continue
        }
      }
      const delimiter = text[i + 1] === char ? char + char : char
      const end = next(delimiter, i + delimiter.length)
      if (end > i + delimiter.length) {
        emit({ type: delimiter.length === 2 ? "bold" : "italic", children: parseInline(text.slice(i + delimiter.length, end), depth + 1) }, end + delimiter.length)
        continue
      }
    }
    i++
  }
  if (plain < text.length) result.push({ type: "text", text: text.slice(plain) })
  return result
}

export function fenceStart(line: string) {
  return /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
}
export function fenceEnd(line: string, fence: string): boolean {
  const trimmed = line.trim()
  return trimmed.length >= fence.length && [...trimmed].every(char => char === fence[0])
}
const cells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim())
const separator = (line: string) => line.includes("|") && cells(line).every(cell => /^:?-{3,}:?$/.test(cell))
const heading = (line: string) => /^(#{1,6})\s+(.*)$/.exec(line)
const list = (line: string) => /^\s*(?:([-+*])|([0-9]+)\.)\s+(.*)$/.exec(line)
const hr = (line: string) => /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())

export function parseMarkdown(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  const starts = (i: number) => fenceStart(lines[i]) || heading(lines[i]) || hr(lines[i]) || /^>\s?/.test(lines[i]) || list(lines[i]) || (lines[i].includes("|") && separator(lines[i + 1] ?? ""))
  let i = 0
  while (i < lines.length) {
    if (!lines[i].trim()) { i++; continue }
    const fence = fenceStart(lines[i])
    if (fence) {
      const body: string[] = []
      i++
      while (i < lines.length && !fenceEnd(lines[i], fence[1])) body.push(lines[i++])
      if (i < lines.length) i++
      blocks.push({ type: "code", language: fence[2].trim(), text: body.join("\n") })
      continue
    }
    if (lines[i].includes("|") && separator(lines[i + 1] ?? "")) {
      const headers = cells(lines[i]).map(cell => parseInline(cell))
      const rows: Inline[][][] = []
      i += 2
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) rows.push(cells(lines[i++]).map(cell => parseInline(cell)))
      blocks.push({ type: "table", headers, rows }); continue
    }
    const h = heading(lines[i])
    if (h) { blocks.push({ type: "heading", level: h[1].length, children: parseInline(h[2]) }); i++; continue }
    if (hr(lines[i])) { blocks.push({ type: "hr" }); i++; continue }
    if (/^>\s?/.test(lines[i])) {
      const quote: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ""))
      blocks.push({ type: "blockquote", children: parseInline(quote.join("\n")) }); continue
    }
    const item = list(lines[i])
    if (item) {
      const ordered = Boolean(item[2])
      const items: Inline[][] = []
      while (i < lines.length) {
        const entry = list(lines[i])
        if (!entry || Boolean(entry[2]) !== ordered) break
        items.push(parseInline(entry[3])); i++
      }
      blocks.push({ type: "list", ordered, start: Number(item[2] ?? 1), items }); continue
    }
    const paragraph = [lines[i++]]
    while (i < lines.length && lines[i].trim() && !starts(i)) paragraph.push(lines[i++])
    blocks.push({ type: "paragraph", children: parseInline(paragraph.join("\n")) })
  }
  return blocks
}
