import { afterEach, expect, test, vi } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { Thinking, thinkingLabel } from "./thinking"

test("label switches to web search wording", () => {
  expect(thinkingLabel(false)).toBe("Coach is thinking")
  expect(thinkingLabel(true)).toBe("Searching the web")
})

test("renders a polite status region with the label", () => {
  const html = renderToStaticMarkup(createElement(Thinking, { searching: true }))
  expect(html).toContain('role="status"')
  expect(html).toContain('aria-live="polite"')
  expect(html).toContain("Searching the web")
  expect(html).toContain("min-h-11")
})

test("reduced motion renders a static bar scale", async () => {
  vi.resetModules()
  vi.doMock("framer-motion", async original => ({ ...(await original<typeof import("framer-motion")>()), useReducedMotion: () => true }))
  const mod = await import("./thinking")
  const html = renderToStaticMarkup(createElement(mod.Thinking, {}))
  expect(html).toContain("scaleY(0.6)")
  expect(html).toContain("Coach is thinking")
})


afterEach(() => {
  vi.doUnmock("react")
  vi.doUnmock("framer-motion")
  vi.resetModules()
})

test("details are closed by default with an accessible toggle", () => {
  const html = renderToStaticMarkup(createElement(Thinking))
  expect(html).toContain("See details")
  expect(html).toContain('aria-expanded="false"')
  expect(html).toContain('aria-controls="')
  expect(html).toContain('type="button"')
  expect(html).toContain("focus-visible:ring-2")
  expect(html).not.toContain("Reading your question against your plan.")
})

// Node-only Vitest has no DOM. Override the state hook for open-state SSR;
// browser QA separately verifies real click and keyboard state transitions.
test.each([false, true])("open panel markup and motion props (reduced=%s)", async reduced => {
  vi.resetModules()
  vi.doMock("react", async original => ({
    ...(await original<typeof import("react")>()),
    useState: () => [true, vi.fn()],
  }))
  const motions: Record<string, unknown>[] = []
  vi.doMock("framer-motion", async () => {
    const React = await import("react")
    const element = (tag: string) => (props: Record<string, unknown>) => {
      motions.push(props)
      const { children, initial, animate, exit, transition, ...dom } = props
      void initial; void animate; void exit; void transition
      return React.createElement(tag, dom, children as import("react").ReactNode)
    }
    return {
      useReducedMotion: () => reduced,
      AnimatePresence: ({ children }: { children: import("react").ReactNode }) => children,
      motion: { div: element("div"), span: element("span") },
    }
  })
  const { Thinking: OpenThinking } = await import("./thinking")
  const html = renderToStaticMarkup(createElement(OpenThinking, { searching: true, sourceCount: 1 }))
  expect(html).toContain("Hide details")
  expect(html).toContain('aria-expanded="true"')
  const panelId = html.match(/aria-controls="([^"]+)"/)?.[1]
  expect(html).toContain(`id="${panelId}"`)
  expect(html).toContain("lucide-scan-search")
  expect(html).toContain("Checking what the sources say before answering.")
  expect(html).not.toContain("Looking up current sources.")
  const live = html.split('aria-live="polite"')[1].split("</div>")[0]
  expect(live).toContain("Reviewing 1 source")
  expect(live).not.toContain("Hide details")
  expect(live).not.toContain("Checking what")
  const panel = motions.at(-1)!
  expect(panel.initial).toEqual(reduced ? false : { opacity: 0, y: 4 })
  expect(panel.exit).toEqual(reduced ? undefined : { opacity: 0, y: -4 })
  expect(panel.transition).toMatchObject({ duration: reduced ? 0 : 0.16 })
  if (reduced) {
    expect(motions.every(item => (item.transition as { duration: number }).duration === 0)).toBe(true)
    expect(motions.slice(0, -1).every(item => item.animate === undefined)).toBe(true)
  }
})


test("assistant passes received sources and removes Thinking on the first text", async () => {
  const { AssistantMessage } = await import("./chat")
  const message: import("@/lib/coach-ai/types").ChatMessage = {
    id: "thinking-test", role: "assistant", content: "", status: "streaming",
    createdAt: "2026-10-01T00:00:00Z", citations: [],
    webSources: [{ title: "Source", host: "example.com", url: "https://example.com" }],
  }
  const props = { message, searching: true, onRetry: () => {}, retryDisabled: true, lastAssistant: true }
  expect(renderToStaticMarkup(createElement(AssistantMessage, props))).toContain("Reviewing 1 source")
  const answering = renderToStaticMarkup(createElement(AssistantMessage, {
    ...props, message: { ...message, content: "First text" },
  }))
  expect(answering).not.toContain("See details")
  expect(answering).not.toContain("Reviewing 1 source")
})
