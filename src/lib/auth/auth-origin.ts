export function getAuthOrigin(): string {
  return process.env.NEXT_PUBLIC_AUTH_ORIGIN?.replace(/\/$/, "") ?? "";
}

export function safeCallbackUrl(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || /[\\\x00-\x20]/.test(value)) return "/dashboard";
  return value;
}
