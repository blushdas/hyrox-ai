import { expect, it } from "vitest"
import { toCopyText } from "./copy-text"
it("removes markers and preceding space", () => expect(toCopyText("Run [1], rest [22].")).toBe("Run, rest."))
it("removes adjacent markers", () => expect(toCopyText("Run[1][2]")).toBe("Run"))
it("preserves markdown and decimal", () => expect(toCopyText("**5.5 km**\ne.g. [Guide](https://a.test)")).toBe("**5.5 km**\ne.g. [Guide](https://a.test)"))
it("empty copy", () => expect(toCopyText("")).toBe(""))

it("card copy uses plain labels and removes markers", () => expect(toCopyText("## Coach's take\n**Keep it easy** [1]\n## Next move\n- Run.\n- Rest.\nConfidence: High - Plan [1]")).toBe("Coach's take\nKeep it easy\n\nNext move\nRun. Rest.\n\nConfidence: High - Plan"))
