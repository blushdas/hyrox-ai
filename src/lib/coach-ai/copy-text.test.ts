import { expect, it } from "vitest"
import { toCopyText } from "./copy-text"
it("removes markers and preceding space", () => expect(toCopyText("Run [1], rest [22].")).toBe("Run, rest."))
it("removes adjacent markers", () => expect(toCopyText("Run[1][2]")).toBe("Run"))
it("preserves markdown and decimal", () => expect(toCopyText("**5.5 km**\ne.g. [Guide](https://a.test)")).toBe("**5.5 km**\ne.g. [Guide](https://a.test)"))
it("empty copy", () => expect(toCopyText("")).toBe(""))
