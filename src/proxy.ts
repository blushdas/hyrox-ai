import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/auth/protected-routes";

export async function proxy(request: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const token = secret ? await getToken({ req: request, secret, secureCookie: request.nextUrl.protocol === "https:" }) : null;
  if (isProtectedPath(request.nextUrl.pathname) && !token) {
    const target = new URL("/sign-in", request.url);
    target.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(target);
  }
  if (request.nextUrl.pathname === "/sign-in" && token) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

// Next requires literal matchers for build-time analysis; tested against authMatcher.
export const config = { matcher: ["/dashboard/:path*", "/onboarding/:path*", "/plan/:path*", "/profile/:path*", "/session/:path*", "/sign-in"] };
