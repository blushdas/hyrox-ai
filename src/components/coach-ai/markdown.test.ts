import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { Markdown } from "./markdown"

const render = (text: string) => renderToStaticMarkup(createElement(Markdown, {
  text, citationCount: 1, messageId: "reply",
}))

describe("rendered reply links", () => {
  it.each(["http://example.com/guide", "https://example.com/guide"])("opens %s safely in a new tab", href => {
    const html = render(`[Guide](${href})`)
    const anchor = html.match(/<a\b[^>]*>/)?.[0]
    expect(anchor).toContain(`href="${href}"`)
    expect(anchor).toContain('target="_blank"')
    expect(anchor).toContain('rel="noopener noreferrer"')
  })

  it.each(["javascript:alert(1)", "data:text/html,unsafe", "vbscript:unsafe", "//example.com"])("keeps %s inert", href => {
    expect(render(`[Unsafe](${href})`)).not.toContain("<a ")
  })

  it("keeps citation anchors in the current chat", () => {
    const anchor = render("Source [1]").match(/<a\b[^>]*>/)?.[0]
    expect(anchor).toContain('href="#citation-reply-1"')
    expect(anchor).not.toContain("target=")
  })
})
