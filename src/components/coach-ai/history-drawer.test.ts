import { createElement, isValidElement, type ReactElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, test, vi } from "vitest"
import { HistoryList, relativeTime } from "./history-drawer"
const thread = { id: "old", title: "Older", createdAt: 1, updatedAt: 1, archivedAt: null }
test.each(["loading", "idle", "ready", "error", "signedOut"] as const)("history %s state", status => {
  const html = renderToStaticMarkup(createElement(HistoryList, { threads: [], status, onSelect: vi.fn() }))
  expect(html).toContain(status === "ready" ? "No saved chats yet" : status === "error" ? "Saved chats could not load" : status === "signedOut" ? "" : "Loading saved chats")
  if (status === "signedOut") expect(html).toBe("")
})
test("newest first, title, relative time, selection and 44px target", () => {
  const onSelect = vi.fn()
  const tree = HistoryList({ threads: [thread, { ...thread, id: "new", title: "Newer", updatedAt: Date.now() }], status: "ready", onSelect })
  const html = renderToStaticMarkup(tree)
  expect(html.indexOf("Newer")).toBeLessThan(html.indexOf("Older"))
  expect(html).toContain("Just now"); expect(html).toContain("min-h-11")
  if (!isValidElement<{children: ReactElement<{children: ReactElement<{onClick: () => void}>}>[]}>(tree)) throw new Error("Missing list")
  tree.props.children[0].props.children.props.onClick()
  expect(onSelect).toHaveBeenCalledWith("new")
})
test("relative time boundaries and future timestamps", () => {
  const now = 200000000
  expect(relativeTime(now + 1, now)).toBe("Just now")
  expect(relativeTime(now - 60000, now)).toBe("1m ago")
  expect(relativeTime(now - 3600000, now)).toBe("1h ago")
  expect(relativeTime(now - 86400000, now)).toBe("1d ago")
})
