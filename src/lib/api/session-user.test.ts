import { it, expect, vi } from "vitest";
vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";
import { getSessionUserId } from "./session-user";
it("reads identity only from the session", async () => {
 const mock = vi.mocked(auth);
 mock.mockResolvedValueOnce(null as never); expect(await getSessionUserId()).toBeNull();
 mock.mockResolvedValueOnce({ user: {} } as never); expect(await getSessionUserId()).toBeNull();
 mock.mockResolvedValueOnce({ user: { id: "alice" } } as never); expect(await getSessionUserId()).toBe("alice");
 mock.mockRejectedValueOnce(new Error("DB missing")); await expect(getSessionUserId()).rejects.toThrow("DB missing");
});
