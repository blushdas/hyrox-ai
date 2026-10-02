"use client"
import { Fragment, memo, useMemo, useState } from "react"
import { parseMarkdown, type Block, type Inline } from "@/lib/coach-ai/markdown"
import { splitStreaming } from "@/lib/coach-ai/stream-split"
import { REVEAL_FADE_MS, splitFadeText, withholdLiveCitation, type RevealBatch } from "@/lib/coach-ai/reveal"
import { EASE_OUT_EXPO } from "@/lib/motion"

type Props = { text: string; citationCount: number; messageId: string }
export const citationAnchor = (messageId: string, index: number) => `citation-${messageId}-${index}`
type Fade = { batches: RevealBatch[]; positions: WeakMap<Inline | Block, number[]> }
// Map rendered leaves back to received-text offsets without changing the parser.
// Blockquote/list prefixes and link URLs are syntax, not revealed glyphs.
function fadePositions(text: string, blocks: Block[], offset: number) {
  const positions = new WeakMap<Inline | Block, number[]>()
  let cursor = 0
  const locate = (value: string) => {
    const found = text.indexOf(value, cursor)
    const start = found < 0 ? cursor : found
    cursor = start + value.length
    return offset + start
  }
  const walk = (nodes: Inline[]) => {
    for (const node of nodes) {
      if ("text" in node) positions.set(node, node.text.split("\n").map(locate))
      else if (node.type === "citation") positions.set(node, [locate(`[${node.index}]`)])
      else {
        walk(node.children)
        if (node.type === "link") locate(`](${node.href})`)
      }
    }
  }
  for (const block of blocks) {
    if ("children" in block) walk(block.children)
    else if (block.type === "list") block.items.forEach(walk)
    else if (block.type === "table") { block.headers.forEach(walk); block.rows.forEach(row => row.forEach(walk)) }
    else if (block.type === "code") positions.set(block, [locate(block.text)])
  }
  return positions
}
const FadeBatch = memo(function FadeBatch({ text, born }: { text: string; born: number }) {
  // A formatting delimiter can remount a leaf. Resume its original fade age;
  // never restart the animation of text that was already revealed.
  const [age] = useState(() => Math.max(0, performance.now() - born))
  return <span data-reveal-batch className="coach-reveal-batch" style={{ animationDelay: `-${Math.min(REVEAL_FADE_MS, age)}ms` }}>{text}</span>
})
function FadeText({ text, start, batches }: { text: string; start: number; batches: RevealBatch[] }) {
  return splitFadeText(text, start, batches).map(piece => piece.born === null
    ? <Fragment key={piece.key}>{piece.text}</Fragment>
    : <FadeBatch key={piece.key} text={piece.text} born={piece.born} />)
}
const fadeStyle = `@keyframes coach-reveal-in { from { opacity: 0; transform: translateY(1px); } to { opacity: 1; transform: translateY(0); } }
.coach-reveal-batch { display: inline; animation: coach-reveal-in ${REVEAL_FADE_MS}ms cubic-bezier(${EASE_OUT_EXPO.join(",")}) both; }
@media (prefers-reduced-motion: reduce) { .coach-reveal-batch { animation: none; opacity: 1; transform: none; } }`
function Inlines({ nodes, citationCount, messageId, fade }: { nodes: Inline[]; fade?: Fade } & Omit<Props, "text">) {
  return nodes.map((node, i) => {
    const children = "children" in node ? <Inlines nodes={node.children} citationCount={citationCount} messageId={messageId} fade={fade} /> : null
    const reveal = (text: string, line = 0) => fade
      ? <FadeText text={text} start={fade.positions.get(node)?.[line] ?? 0} batches={fade.batches} /> : text
    switch (node.type) {
      case "text": return <Fragment key={i}>{node.text.split("\n").map((line, j) => <Fragment key={j}>{j > 0 && <br />}{reveal(line, j)}</Fragment>)}</Fragment>
      case "code": return <code key={i} className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[13px]">{reveal(node.text)}</code>
      case "bold": return <strong key={i} className="font-semibold text-text-1">{children}</strong>
      case "italic": return <em key={i}>{children}</em>
      case "link": return <a key={i} href={node.href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">{children}</a>
      case "citation": return node.index > 0 && node.index <= citationCount
        ? <a key={i} href={`#${citationAnchor(messageId, node.index)}`} aria-label={`Source ${node.index}`} className="px-0.5 align-super font-mono text-[10px] text-accent">{reveal(`[${node.index}]`)}</a>
        : <Fragment key={i}>{reveal(`[${node.index}]`)}</Fragment>
    }
  })
}
function RenderBlock({ block, citationCount, messageId, cursor = false, fade }: { block: Block; cursor?: boolean; fade?: Fade } & Omit<Props, "text">) {
  const caret = cursor ? <span aria-hidden data-reveal-caret className="relative inline-block w-0"><span className="absolute bottom-0 left-1 h-3.5 w-0.5 bg-accent motion-safe:animate-pulse" /></span> : null
  const inline = (nodes: Inline[]) => <Inlines nodes={nodes} citationCount={citationCount} messageId={messageId} fade={fade} />
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      return <Tag className="text-base font-semibold text-text-1">{inline(block.children)}{caret}</Tag>
    }
    case "paragraph": return <p>{inline(block.children)}{caret}</p>
    case "blockquote": return <blockquote className="border-l-2 border-hairline pl-4 text-text-2">{inline(block.children)}{caret}</blockquote>
    case "hr": return <hr className="border-hairline" />
    case "list": {
      const items = block.items.map((item, i) => <li key={i} className="pl-1">{inline(item)}{i === block.items.length - 1 && caret}</li>)
      return block.ordered ? <ol start={block.start} className="list-decimal space-y-1 pl-6">{items}</ol> : <ul className="list-disc space-y-1 pl-6">{items}</ul>
    }
    case "code": return <div role="region" aria-label="Code block" tabIndex={0} className="max-w-full overflow-x-auto rounded-md border border-hairline bg-surface-1"><pre className="w-max min-w-full p-4 font-mono text-[13px] leading-6"><code>{fade ? <FadeText text={block.text} start={fade.positions.get(block)?.[0] ?? 0} batches={fade.batches} /> : block.text}{caret}</code></pre></div>
    case "table": return <div role="region" aria-label="Response table" tabIndex={0} className="max-w-full overflow-x-auto rounded-md border border-hairline"><table className="w-full border-collapse text-left text-sm"><thead className="bg-surface-2"><tr>{block.headers.map((cell, i) => <th key={i} scope="col" className="min-w-32 border-b border-hairline px-3 py-2 font-semibold">{inline(cell)}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-hairline px-3 py-2 align-top">{inline(cell)}</td>)}</tr>)}</tbody></table></div>
  }
}
export const Markdown = memo(function Markdown({ text, citationCount, messageId, cursor = false, batches, sourceOffset = 0 }: Props & { cursor?: boolean; batches?: RevealBatch[]; sourceOffset?: number }) {
  const blocks = useMemo(() => parseMarkdown(text), [text])
  const hasFade = Boolean(batches)
  const positions = useMemo(() => hasFade ? fadePositions(text, blocks, sourceOffset) : undefined, [text, blocks, sourceOffset, hasFade])
  const fade = batches && positions ? { batches, positions } : undefined
  const last = blocks[blocks.length - 1]
  const fallbackCaret = cursor && (!last || last.type === "table" || last.type === "hr")
  return <div className={`relative min-w-0 max-w-prose space-y-4 text-text-1 leading-6 [overflow-wrap:anywhere] ${cursor && !last ? "min-h-6" : ""}`}>
    {blocks.map((block, i) => <RenderBlock key={i} block={block} citationCount={citationCount} messageId={messageId} cursor={cursor && i === blocks.length - 1} fade={fade} />)}
    {fallbackCaret && <span data-reveal-caret aria-hidden className="absolute bottom-1 left-0 h-3.5 w-0.5 bg-accent motion-safe:animate-pulse" />}
  </div>
})
export const StreamingMarkdown = memo(function StreamingMarkdown({ text, streaming, batches, ...props }: Props & { streaming: boolean; batches?: RevealBatch[] }) {
  const { finalized, tail } = useMemo(() => splitStreaming(text), [text])
  // Parse the live block with the same renderer as settled blocks. Trimming only
  // trailing newlines prevents a blank line from briefly adding an extra line.
  const live = streaming ? withholdLiveCitation(tail.trimEnd()).trimEnd() : tail
  return <div className="min-w-0 max-w-prose space-y-4 text-text-1 leading-6 [overflow-wrap:anywhere]">
    <style>{fadeStyle}</style>
    {finalized.map((part, i) => <Markdown key={i} text={part} {...props} />)}
    {(live || streaming) && <div className="relative">
      <Markdown text={live} {...props} cursor={streaming} batches={batches} sourceOffset={text.length - tail.length} />
    </div>}
  </div>
})
