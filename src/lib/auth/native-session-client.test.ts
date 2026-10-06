import { beforeEach,expect,it,vi } from "vitest";
const mocks=vi.hoisted(()=>({native:vi.fn(()=>true),available:vi.fn(()=>true),get:vi.fn(),set:vi.fn(),remove:vi.fn()}));
vi.mock("@capacitor/core",()=>({Capacitor:{isNativePlatform:mocks.native,isPluginAvailable:mocks.available}}));
vi.mock("@aparajita/capacitor-secure-storage",()=>({SecureStorage:{get:mocks.get,set:mocks.set,remove:mocks.remove},KeychainAccess:{whenUnlockedThisDeviceOnly:9}}));
import { storeNativeVerifier,takeNativeVerifier,exchangeNativeCode } from "./native-session-client";
beforeEach(()=>{vi.clearAllMocks();mocks.native.mockReturnValue(true);mocks.get.mockResolvedValue("v".repeat(43));});
it("stores verifier in device-only Keychain and takes it exactly once",async()=>{
 await storeNativeVerifier("v".repeat(43));expect(mocks.set).toHaveBeenCalledExactlyOnceWith("finisher-native-pkce","v".repeat(43),false,false,9);
 expect(await takeNativeVerifier()).toBe("v".repeat(43));expect(mocks.remove).toHaveBeenCalledExactlyOnceWith("finisher-native-pkce",false);
 mocks.get.mockResolvedValue(null);expect(await takeNativeVerifier()).toBeNull();
});
it("never falls back to web localStorage",async()=>{
 mocks.native.mockReturnValue(false);await expect(storeNativeVerifier("secret")).rejects.toThrow("Native secure storage is unavailable");expect(mocks.set).not.toHaveBeenCalled();
});
it("exchange carries verifier in JSON over HTTPS without cookies",async()=>{
 const fetcher=vi.spyOn(globalThis,"fetch").mockResolvedValue(Response.json({token:"token"}));
 try{expect(await exchangeNativeCode("https://example.com","code","verifier")).toBe("token");expect(fetcher).toHaveBeenCalledWith("https://example.com/api/native-auth/exchange",expect.objectContaining({credentials:"omit",body:JSON.stringify({code:"code",code_verifier:"verifier"})}));}finally{fetcher.mockRestore();}
});
