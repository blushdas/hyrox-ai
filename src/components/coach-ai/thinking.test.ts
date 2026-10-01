import { expect, test, vi } from "vitest"
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
