import { expect,it } from "vitest";
import { securityHeaders } from "./headers";
import config from "../../../next.config";
it("applies required security policy on every route without replacing stream content type",async()=>{
 expect(await config.headers?.()).toEqual([{source:"/:path*",headers:securityHeaders}]);
 const headers=Object.fromEntries(securityHeaders.map(h=>[h.key,h.value]));
 expect(headers["X-Content-Type-Options"]).toBe("nosniff");
 expect(headers["Strict-Transport-Security"]).toBe("max-age=31536000; includeSubDomains");
 expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
 expect(headers["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=(), payment=(), usb=()");
 const csp=headers["Content-Security-Policy"];
 expect(csp).toContain("frame-ancestors 'none'");expect(csp).toContain("object-src 'none'");
 expect(csp.split(";").find(s=>s.trim().startsWith("script-src"))).toBe(" script-src 'self' 'unsafe-inline'");
 expect(csp).not.toMatch(/unsafe-eval|\*/);expect(headers).not.toHaveProperty("Content-Type");
});
