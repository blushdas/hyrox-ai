import { beforeEach, describe, expect, it, vi } from "vitest"
import { getInstallMode, isIosSafari, shouldOfferInstall } from "./install-banner"
import { INSTALL_DISMISSED_KEY, INSTALL_MAX_SEEN, INSTALL_SEEN_KEY, bumpInstallSeen, readInstallSeen, useInstallPromptStore, type InstallPromptEvent } from "@/stores/install-prompt-store"

const base = { native: false, standalone: false, dismissed: false, installed: false, hasEvent: true, isIosSafari: false }
const safari = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"

describe("install decision", () => {
  it("offers Chromium's deferred prompt", () => expect(getInstallMode(base)).toBe("prompt"))
  it("offers manual iOS instructions without an event", () => expect(getInstallMode({ ...base, hasEvent: false, isIosSafari: true })).toBe("ios"))
  it("hides unsupported browsers without an event", () => expect(getInstallMode({ ...base, hasEvent: false })).toBe("hidden"))
  for (const key of ["native", "standalone", "dismissed", "installed"] as const) {
    it(`hides ${key} even with an event or iOS`, () => {
      expect(getInstallMode({ ...base, [key]: true })).toBe("hidden")
      expect(getInstallMode({ ...base, hasEvent: false, isIosSafari: true, [key]: true })).toBe("hidden")
    })
  }
})

describe("iOS Safari detection", () => {
  it("recognizes iPhone and iPad", () => {
    expect(isIosSafari(safari, 5)).toBe(true)
    expect(isIosSafari(safari.replace("iPhone", "iPad"), 5)).toBe(true)
  })
  it("recognizes desktop-UA iPadOS only with touch", () => {
    const ua = safari.replace("iPhone; CPU iPhone OS 18_0 like Mac OS X", "Macintosh; Intel Mac OS X 10_15")
    expect(isIosSafari(ua, 5)).toBe(true)
    expect(isIosSafari(ua, 0)).toBe(false)
  })
  for (const token of ["CriOS", "FxiOS", "EdgiOS", "OPiOS", "GSA", "FBAN", "FBAV", "Instagram"]) {
    it(`excludes ${token}`, () => expect(isIosSafari(`${safari} ${token}/123`, 5)).toBe(false))
  }
  it("excludes embedded webviews and Android", () => {
    expect(isIosSafari(safari.replace("Version/18.0", ""), 5)).toBe(false)
    expect(isIosSafari("Mozilla/5.0 (Linux; Android 14) Chrome/130 Safari/537.36", 5)).toBe(false)
  })
})

describe("deferred install store", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    useInstallPromptStore.setState({ event: null, installed: false, dismissed: false, hydrated: false })
  })
  it("prompts once and clears the consumed event", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined)
    useInstallPromptStore.getState().setEvent(Object.assign(new Event("beforeinstallprompt"), { prompt, userChoice: Promise.resolve({ outcome: "accepted" as const, platform: "web" }) }))
    await useInstallPromptStore.getState().promptInstall()
    await useInstallPromptStore.getState().promptInstall()
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(useInstallPromptStore.getState().event).toBeNull()
  })
  it("dismisses for good only when the install is accepted", async () => {
    const setItem = vi.fn()
    vi.stubGlobal("window", { localStorage: { setItem } })
    const fake = (outcome: "accepted" | "dismissed") => ({ prompt: vi.fn().mockResolvedValue(undefined), userChoice: Promise.resolve({ outcome, platform: "web" }) }) as unknown as InstallPromptEvent
    useInstallPromptStore.getState().setEvent(fake("dismissed"))
    await useInstallPromptStore.getState().promptInstall()
    expect(useInstallPromptStore.getState().dismissed).toBe(false)
    expect(setItem).not.toHaveBeenCalled()
    useInstallPromptStore.getState().setEvent(fake("accepted"))
    await useInstallPromptStore.getState().promptInstall()
    expect(useInstallPromptStore.getState().dismissed).toBe(true)
    expect(setItem).toHaveBeenCalledWith(INSTALL_DISMISSED_KEY, "true")
  })
  it("clears failed events and reports the failure", async () => {
    const error = new Error("prompt unavailable")
    const report = vi.spyOn(console, "error").mockImplementation(() => undefined)
    useInstallPromptStore.getState().setEvent({ prompt: vi.fn().mockRejectedValue(error) } as unknown as InstallPromptEvent)
    await useInstallPromptStore.getState().promptInstall()
    expect(useInstallPromptStore.getState().event).toBeNull()
    expect(report).toHaveBeenCalledWith("Install prompt failed", error)
    report.mockRestore()
  })
  it("persists dismissal and marks installation", () => {
    const setItem = vi.fn()
    vi.stubGlobal("window", { localStorage: { setItem } })
    useInstallPromptStore.getState().dismiss()
    expect(setItem).toHaveBeenCalledWith(INSTALL_DISMISSED_KEY, "true")
    expect(useInstallPromptStore.getState().dismissed).toBe(true)
    useInstallPromptStore.getState().markInstalled()
    expect(useInstallPromptStore.getState().installed).toBe(true)
    expect(useInstallPromptStore.getState().event).toBeNull()
  })
  it("keeps session dismissal if storage is denied", () => {
    const report = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.stubGlobal("window", { localStorage: { setItem: () => { throw new Error("denied") } } })
    useInstallPromptStore.getState().dismiss()
    expect(useInstallPromptStore.getState().dismissed).toBe(true)
    expect(report).toHaveBeenCalled()
    report.mockRestore()
  })
})

describe("install impressions cap", () => {
  beforeEach(() => vi.unstubAllGlobals())
  it("offers until the cap, then stops for good", () => {
    expect(shouldOfferInstall(0)).toBe(true)
    expect(shouldOfferInstall(INSTALL_MAX_SEEN - 1)).toBe(true)
    expect(shouldOfferInstall(INSTALL_MAX_SEEN)).toBe(false)
  })
  it("counts each appearance in storage", () => {
    const store: Record<string, string> = {}
    vi.stubGlobal("window", { localStorage: { getItem: (k: string) => store[k] ?? null, setItem: (k: string, v: string) => { store[k] = v } } })
    expect(readInstallSeen()).toBe(0)
    bumpInstallSeen()
    bumpInstallSeen()
    expect(store[INSTALL_SEEN_KEY]).toBe("2")
    expect(shouldOfferInstall(readInstallSeen())).toBe(false)
  })
  it("fails closed when storage is denied", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.stubGlobal("window", { localStorage: { getItem: () => { throw new Error("denied") } } })
    expect(shouldOfferInstall(readInstallSeen())).toBe(false)
    warn.mockRestore()
  })
})
