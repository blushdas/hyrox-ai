export const protectedRoutes = ["/dashboard", "/onboarding", "/plan", "/profile", "/session", "/coach-ai", "/people"] as const;
export const authMatcher = ["/dashboard/:path*", "/onboarding/:path*", "/plan/:path*", "/profile/:path*", "/session/:path*", "/coach-ai/:path*", "/people/:path*", "/sign-in"];
export function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
