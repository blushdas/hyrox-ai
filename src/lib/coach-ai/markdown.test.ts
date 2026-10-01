import { describe, expect, it } from "vitest"
import { parseInline, parseMarkdown } from "./markdown"

describe("markdown blocks", () => {
  it.each([1, 2, 3, 4, 5, 6])("heading level %i", level => {
    expect(parseMarkdown(`${"#".repeat(level)} Training`)).toEqual([{ type: "heading", level, children: [{ type: "text", text: "Training" }] }])
  })
  it("preserves paragraph newlines", () => expect(parseMarkdown("one\ntwo")).toEqual([{ type: "paragraph", children: [{ type: "text", text: "one\ntwo" }] }]))
  it("normalizes CRLF only", () => expect(parseMarkdown("5.5 km\r\ne.g. https://a.test/x.y")).toEqual(parseMarkdown("5.5 km\ne.g. https://a.test/x.y")))
  it("bullets", () => expect(parseMarkdown("- one\n- two")[0]).toMatchObject({ type: "list", ordered: false, items: [[{ type: "text", text: "one" }], [{ type: "text", text: "two" }]] }))
  it("ordered lists preserve start", () => expect(parseMarkdown("3. three\n4. four")[0]).toMatchObject({ type: "list", ordered: true, start: 3 }))
  it("quote", () => expect(parseMarkdown("> one\n> two")[0]).toMatchObject({ type: "blockquote", children: [{ type: "text", text: "one\ntwo" }] }))
  it("fenced code stays literal", () => expect(parseMarkdown("```ts\n**literal**\n\nx()\n```")[0]).toEqual({ type: "code", language: "ts", text: "**literal**\n\nx()" }))
  it("tilde fence", () => expect(parseMarkdown("~~~\nx\n~~~")[0]).toMatchObject({ type: "code", text: "x" }))
  it("rule", () => expect(parseMarkdown("---")).toEqual([{ type: "hr" }]))
  it("table", () => expect(parseMarkdown("| A | B |\n| --- | :---: |\n| 1 | 2 |")[0]).toMatchObject({ type: "table", rows: [[[{ type: "text", text: "1" }], [{ type: "text", text: "2" }]]] }))
  it("table without separator stays text", () => expect(parseMarkdown("A | B\n1 | 2")[0].type).toBe("paragraph"))
  it("empty", () => expect(parseMarkdown("")).toEqual([]))
  it("unclosed fence", () => expect(parseMarkdown("```\nx")[0]).toMatchObject({ type: "code", text: "x" }))
})
describe("inline", () => {
  it.each(["**bold**", "__bold__"])("bold %s", input => expect(parseInline(input)).toEqual([{ type: "bold", children: [{ type: "text", text: "bold" }] }]))
  it.each(["*italic*", "_italic_"])("italic %s", input => expect(parseInline(input)[0].type).toBe("italic"))
  it("nested emphasis", () => expect(parseInline("**strong *em***")).toEqual([{ type: "bold", children: [{ type: "text", text: "strong " }, { type: "italic", children: [{ type: "text", text: "em" }] }] }]))
  it("inline code", () => expect(parseInline("`**literal**`")).toEqual([{ type: "code", text: "**literal**" }]))
  it("https link", () => expect(parseInline("[Guide](https://example.com/a.b)")[0]).toMatchObject({ type: "link", href: "https://example.com/a.b" }))
  it("http link", () => expect(parseInline("[Guide](http://example.com)")[0].type).toBe("link"))
  it("citation", () => expect(parseInline("[12]")).toEqual([{ type: "citation", index: 12 }]))
  it.each(["javascript:alert", "data:text/html,evil", "vbscript:evil", "//evil.test", "https://a.test/\u0000"])("inert URL %s", href => expect(parseInline(`[x](${href})`)).toEqual([{ type: "text", text: `[x](${href})` }]))
  it("HTML stays text", () => expect(parseInline('<script>alert(1)</script>')).toEqual([{ type: "text", text: '<script>alert(1)</script>' }]))
  it("punctuation untouched", () => expect(parseInline("5.5 km e.g. https://a.test/a.b Wow!Yes?No").map(node => node.type === "text" ? node.text : "MUTATED").join("")).toBe("5.5 km e.g. https://a.test/a.b Wow!Yes?No"))
  it("unclosed markup stays literal", () => expect(parseInline("**unfinished")).toEqual([{ type: "text", text: "**unfinished" }]))
  it("long and hostile delimiter lines finish quickly", () => {
    const start = performance.now()
    expect(parseMarkdown("a".repeat(20000))[0].type).toBe("paragraph")
    parseMarkdown("[".repeat(20000) + "]")
    expect(performance.now() - start).toBeLessThan(1000)
  })
})

it("triple emphasis", () => expect(parseInline("***both***")).toEqual([{ type: "bold", children: [{ type: "italic", children: [{ type: "text", text: "both" }] }] }]))

it("bare URL underscores stay intact", () => expect(parseInline("https://a.test/_foo_bar_")).toEqual([{type: "text", text: "https://a.test/_foo_bar_"}]))
it("URL parentheses stay intact", () => expect(parseInline("[x](https://a.test/a(b))")).toEqual([{type: "link", href: "https://a.test/a(b)", children: [{type:"text",text:"x"}]}]))
