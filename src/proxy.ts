import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isProtectedPath } from "@/lib/auth/protected-routes";

export async function proxy(request: NextRequest) {
  const context = await getCloudflareContext({ async: true });
  const env = context.env as typeof context.env & { AUTH_SECRET?: string };
  const secret = env.AUTH_SECRET || process.env.AUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret, secureCookie: request.nextUrl.protocol === "https:" }) : null;
  if (isProtectedPath(request.nextUrl.pathname) && !token) {
    const target = new URL("/sign-in", request.url);
    target.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(target);
  }
  if (request.nextUrl.pathname === "/sign-in" && token) {
    // Only the native completion path may bypass the signed-in dashboard redirect.
    if (request.nextUrl.searchParams.get("callbackUrl") === "/auth/native-complete") return NextResponse.next();
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

// Next requires literal matchers for build-time analysis; tested against authMatcher.
export const config = { matcher: ["/dashboard/:path*", "/onboarding/:path*", "/plan/:path*", "/profile/:path*", "/session/:path*", "/coach-ai/:path*", "/people/:path*", "/sign-in"] };
