import { expect, it } from "vitest"
import { pendingTail, splitStreaming } from "./stream-split"
it("empty stream", () => expect(splitStreaming("")).toEqual({ finalized: [], tail: "" }))
it("single tail", () => expect(splitStreaming("hello")).toEqual({ finalized: [], tail: "hello" }))
it("finalized paragraphs", () => expect(splitStreaming("**done**\n\nnext")).toEqual({ finalized: ["**done**"], tail: "next" }))
it("unclosed fence stays together", () => expect(splitStreaming("first\n\n```ts\nx\n\ny\n")).toEqual({ finalized: ["first"], tail: "```ts\nx\n\ny\n" }))
it("closed fence finalizes", () => expect(splitStreaming("~~~\na\n\nb\n~~~\n\nnext")).toEqual({ finalized: ["~~~\na\n\nb\n~~~"], tail: "next" }))
it("short fence does not close long fence", () => expect(splitStreaming("````\na\n```\n\nb").finalized).toEqual([]))
it("CRLF", () => expect(splitStreaming("a\r\n\r\nb")).toEqual({ finalized: ["a"], tail: "b" }))
it("whitespace blanks", () => expect(splitStreaming("a\n  \nb")).toEqual({ finalized: ["a"], tail: "b" }))
it("append-only finalized prefix remains stable", () => {
  const text = "one\n\n```\na\n\nb\n```\n\nlast"
  let previous: string[] = []
  for (let i = 0; i <= text.length; i++) {
    const result = splitStreaming(text.slice(0, i))
    expect(result.finalized.slice(0, previous.length)).toEqual(previous)
    previous = result.finalized
  }
})
it.each(["hi [", "hi [1", "hi **", "hi *", "hi `"])("withholds incomplete delimiter %s", text => expect(pendingTail(text)).toBe("hi "))
