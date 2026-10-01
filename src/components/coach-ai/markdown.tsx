"use client"
import { Fragment, memo, useMemo } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { motionTransition } from "@/lib/motion"
import { parseInline, parseMarkdown, type Block, type Inline } from "@/lib/coach-ai/markdown"
import { pendingTail, splitStreaming } from "@/lib/coach-ai/stream-split"

type Props = { text: string; citationCount: number; messageId: string }
export const citationAnchor = (messageId: string, index: number) => `citation-${messageId}-${index}`
function Inlines({ nodes, citationCount, messageId }: { nodes: Inline[] } & Omit<Props, "text">) {
  return nodes.map((node, i) => {
    const children = "children" in node ? <Inlines nodes={node.children} citationCount={citationCount} messageId={messageId} /> : null
    switch (node.type) {
      case "text": return <Fragment key={i}>{node.text.split("\n").map((line, j) => <Fragment key={j}>{j > 0 && <br />}{line}</Fragment>)}</Fragment>
      case "code": return <code key={i} className="rounded-sm bg-surface-2 px-1 py-0.5 font-mono text-[13px]">{node.text}</code>
      case "bold": return <strong key={i} className="font-semibold text-text-1">{children}</strong>
      case "italic": return <em key={i}>{children}</em>
      case "link": return <a key={i} href={node.href} className="text-accent underline underline-offset-4">{children}</a>
      case "citation": return node.index > 0 && node.index <= citationCount
        ? <a key={i} href={`#${citationAnchor(messageId, node.index)}`} aria-label={`Source ${node.index}`} className="px-0.5 align-super font-mono text-[10px] text-accent">[{node.index}]</a>
        : <Fragment key={i}>[{node.index}]</Fragment>
    }
  })
}
function RenderBlock({ block, citationCount, messageId }: { block: Block } & Omit<Props, "text">) {
  const inline = (nodes: Inline[]) => <Inlines nodes={nodes} citationCount={citationCount} messageId={messageId} />
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
      return <Tag className="text-base font-semibold text-text-1">{inline(block.children)}</Tag>
    }
    case "paragraph": return <p>{inline(block.children)}</p>
    case "blockquote": return <blockquote className="border-l-2 border-hairline pl-4 text-text-2">{inline(block.children)}</blockquote>
    case "hr": return <hr className="border-hairline" />
    case "list": {
      const items = block.items.map((item, i) => <li key={i} className="pl-1">{inline(item)}</li>)
      return block.ordered ? <ol start={block.start} className="list-decimal space-y-1 pl-6">{items}</ol> : <ul className="list-disc space-y-1 pl-6">{items}</ul>
    }
    case "code": return <div role="region" aria-label="Code block" tabIndex={0} className="max-w-full overflow-x-auto rounded-md border border-hairline bg-surface-1"><pre className="w-max min-w-full p-4 font-mono text-[13px] leading-6"><code>{block.text}</code></pre></div>
    case "table": return <div role="region" aria-label="Response table" tabIndex={0} className="max-w-full overflow-x-auto rounded-md border border-hairline"><table className="w-full border-collapse text-left text-sm"><thead className="bg-surface-2"><tr>{block.headers.map((cell, i) => <th key={i} scope="col" className="min-w-32 border-b border-hairline px-3 py-2 font-semibold">{inline(cell)}</th>)}</tr></thead><tbody>{block.rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j} className="border-b border-hairline px-3 py-2 align-top">{inline(cell)}</td>)}</tr>)}</tbody></table></div>
  }
}
export const Markdown = memo(function Markdown({ text, citationCount, messageId }: Props) {
  const blocks = useMemo(() => parseMarkdown(text), [text])
  return <div className="min-w-0 max-w-prose space-y-4 text-text-1 leading-6 [overflow-wrap:anywhere]">{blocks.map((block, i) => <RenderBlock key={i} block={block} citationCount={citationCount} messageId={messageId} />)}</div>
})
function plain(nodes: Inline[]): string {
  return nodes.map(node => "children" in node ? plain(node.children) : node.type === "citation" ? `[${node.index}]` : node.type === "code" || /^https?:\/\//.test(node.text) ? node.text : node.text.replace(/\*\*|__/g, "")).join("")
}
export function StreamingMarkdown({ text, streaming, ...props }: Props & { streaming: boolean }) {
  const reduced = useReducedMotion()
  const { finalized, tail } = useMemo(() => splitStreaming(text), [text])
  const tailText = plain(parseInline(pendingTail(tail)))
  return <div className="min-w-0 space-y-4">
    {finalized.map((part, i) => <Markdown key={i} text={part} {...props} />)}
    {streaming ? <div className="whitespace-pre-wrap leading-6 [overflow-wrap:anywhere]">
      <motion.span key={tailText.length} initial={{ opacity: reduced ? 1 : 0.75 }} animate={{ opacity: 1 }} transition={motionTransition(reduced, true)}>{tailText}</motion.span>
      <span aria-hidden className="ml-1 inline-block h-3.5 w-0.5 bg-accent motion-safe:animate-pulse" />
    </div> : tail && <Markdown text={tail} {...props} />}
  </div>
}
