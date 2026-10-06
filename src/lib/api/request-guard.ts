export function guardMutation(request: Request): Response | null {
 if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return null;
 const origin = request.headers.get("Origin");
 if (origin !== null && origin !== new URL(request.url).origin) return Response.json({ error: "Forbidden origin" }, { status: 403 });
 const type = request.headers.get("Content-Type");
 if (type !== null && type.split(";")[0].trim().toLowerCase() !== "application/json") return Response.json({ error: "Unsupported media type" }, { status: 415 });
 return null;
}
